import * as core from '@actions/core'
import {RequestKey, processRequest} from './lib'

type RequestMap = {[key in RequestKey]: string}

/// action.yml name mappings
// allows us to change the yaml without rewriting code
const paramNames: RequestMap = {
  apiKey: 'apiKey',
  version: 'version',
  categorySlug: 'categorySlug',
  parentSlug: 'parentSlug',
  titleRegex: 'titleRegex',
  titlePrefix: 'titlePrefix',
  path: 'path',
  additionalJson: 'additionalJson',
  create: 'create',
  overwrite: 'overwrite',
  clear: 'clear'
}

// params that are allowed to be empty
const allowedEmptyParams: (keyof RequestMap)[] = ['parentSlug', 'titlePrefix']

class InputMissingError extends Error {
  constructor(inputName: string) {
    super(`❌ Missing required input: ${inputName}`)
  }
}

async function run(): Promise<void> {
  try {
    // parse the inputs
    const inputs = Object.entries(paramNames).reduce((prev, curr) => {
      const nxt = {...prev}
      const [paramId, inputName] = curr as [RequestKey, string]

      nxt[paramId] = core.getInput(inputName)

      return nxt
    }, {} as RequestMap)

    // check the inputs
    // this assumes that non-required action.yml inputs have default values
    for (const paramId in paramNames) {
      if (
        (!inputs[paramId as RequestKey] ||
          inputs[paramId as RequestKey].length === 0) &&
        !allowedEmptyParams.includes(paramId as RequestKey)
      ) {
        throw new InputMissingError(paramId)
      }
    }

    // execute work
    await processRequest(inputs)

    core.info('🚀 Complete.')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else if (typeof error === 'object') {
      core.setFailed(`Failed with error: ${JSON.stringify(error)}`)
    } else {
      core.setFailed(`Failed with error: ${error}`)
    }
  }
}

process.on('exit', (code: number): void => {
  if (code !== 0) {
    core.setFailed(`Exiting with code: ${code}`)
  } else {
    core.info(`Exiting with code: ${code}`)
  }
})

// begin - actions entrypoint
// eslint-disable-next-line github/no-then
run().catch(error => core.setFailed(`Failed with error: ${error}`))
