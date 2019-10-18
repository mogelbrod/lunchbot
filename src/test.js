/* global process */
// Set up worker-like environment
global.fetch = require('node-fetch')
global.Request = fetch.Request
global.Response = fetch.Response

const getTarget = require('./target')
const fetchData = require('./fetch')

const queries = process.argv.slice(2)
if (!queries.length) {
  queries.push('barcentral', 'folkparken')
}

queries.forEach(query => {
  const target = getTarget(query)
  fetchData(target).then(
    res => console.log('============== '+target + ' ==============\n'+res),
    err => console.error('============== '+target + ' ==============\n'+err.stack),
  )
})
