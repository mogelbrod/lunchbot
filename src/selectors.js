// eslint-disable-next-line no-unused-vars
const selectors = module.exports = {
  tagName(tagName) {
    return tag => (tag.tagName === tagName ? tag : null)
  },
  attribute(attributeName, value) {
    return (tag) => {
      const attr = tag.attributes.find(attr => attr.name === attributeName)
      return attr && attr.literalValue.includes(value)
        ? tag : null
    }
  },
  className(className) {
    return selectors.attribute('class', className)
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

