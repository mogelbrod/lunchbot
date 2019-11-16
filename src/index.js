/* global addEventListener fetch Response */
const { RequestError } = require('./helpers')
const execute = require('./execute')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const { request } = event
  const url = new URL(request.url)

  switch (url.pathname) {
    case '/robots.txt':
    case '/favicon.ico':
      return new Response(null, { status: 404 })
  }

  let query = null
  let slackResponseUrl = null
  // Only show response for triggering user by default
  let createBody = text => ({ response_type: 'ephemeral', text: stringify(text) })

  console.log(request.method, decodeURI(request.url))

  try {
    switch (request.headers.get('Content-Type')) {
      case 'application/x-www-form-urlencoded':
        const body = await request.formData()
        query = body.get('text')
        slackResponseUrl = body.get('response_url')
        break
      case 'application/json':
      case 'text/json':
        const json = await request.json()
        query = json.query
        break
      default:
        query = decodeURI(url.pathname.substr(1)).replace(/[ /]+/g, ' ').trim()
        if (query.endsWith('.json')) {
          query = query.replace(/\.json$/, '')
        } else {
          createBody = text => stringify(text)
        }
        if (!query.length) {
          throw new RequestError(`Specify a query via the URL path (ex: /today or /restaurantName)`)
        }
    }

    // Make `[arg] (post|msg|message)` show response to all instead of only triggering user
    const POST_SUFFIX_REGEX = /\s+(all|post|msg|message)\s*$/i
    if (POST_SUFFIX_REGEX.test(query)) {
      query = query.replace(POST_SUFFIX_REGEX, '')
      createBody = text => ({ response_type: 'in_channel', text: stringify(text) })
    }

    let { scope, promise } = execute(query)

    if (slackResponseUrl) {
      return Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(false), 1500))
      ]).then(outcome => {
        if (outcome === false) {
          console.log('delayed response')
          const delayedResponse = promise.then(text => {
            console.log('sending delayed response')
            return fetch(slackResponseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: stringify(createBody(text)),
            }).then(() => {
              console.log('sent delayed response')
            })
          })
          event.waitUntil(delayedResponse)
          return toResponse({
            text: `Fetching _${scope}_, just a moment.`
          })
        }

        console.log('non-delayed response')
        return toResponse(createBody(outcome))
      })
    }

    console.log('regular response')
    return promise.then(result => toResponse(createBody(result)))

  } catch (error) {
    console.error(error)
    if (error instanceof Response) {
      return error
    }
    const text = error.message
    const body = slackResponseUrl
      ? { response_type: 'ephemeral', text }
      : text
    return toResponse(body, slackResponseUrl ? 200 : error.status || 500)
  }
}

function toResponse(body, status = 200) {
  let headers = {}
  if (typeof body === 'string') {
    headers['Content-Type'] = 'text/plain; charset=utf-8'
  } else {
    body = stringify(body)
    headers['Content-Type'] = 'application/json'
  }
  return new Response(body, { headers, status })
}

function stringify(input) {
  return typeof input === 'string'
    ? input
    : JSON.stringify(input, null, 2)
}
