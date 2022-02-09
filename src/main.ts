import * as core from '@actions/core'
import {RequestKey, processRequest} from './lib'

type RequestMap = {[key in RequestKey]: string}

/// action.yml name mappings
// allows us to change the yaml without rewriting code
const paramNames: RequestMap = {
  apiKey: 'apiKey',
  version: 'version',
  categorySlug: 'categorySlug',
  titleRegex: 'titleRegex',
  path: 'path',
  additionalJson: 'additionalJson',
  create: 'create',
  overwrite: 'overwrite',
  clear: 'clear'
}

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
        !inputs[paramId as RequestKey] ||
        inputs[paramId as RequestKey].length === 0
      ) {
        throw new InputMissingError(paramId)
      }
    }

    // execute work
    await processRequest(inputs)
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

// begin - actions entrypoint
run()
