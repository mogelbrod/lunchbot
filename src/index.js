/* global addEventListener fetch Response */
const { RequestError } = require('./helpers')
const { targets, getTarget, linkifyTarget } = require('./target')
const fetchData = require('./fetch')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const { request } = event
  const url = new URL(request.url)
  let restaurant = null
  let slackResponseUrl = null
  let createBody = text => ({
    response_type: text instanceof Error ? 'ephemeral' : 'in_channel',
    text: String(text),
  })

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
        createBody = text => String(text)
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
      throw new RequestError(`No restaurant specified. Try any of:\n${targetList()}`)
    } else if (typeof restaurant !== 'string') {
      const type = {}.toString.call(restaurant).slice(8, -1)
      throw new RequestError(`Expected restaurant parameter to be a String, got ${type}`)
    }

    const target = getTarget(restaurant)
    if (!target) {
      throw new RequestError(`Unknown restaurant. Try any of:\n${targetList()}`)
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
              body: stringify(createBody(text)),
            }).then(() => {
              console.log('sent delayed response')
            })
          })
          // TODO: Might have to be moved outside promise
          event.waitUntil(delayedResponse)
          return toResponse({
            response_type: 'ephemeral',
            text: `Fetching menu for _${target.name}_, just a moment.`
          })
        }

        console.log('non-delayed response')
        return toResponse(createBody(outcome))
      })
    }

    console.log('regular response')
    return resultPromise.then(result => toResponse(createBody(result)))
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    return toResponse(createBody(error), slackResponseUrl ? 200 : error.status || 500)
  }
}

function toResponse(body, status = 200) {
  let headers = {}
  if (typeof body !== 'string') {
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

function targetList() {
  return targets.map(t => {
    return [
      '-',
      linkifyTarget(t),
      t.aliases.length ? `(_${t.aliases.join(', ')})_` : ''
    ].join(' ')
  }).join('\n')
}
