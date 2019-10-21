const { RequestError } = require('./helpers')
const { getRestaurant, restaurantList, linkifyRestaurant } = require('./restaurants')
const { parse, tagToString, decodeEntities } = require('./html')
const { WEEKDAYS, WEEKDAY_REGEX, toWeekDay } = require('./weekday')

module.exports = execute

function execute(query) {
  if (!query) {
    throw new RequestError(`No restaurant specified. Try any of:\n${restaurantList()}`)
  } else if (typeof query !== 'string') {
    const type = {}.toString.call(query).slice(8, -1)
    throw new RequestError(`Expected restaurant parameter to be a String, got ${type}`)
  }

  const terms = query.split(/\s+/)
  const weekday = toWeekDay(terms[0])
  if (weekday != null) { terms.shift() }

  const restaurant = getRestaurant(terms.join(' '), weekday)
  if (!restaurant) {
    throw new RequestError(`Unknown restaurant. Try any of:\n${restaurantList()}`)
  }

  return {
    restaurant,
    scope: weekday ? WEEKDAYS[weekday] + ' menu' : 'weekly menu',
    resultPromise: (restaurant.parse !== false
      ? fetchData(restaurant, weekday)
      : Promise.resolve(linkifyRestaurant(restaurant, '_Link to menu_'))
    ),
  }
}

async function fetchData(restaurant, section = null) {
  const res = await fetch(restaurant.url)
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

  if (typeof section === 'number' && section >= 0 && section < 7) {
    const ignoredWeekdays = WEEKDAY_REGEX.slice()
    // Allow today through
    ignoredWeekdays.splice(section, 1)
    ignored.push(...ignoredWeekdays)
  }

  if (ignored.length) {
    text = filterSections(text, new RegExp(ignored.join('|'), 'i'))
  }

  return text.trim()
}

function filterSections(text, ignoredRegex) {
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

    appendFrom = m.index
  }

  if (appendFrom != null) {
    buffer += text.substring(appendFrom)
  }

  return buffer
}

// eslint-disable-next-line no-unused-vars
function splittingFilterSections(text, ignoredRegex) {
  const regex = new RegExp(`^\\*([^\n\\*]+)\\*\n`, 'mi')
  const parts = text.split(regex)

  let title = null
  const sections = {}

  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i].trim()
    if (!trimmed.length) {
      // Skip sections with missing title or body
      if (title) { title = null }
    } else if (!title) {
      if (ignoredRegex && ignoredRegex.test(trimmed)) {
        // Ignore this section
        i += 1
      } else {
        title = trimmed
      }
    } else {
      sections[title] = trimmed
      title = null
    }
  }

  return Object.keys(sections)
    .map(title => `*${title}*\n${sections[title]}\n`)
    .join('\n')
}
