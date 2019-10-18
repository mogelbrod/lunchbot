/* global fetch Response */
const cheerio = require('cheerio')
const RequestError = require('./helpers').RequestError

module.exports = fetchData

const targets = {
  'Folkparken': {
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: '.entry-content',
  },
  'Bar Central': {
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: '.side-column.left',
  },
}
targets['barcentral'] = targets['Bar Central']

async function fetchData(query, week) {
  const targetName = Object.keys(targets)
    .find(k => k.toLowerCase().indexOf(query.toLowerCase()) >= 0)
  const target = targets[targetName]

  if (!targetName || !target) {
    throw new RequestError(`Unknown restaurant`)
  }

  const res = await fetch(target.url)
  const html = await res.text()
  const $ = cheerio.load(html)
  return stripWhitespace(tagToString($, $(target.selector).get(0)))
}

function tagToString($, tag) {
  if (tag.nodeType === 3) {
    return $(tag).text()
  } else if (tag.nodeType !== 1) {
    return ''
  }

  const text = () => $(tag).contents()
    .map((i, child) => tagToString($, child))
    .get().join('')

  switch (tag.tagName.toLowerCase()) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
      return `\n*${text()}*\n`
    case 'em':
    case 'strong':
      return `_${text()}_`
    case 'br':
      return '\n'
    default:
      return `${text()}\n`
  }
}

function stripWhitespace(str) {
  return str
    .replace(/[\r\n]+/g, '\n')
    .replace(/(^\s+)|(\s+$)/gm, '')
    .replace(/ +/g, ' ')
}
