const { RequestError, timeout } = require('./helpers')
const { parse, tagToString, decodeEntities } = require('./html')
const { RESTAURANTS, getRestaurant, restaurantList, linkifyRestaurant } = require('./restaurants')
const { WEEKDAYS, WEEKDAY_REGEX, isWeekDay, toWeekDay } = require('./weekday')

module.exports = execute

function execute(query) {
  if (typeof query !== 'string') {
    const type = {}.toString.call(query).slice(8, -1)
    throw new RequestError(`Expected restaurant parameter to be a String, got ${type}`)
  }

  query = query || 'today'

  const terms = query.split(/\s+/)
  const weekday = toWeekDay(terms[0])
  if (weekday != null) { terms.shift() }

  const restaurant = getRestaurant(terms.join(' '))

  if (restaurant) {
    // Weekly/daily menu for a single restaurant
    return getMenu(restaurant, weekday)
  }

  if (weekday) {
    // Aggregate daily menu for all restaurants
    const requests = RESTAURANTS.map(restaurant => getMenu(restaurant, weekday, true))
    return {
      scope: WEEKDAYS[weekday] + ' menus',
      promise: Promise.allSettled(requests.map(r => r.promise)).then(outcomes => {
        const buffer = []
        const failed = []

        outcomes.forEach((outcome, i) => {
          if (outcome.status === 'fulfilled') {
            buffer.push(outcome.value)
          } else {
            const link = linkifyRestaurant(requests[i].restaurant)
            const { message } = outcome.reason
            failed.push(`- ${link}: ${message}`)
          }
        })

        if (failed.length) {
          buffer.push(`*Unavailable restaurants*\n` + failed.join('\n'))
        }

        return buffer.join('\n\n')
      })
    }
  }

  const usage = `
  *Usage:*
  - \`/lunch\`: Menu of the day for all restaurants
  - \`/lunch monday\`: Monday/Tuesday/Wednesday/Thursday/Friday menu for all restaurants
  - \`/lunch restaurant\`: Weekly menu for \`resturant\` (or _alias_)
  *Available restaurants:*
  ${restaurantList()}
  `.replace(/^\s+/gm, '')

  throw new RequestError(usage)
}

function getMenu(restaurant, section = null, omitHeaders = false) {
  const menuType = isWeekDay(section) ? WEEKDAYS[section] : 'weekly'
  const scope = [ linkifyRestaurant(restaurant), menuType, 'menu' ].join(' ')
  return {
    restaurant,
    scope,
    promise: fetchMenu(restaurant, section, omitHeaders).then(menu => {
      return `${scope}:\n${menu}`
    }),
  }
}

async function fetchMenu(restaurant, section = null, omitHeaders = false) {
  if (!restaurant.selector) {
    return Promise.resolve(linkifyRestaurant(restaurant, '_Link to menu_'))
  }

  const res = await timeout(fetch(restaurant.url), 5e3)
  const html = await res.text()

  const root = parse(html, restaurant.selector)

  if (!root) {
    throw new RequestError('Failed to locate menu')
  }

  let text = decodeEntities(tagToString(root))

  if (restaurant.formatter) {
    text = restaurant.formatter(text)
  }

  const ignored = restaurant.ignoreRegex ? [restaurant.ignoreRegex] : []

  if (isWeekDay(section)) {
    const ignoredWeekdays = WEEKDAY_REGEX.slice()
    // Allow today through
    ignoredWeekdays.splice(section, 1)
    ignored.push(...ignoredWeekdays)
  }

  if (ignored.length) {
    text = filterSections(text, new RegExp(ignored.join('|'), 'i'), omitHeaders)
  }

  return text.trim()
}

function filterSections(text, ignoredRegex, omitHeaders = false) {
  let buffer = ''
  const titleRegex = new RegExp(`^\\*([^\n\\*]+)\\*\n`, 'gmi')
  let appendFrom = null
  let m

  while ((m = titleRegex.exec(text)) !== null) {
    if (appendFrom != null) {
      buffer += text.substring(appendFrom, m.index)
      appendFrom = null
    }

    const title = m[1].trim()
    if (!title.length || (ignoredRegex && ignoredRegex.test(title))) {
      continue
    }

    appendFrom = m.index + (omitHeaders ? m[0].length : 0)
  }

  if (appendFrom != null) {
    buffer += text.substring(appendFrom)
  }

  return buffer
}
