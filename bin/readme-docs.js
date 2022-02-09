#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
/* eslint-disable github/no-then */

const {processRequest} = require('../lib/lib')
const fs = require('fs')

const args = process.argv.slice(2)

if (args.length !== 1) {
  console.error(
    `Expected a single argument (path to JSON inputFile). Got: '${args}'`
  )

  process.exit(1)
}

const inputFile = JSON.parse(fs.readFileSync(args[0], {encoding: 'utf-8'}))

console.log(`Using input: ${JSON.stringify(inputFile)}`)

processRequest(inputFile).then(
  () => console.log('Complete.'),
  err => {
    console.log(JSON.stringify(err))
    throw err
  }
)
