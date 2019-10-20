const { RequestError } = require('./helpers')
const { getRestaurant, restaurantList, linkifyRestaurant } = require('./restaurants')
const { parse, tagToString, decodeEntities } = require('./html')

module.exports = execute

function execute(query) {
  if (!query) {
    throw new RequestError(`No restaurant specified. Try any of:\n${restaurantList()}`)
  } else if (typeof query !== 'string') {
    const type = {}.toString.call(query).slice(8, -1)
    throw new RequestError(`Expected restaurant parameter to be a String, got ${type}`)
  }

  const restaurant = getRestaurant(query)
  if (!restaurant) {
    throw new RequestError(`Unknown restaurant. Try any of:\n${restaurantList()}`)
  }

  return {
    restaurant,
    resultPromise: (restaurant.parse !== false
      ? fetchData(restaurant, true)
      : Promise.resolve(linkifyRestaurant(restaurant, '_Link to menu_'))
    ),
  }
}

async function fetchData(restaurant, week) {
  const res = await fetch(restaurant.url)
  const html = await res.text()

  const root = parse(html, restaurant.selector)
  let text = decodeEntities(tagToString(root)).trim()

  if (restaurant.formatter) {
    text = restaurant.formatter(text)
  }

  return text
}
