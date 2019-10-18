/* global fetch */
const { parse, tagToString, decodeEntities } = require('./html')
const { linkifyTarget } = require('./target')

module.exports = fetchData

async function fetchData(target, week) {
  const res = await fetch(target.url)
  const html = await res.text()

  const root = parse(html, target.selector)
  let text = decodeEntities(tagToString(root)).trim()

  if (target.formatter) {
    text = target.formatter(text)
  }

  return linkifyTarget(target) + ':\n' + text
}

