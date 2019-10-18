/* global addEventListener fetch Response */
const { RequestError } = require('./helpers')
const getTarget = require('./target')
const fetchData = require('./fetch')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const { request } = event
  const url = new URL(request.url)
  let restaurant = null
  let slackResponseUrl = null

  console.log(request.method, request.url)

  try {
    switch (request.headers.get('Content-Type')) {
      case 'application/x-www-form-urlencoded':
        const body = await request.formData()
        restaurant = body.get('text')
        slackResponseUrl = body.get('response_url')
        break
      case 'application/json':
      case 'text/json':
        const json = await request.json()
        restaurant = json.restaurant
        break
      default:
        restaurant = url.pathname.replace('/', '')
        switch (url.pathname) {
          case '/robots.txt':
          case '/favicon.ico':
            return new Response(null, 404)
        }
        if (!restaurant.length) {
          throw new RequestError(`Specify a query via the URL path (ex: /restaurantName)`)
        }
    }

    if (!restaurant) {
      throw new RequestError(`No restaurant specified`)
    } else if (typeof restaurant !== 'string') {
      const type = {}.toString.call(restaurant).slice(8, -1)
      throw new RequestError(`Expected restaurant parameter to be a String, got ${type}`)
    }

    const target = getTarget(restaurant)
    if (!target) {
      throw new RequestError(`Unknown restaurant`)
    }

    let resultPromise = fetchData(target, true)

    if (slackResponseUrl) {
      return Promise.race([
        resultPromise,
        new Promise(resolve => setTimeout(() => resolve(false), 1500))
      ]).then(outcome => {
        if (outcome === false) {
          console.log('delayed response')
          const delayedResponse = resultPromise.then(text => {
            console.log('sending delayed response')
            return fetch(slackResponseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: toSlackMessage(text),
            }).then(() => {
              console.log('sent delayed response')
            })
          })
          // TODO: Might have to be moved outside promise
          event.waitUntil(delayedResponse)
          return toResponse({
            response_type: 'ephemeral',
            text: `Fetching menu for ${target.name}, just a second.`
          })
        }

        console.log('non-delayed response')
        return toResponse(toSlackMessage(outcome))
      })
    }

    console.log('regular response')
    return resultPromise.then(result => toResponse(toSlackMessage(result)))
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    return toResponse({
      response_type: 'ephemeral',
      text: 'Error: ' + error.message,
      stack: error.stack,
    }, slackResponseUrl ? 200 : error.status || 500)
  }
}

function toSlackMessage(text) {
  return stringify({
    response_type: 'in_channel',
    text,
  })
}

function toResponse(body, status = 200) {
  return new Response(
    stringify(body),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      status,
    }
  )
}

function stringify(input) {
  return typeof input === 'string'
    ? input
    : JSON.stringify(input, null, 2)
}
