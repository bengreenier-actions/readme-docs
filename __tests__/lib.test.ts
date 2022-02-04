import {fs} from 'memfs'
import api from 'api'
import {
  ReadmeApi,
  processRequest,
  Request,
  SlimDoc,
  GetDocsForCategoryOptions,
  DeleteDocOptions,
  Category,
  Doc
} from '../src/lib'

// mock the filesystem module
jest.mock('fs', () => {
  // with memfs
  return fs
})

// mock the api module
jest.mock('api', () => {
  // always return the same value from the factory
  // so that we can "retrieve" it statically
  const mockReadmeApi: ReadmeApi = {
    auth: jest.fn(),
    getCategory: jest.fn(),
    getCategoryDocs: jest.fn(),
    getDoc: jest.fn(),
    createDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn()
  }

  // factory impl
  return (id: string): ReadmeApi => {
    return mockReadmeApi
  }
})

// a default mock request
const mockRequestBase: Request = {
  apiKey: 'FAKE_API_KEY',
  version: 'FAKE_VERSION',
  categorySlug: 'FAKE_CATEGORY',
  titleRegex: '#(.+)?',
  path: '',
  additionalJson: '{}',
  create: 'true',
  overwrite: 'false',
  clear: 'false'
}

// effectively reads the value from the mock factory above
const mockReadmeApi: jest.Mocked<ReadmeApi> = api('unimportant-id') as any

describe('readme-docs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should authenticate', async () => {
    await processRequest(mockRequestBase)

    expect(mockReadmeApi.auth).toHaveBeenCalledTimes(1)
    expect(mockReadmeApi.auth).toBeCalledWith(mockRequestBase.apiKey)
  })

  it('should clear existing docs (if configured)', async () => {
    const expectedCategoryReq: GetDocsForCategoryOptions = {
      slug: mockRequestBase.categorySlug,
      'x-readme-version': mockRequestBase.version
    }

    const expectedSlimDocs: SlimDoc[] = [
      {
        title: 'one',
        slug: 'one',
        _id: '1',
        order: 1,
        hidden: false,
        children: []
      },
      {
        title: 'two',
        slug: 'two',
        _id: '2',
        order: 2,
        hidden: false,
        children: []
      }
    ]

    const expectedDeleteReqs: DeleteDocOptions[] = expectedSlimDocs.map(sd => ({
      slug: sd.slug,
      'x-readme-version': mockRequestBase.version
    }))

    // mock the docs for the category
    mockReadmeApi.getCategoryDocs.mockResolvedValueOnce(expectedSlimDocs)

    // mock deleting docs works
    mockReadmeApi.deleteDoc.mockImplementation(() => Promise.resolve())

    await processRequest({...mockRequestBase, clear: 'true'})

    // expect that we got the docs once
    expect(mockReadmeApi.getCategoryDocs).toHaveBeenCalledTimes(1)
    expect(mockReadmeApi.getCategoryDocs).toHaveBeenCalledWith(
      expectedCategoryReq
    )

    // and then we deleted each doc
    expect(mockReadmeApi.deleteDoc).toHaveBeenCalledTimes(2)
    expect(mockReadmeApi.deleteDoc).toHaveBeenNthCalledWith(
      1,
      expectedDeleteReqs[0]
    )
    expect(mockReadmeApi.deleteDoc).toHaveBeenNthCalledWith(
      2,
      expectedDeleteReqs[1]
    )
  })

  describe('with file', () => {
    const mockRequestWithFile: Request = {...mockRequestBase, path: '*.md'}

    beforeAll(async () => {
      // ensure `cwd` exists in memfs
      await fs.promises.mkdir(process.cwd(), {recursive: true})
      // create a test file
      await fs.promises.writeFile('test-file.md', '# Hello World')
    })

    afterAll(async () => {
      // nuke `cwd`
      await fs.promises.rm(process.cwd(), {recursive: true})
    })

    it('should find and create files (if configured)', async () => {
      const expectedCategory: Category = {
        slug: mockRequestWithFile.categorySlug,
        _id: 'FAKE_ID_VALUE',
        title: 'FAKE_TITLE',
        order: 1,
        reference: false,
        isAPI: false,
        project: 'FAKE_PROJECT',
        version: mockRequestWithFile.version
      }

      mockReadmeApi.getCategory.mockResolvedValueOnce(expectedCategory)
      mockReadmeApi.createDoc.mockResolvedValue({} as any as Doc)

      await processRequest(mockRequestWithFile)

      expect(mockReadmeApi.createDoc).toHaveBeenCalledTimes(1)
      expect(mockReadmeApi.createDoc).toHaveBeenCalledWith({
        body: '# Hello World',
        category: expectedCategory._id,
        slug: 'test-file',
        title: 'Hello World',
        'x-readme-version': mockRequestBase.version
      })
    })

    it('should update if create fails (if configured)', async () => {
      const expectedCategory: Category = {
        slug: mockRequestWithFile.categorySlug,
        _id: 'FAKE_ID_VALUE',
        title: 'FAKE_TITLE',
        order: 1,
        reference: false,
        isAPI: false,
        project: 'FAKE_PROJECT',
        version: mockRequestWithFile.version
      }

      mockReadmeApi.getCategory.mockResolvedValueOnce(expectedCategory)
      mockReadmeApi.createDoc.mockRejectedValue(
        new Error('Mock creating failure')
      )
      mockReadmeApi.updateDoc.mockResolvedValue({} as any as Doc)

      await processRequest({...mockRequestWithFile, overwrite: 'true'})

      expect(mockReadmeApi.createDoc).toHaveBeenCalledTimes(1)
      expect(mockReadmeApi.createDoc).toHaveBeenCalledWith({
        body: '# Hello World',
        category: expectedCategory._id,
        slug: 'test-file',
        title: 'Hello World',
        'x-readme-version': mockRequestBase.version
      })

      expect(mockReadmeApi.updateDoc).toHaveBeenCalledTimes(1)
      expect(mockReadmeApi.updateDoc).toHaveBeenCalledWith({
        body: '# Hello World',
        category: expectedCategory._id,
        slug: 'test-file',
        title: 'Hello World',
        'x-readme-version': mockRequestBase.version
      })
    })

    it('should update-only (if configured)', async () => {
      const expectedCategory: Category = {
        slug: mockRequestWithFile.categorySlug,
        _id: 'FAKE_ID_VALUE',
        title: 'FAKE_TITLE',
        order: 1,
        reference: false,
        isAPI: false,
        project: 'FAKE_PROJECT',
        version: mockRequestWithFile.version
      }

      mockReadmeApi.getCategory.mockResolvedValueOnce(expectedCategory)
      mockReadmeApi.updateDoc.mockResolvedValue({} as any as Doc)

      await processRequest({
        ...mockRequestWithFile,
        overwrite: 'true',
        create: 'false'
      })

      expect(mockReadmeApi.createDoc).toHaveBeenCalledTimes(0)

      expect(mockReadmeApi.updateDoc).toHaveBeenCalledTimes(1)
      expect(mockReadmeApi.updateDoc).toHaveBeenCalledWith({
        body: '# Hello World',
        category: expectedCategory._id,
        slug: 'test-file',
        title: 'Hello World',
        'x-readme-version': mockRequestBase.version
      })
    })

    it('should fail if titleRegex fails to find a title', async () => {
      await expect(
        processRequest({
          ...mockRequestWithFile,
          titleRegex: 'abc(.+)def'
        })
      ).rejects.toThrowError(/Unable to find title for file/)
    })

    it('should fail if additionalJson parse fails', async () => {
      await expect(
        processRequest({
          ...mockRequestWithFile,
          additionalJson: '{{{'
        })
      ).rejects.toThrowError(/Unexpected token.+in JSON/)
    })

    it('should fail if titleRegex parse fails', async () => {
      await expect(
        processRequest({
          ...mockRequestWithFile,
          titleRegex: '[[[[['
        })
      ).rejects.toThrowError(/Invalid regular expression/)
    })

    it('should fail if create fails (no update)', async () => {
      const expectedCategory: Category = {
        slug: mockRequestWithFile.categorySlug,
        _id: 'FAKE_ID_VALUE',
        title: 'FAKE_TITLE',
        order: 1,
        reference: false,
        isAPI: false,
        project: 'FAKE_PROJECT',
        version: mockRequestWithFile.version
      }
      const expectedErrorMsg = 'Mock creating failure'

      mockReadmeApi.getCategory.mockResolvedValueOnce(expectedCategory)
      mockReadmeApi.createDoc.mockRejectedValue(new Error(expectedErrorMsg))

      await expect(
        processRequest({
          ...mockRequestWithFile,
          create: 'true',
          overwrite: 'false'
        })
      ).rejects.toThrowError(expectedErrorMsg)
    })
  })

  describe('with files', () => {
    const mockRequestWithFiles: Request = {...mockRequestBase, path: '*.md'}

    beforeAll(async () => {
      // ensure `cwd` exists in memfs
      await fs.promises.mkdir(process.cwd(), {recursive: true})
      // create test files
      await fs.promises.writeFile('test-file-1.md', '# Hello World 1')
      await fs.promises.writeFile('test-file-2.md', '# Hello World 2')
    })

    afterAll(async () => {
      // nuke `cwd`
      await fs.promises.rm(process.cwd(), {recursive: true})
    })

    it('should find and create files (if configured)', async () => {
      const expectedCategory: Category = {
        slug: mockRequestWithFiles.categorySlug,
        _id: 'FAKE_ID_VALUE',
        title: 'FAKE_TITLE',
        order: 1,
        reference: false,
        isAPI: false,
        project: 'FAKE_PROJECT',
        version: mockRequestWithFiles.version
      }

      mockReadmeApi.getCategory.mockResolvedValueOnce(expectedCategory)
      mockReadmeApi.createDoc.mockResolvedValue({} as any as Doc)

      await processRequest(mockRequestWithFiles)

      expect(mockReadmeApi.createDoc).toHaveBeenCalledTimes(2)
      expect(mockReadmeApi.createDoc).toHaveBeenNthCalledWith(1, {
        body: '# Hello World 1',
        category: expectedCategory._id,
        slug: 'test-file-1',
        title: 'Hello World 1',
        'x-readme-version': mockRequestBase.version
      })
      expect(mockReadmeApi.createDoc).toHaveBeenNthCalledWith(2, {
        body: '# Hello World 2',
        category: expectedCategory._id,
        slug: 'test-file-2',
        title: 'Hello World 2',
        'x-readme-version': mockRequestBase.version
      })
    })
  })
})
