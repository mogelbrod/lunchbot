/* global process */
// Set up worker-like environment
global.fetch = require('node-fetch')
global.Request = fetch.Request
global.Response = fetch.Response

const { RequestError } = require('./helpers')
const execute = require('./execute')

const query = process.argv.slice(2).join(' ').trim()

try {
  const { scope, promise } = execute(query)

  console.log(`Fetching ${scope}`)

  promise.then(text => {
    console.log('================================\n' + text)
  })
} catch (error) {
  if (error instanceof RequestError) {
    console.error(error.message)
    process.exit(1)
  }
  throw error
}

