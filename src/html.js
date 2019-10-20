const { createParser } = require('htmljs-parser')

module.exports = {
  parse,
  tagToString,
  decodeEntities,
  cleanupWhitespace,
}

function parse(htmlString, targetSelector) {
  const stack = []
  let root = null

  const parser = createParser({
    onOpenTag: (tag) => {
      tag.children = []
      stack.push(tag)
      root = root || targetSelector(tag, stack)
    },
    onCloseTag: (tag) => {
      const closed = stack.pop()
      if (!closed) { return }
      if (stack.length) {
        stack[stack.length - 1].children.push(closed)
      }
    },
    onText: (node) => {
      const text = cleanupWhitespace(node.value)
      if (text) {
        stack[stack.length - 1].children.push(text)
        root = root || targetSelector({ tagName: 'text', attributes: [], text }, stack)
      }
    }
  }, {
    recognizeSelfClosing: true,
    lowerCaseTags: true,
    decodeEntities: true,
  })

  parser.parse(htmlString)

  // console.log(JSON.stringify(stack, null, 2))
  return root
}

function tagToString(tag) {
  if (typeof tag === 'string') {
    return tag
  } else if (!tag) {
    throw new Error('tagToString: got ' + {}.toString.call(tag).slice(8, -1))
  }

  // Render self-closing tags
  switch (tag.tagName) {
    case 'br':
      return '\n'
  }

  // Convert subtree to string(s)
  const inner = tag.children.map(tagToString).join('')

  // Don't render empty block tags
  if (/^\s+$/.test(inner) || !tag.children.length) {
    return ''
  }

  switch (tag.tagName) {
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

function decodeEntities(str) {
  return str.replace(/&#(\d{2,4});?/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
}
