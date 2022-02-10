/* eslint-disable github/no-then */
import 'global-agent/bootstrap'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import fetch from 'node-fetch-cjs'
import fs from 'fs'
import path from 'path'

export interface SlimDoc {
  title: string
  _id: string
  slug: string
  order: number
  hidden: boolean
  children: SlimDoc[]
}

// determined from API inspection
// see https://docs.readme.com/reference/getdoc
export interface Doc extends SlimDoc {
  metadata: {
    image: string[]
    title: string
    description: string
  }
  api: unknown
  next: unknown
  updates: string[]
  error?: {
    code: string
  }
  type: string
  excerpt: string
  body: string
  isReference: boolean
  deprecated: boolean
  sync_unique: string
  link_url: string
  link_external: boolean
  pendingAlgoliaPublish: boolean
  previousSlug: string
  slugUpdatedAt: string
  createdAt: string
  updatedAt: string
  user: string
  category: string
  project: string
  version: string
  __v: number
  parentDoc?: unknown
  isApi: boolean
  id: string
  body_html: string
}

export interface Category {
  title: string
  slug: string
  order: number
  reference: boolean
  isAPI: boolean
  _id: string
  project: string
  version: string
}

export interface ApiOptions {
  'x-readme-version'?: string
}

export interface GetDocsForCategoryOptions extends ApiOptions {
  slug: string
}

export interface DeleteDocOptions extends ApiOptions {
  slug: Doc['slug']
}

export interface GetDocOptions extends ApiOptions {
  slug: Doc['slug']
}

export interface GetCategoryOptions extends ApiOptions {
  slug: Category['slug']
}

export type UpdateDocOptions = ApiOptions &
  Partial<Doc> & {
    title: Doc['title']
    category: Doc['category']
    slug: Doc['slug']
  }

export type CreateDocOptions = ApiOptions &
  Partial<Doc> & {
    title: Doc['title']
    category: Doc['category']
  }

export interface ReadmeApi {
  auth(apiKey: string): void
  getDoc(opts: GetDocOptions): Promise<Doc>
  getCategory(opts: GetCategoryOptions): Promise<Category>
  updateDoc(opts: UpdateDocOptions): Promise<Doc>
  createDoc(opts: CreateDocOptions): Promise<Doc>
  deleteDoc(opts: DeleteDocOptions): Promise<void>
  getCategoryDocs(opts: GetDocsForCategoryOptions): Promise<SlimDoc[]>
}

export interface Request {
  apiKey: string
  version: string
  categorySlug: string
  titleRegex: string
  path: string
  additionalJson: string
  create: string
  overwrite: string
  clear: string
}

export type RequestKey = keyof Request

const True = 'true'

export async function processRequest(input: Request): Promise<void> {
  const options = {
    method: 'GET',
    headers: {
      'x-readme-version': input.version,
      Accept: 'application/json',
      Authorization: `Basic ${input.apiKey}`
    }
  }

  // we'll clear the category first if desired
  if (input.clear === True) {
    core.info(`📃 Attempting category '${input.categorySlug}' enumeration...`)

    const docs = (await fetch(
      `https://dash.readme.com/api/v1/categories/${input.categorySlug}/docs`,
      options
    )
      .then(async res => {
        if (!res.ok) {
          const body = await res.text()
          throw new Error(`${res.status}: ${body}`)
        } else {
          return res
        }
      })
      .then(async res => await res.json())) as SlimDoc[]

    const childDocs = docs.flatMap(d => d.children)

    core.info(
      `📃 Found ${docs.length} docs with ${childDocs.length} children. Attempting category '${input.categorySlug}' clear...`
    )

    await Promise.all(
      childDocs.map(async d =>
        fetch(`https://dash.readme.com/api/v1/docs/${d.slug}`, {
          ...options,
          method: 'DELETE'
        }).then(async res => {
          if (!res.ok) {
            const body = await res.text()
            throw new Error(`${res.status}: ${body}`)
          } else {
            return res
          }
        })
      )
    )

    core.info(`📃 Children destroyed`)

    await Promise.all(
      docs.map(async d =>
        fetch(`https://dash.readme.com/api/v1/docs/${d.slug}`, {
          ...options,
          method: 'DELETE'
        }).then(async res => {
          if (!res.ok) {
            const body = await res.text()
            throw new Error(`${res.status}: ${body}`)
          } else {
            return res
          }
        })
      )
    )

    core.info(`📃 Parents destroyed`)

    core.info(`📃 Category '${input.categorySlug}' cleared`)
  } else {
    core.info(`📃 Skipping category clear (clear input was '${input.clear}')`)
  }

  // find all the docs from path
  const globber = await glob.create(input.path)
  const files = await globber.glob()

  if (files.length === 0) {
    core.warning(
      `⚠️  No files found to upload. Searched with glob '${input.path}'.`
    )

    // exit early, no further work needed
    return
  }

  core.info(`📃 Attempting to get info for category '${input.categorySlug}'...`)

  const category = (await fetch(
    `https://dash.readme.com/api/v1/categories/${input.categorySlug}`,
    options
  )
    .then(async res => {
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`${res.status}: ${body}`)
      } else {
        return res
      }
    })
    .then(async res => await res.json())) as Category

  core.info(`📃 Attempting to parse titleRegex '${input.titleRegex}'`)
  const titleRegex = new RegExp(input.titleRegex)

  core.info(`📃 Attempting to parse additionalJson '${input.additionalJson}'`)

  const baseRequest = JSON.parse(input.additionalJson)

  core.info(`📃 Attempting to upload ${files.length} docs...`)

  // create a helper func for the creation/update work
  const createOrUpdate = async (file: string): Promise<void> => {
    const fileContents = await fs.promises.readFile(file, {encoding: 'utf8'})
    const fileTileMatches = titleRegex.exec(fileContents)

    // if we can't find a title, fail
    if (!fileTileMatches || fileTileMatches.length <= 1) {
      throw new Error(
        `❌  Unable to find title for file '${file}' using regex '${input.titleRegex}'.`
      )
    }

    const fileTitle = fileTileMatches[1].trim()

    try {
      if (input.create === True) {
        core.info(`📃 Attempting to create '${file}' as a document...`)
        await fetch('https://dash.readme.com/api/v1/docs', {
          ...options,
          method: 'POST',
          headers: {...options.headers, 'Content-Type': 'application/json'},
          body: JSON.stringify({
            ...baseRequest,
            title: fileTitle,
            slug: path.basename(file, path.extname(file)).trim(),
            category: category._id,
            body: fileContents
          })
        }).then(async res => {
          if (!res.ok) {
            const body = await res.text()
            throw new Error(`${res.status}: ${body}`)
          } else {
            return res
          }
        })
      } else {
        // throw an empty error to enter the catch clause and attempt update
        throw new Error()
      }
    } catch (e) {
      if (e instanceof Error && e.message.length > 0) {
        core.warning(`⚠️  Creating doc failed: ${e}`)
      }

      if (input.overwrite === True) {
        core.info(`📃 Attempting to update '${file}' document...`)
        await fetch(
          `https://dash.readme.com/api/v1/docs/${path
            .basename(file, path.extname(file))
            .trim()}`,
          {
            ...options,
            method: 'PUT',
            headers: {...options.headers, 'Content-Type': 'application/json'},
            body: JSON.stringify({
              ...baseRequest,
              title: fileTitle,
              category: category._id,
              body: fileContents
            })
          }
        ).then(async res => {
          if (!res.ok) {
            const body = await res.text()
            throw new Error(`${res.status}: ${body}`)
          } else {
            return res
          }
        })
      } else {
        // rethrow
        throw e
      }
    }
  } // end createOrUpdate

  // call create or update on each file
  await Promise.all(files.map(async f => createOrUpdate(f)))

  core.info(`📃 Upload complete`)
}
