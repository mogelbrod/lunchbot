// eslint-disable-next-line no-unused-vars
const selectors = module.exports = {
  className(className) {
    return (tag) => {
      const attr = tag.attributes.find(attr => attr.name === 'class')
      return attr && attr.literalValue.includes(className)
        ? tag : null
    }
  },
  tagName(tagName) {
    return tag => (tag.tagName === tagName ? tag : null)
  },
  textNodeParent(textRegex, parentSelector) {
    return (tag, stack) => {
      if (tag.tagName === 'text' && textRegex.test(tag.text)) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (parentSelector(stack[i])) {
            return stack[i]
          }
        }
      }
      return null
    }
  },
}

