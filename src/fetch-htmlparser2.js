/* global fetch Response */
const { Parser } = require('htmlparser2')
const RequestError = require('./helpers').RequestError

module.exports = fetchData

const targets = {
  'Folkparken': {
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: classSelector('entry-content'),
  },
  'Bar Central': {
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: classSelector('side-column left'),
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

  const stack = []
  let root = null

  const parser = new Parser({
    onopentag: (name, props) => {
      if (stack.length || target.selector({ name, props })) {
        const tag = { name, props, children: [] }
        stack.push(tag)
      }
    },
    onclosetag: (name) => {
      const tag = stack.pop()
      if (!tag) { return }
      if (stack.length) {
        stack[stack.length - 1].children.push(tag)
      } else {
        root = tag
      }
    },
    ontext: (raw) => {
      if (!stack.length) { return }
      const text = cleanupWhitespace(raw)
      if (text) {
        stack[stack.length - 1].children.push(text)
      }
    }
  }, {
    recognizeSelfClosing: true,
    lowerCaseTags: true,
    decodeEntities: true,
  })

  parser.write(html)
  parser.end()

  // console.log(JSON.stringify(root, null, 2))
  return tagToString(root)
}

function tagToString(tag) {
  if (typeof tag === 'string') {
    return tag
  }

  // Tags without children/content
  switch (tag.name) {
    case 'br':
      return '\n'
  }

  // Convert subtree to string(s)
  const inner = tag.children.map(tagToString).join('')
  if (/^\s+$/.test(inner) || !tag.children.length) {
    return ''
  }

  switch (tag.name) {
    case 'em':
    case 'strong':
      return `_${inner}_`
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
      return `\n*${inner}*\n`
    default:
      return `${inner}\n`
  }
}

function cleanupWhitespace(str) {
  return str
    .replace(/[\t\r\n]/g, '')
    .replace(/  +/g, ' ')
}

function classSelector(className) {
  return (tag) => (tag.props['class'] && tag.props['class'].includes(className))
}
