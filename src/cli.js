/* global process */
// Set up worker-like environment
const { RequestError } = require('./helpers')
const execute = require('./execute')
global.fetch = require('node-fetch')
global.Request = fetch.Request
global.Response = fetch.Response

const query = process.argv.slice(2).join(' ').trim()

try {
  const { restaurant, resultPromise } = execute(query)

  console.log(`Fetching menu for restaurant '${restaurant.name}'`)

  resultPromise.then(res => {
    console.log('================================\n' + res)
  })
} catch (error) {
  if (error instanceof RequestError) {
    console.error(error.message)
    process.exit(1)
  }
  throw error
}

