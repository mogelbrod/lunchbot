/* global fetch */
const { parse, tagToString, decodeEntities } = require('./html')

module.exports = fetchData

async function fetchData(target, week) {
  const res = await fetch(target.url)
  const html = await res.text()

  const root = parse(html, target.selector)
  let text = decodeEntities(tagToString(root)).trim()

  if (target.formatter) {
    text = target.formatter(text)
  }

  return `<${target.url}|*${target.name}*>:\n` + text
}

