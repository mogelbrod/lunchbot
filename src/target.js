module.exports = getTarget

const targets = [
  {
    name: 'Folkparken',
    terms: ['folkparken', 'fp'],
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: classSelector('entry-content'),
  },
  {
    name: 'Bar Central',
    terms: ['bar central', 'barcentral', 'bc'],
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: classSelector('side-column left'),
    formatter: (str) => str.replace(/^[A-ZÀ-ÖØ-ÞŒŠŸŽ()[\]., 0-9-]{3,}$/gm, m => {
      return '\n*' + m[0] + m.slice(1).toLowerCase() + '*'
    })
  },
]

function getTarget(query) {
  const normalizedQuery = query.toLowerCase()

  let target
  let minDistance = 9999

  targets.forEach(t => t.terms.forEach(term => {
    if (term.toLowerCase().indexOf(normalizedQuery) >= 0) {
      const distance = term.length - normalizedQuery.length
      if (distance < minDistance) {
        target = t
        minDistance = distance
      }
    }
  }))

  return target
}

function classSelector(className) {
  return (tag) => {
    const attr = tag.attributes.find(attr => attr.name === 'class')
    return !!attr && attr.literalValue.includes(className)
  }
}
