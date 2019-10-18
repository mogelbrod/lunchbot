const targets = [
  {
    name: 'Folkparken',
    aliases: ['fp'],
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: classSelector('entry-content'),
    formatter: (str) => str.replace(/\n\n([A-ZÀ-ÖØ-ÞŒŠŸŽ])/ig, '\n$1')
  },
  {
    name: 'Bar Central',
    aliases: ['bc', 'barcentral'],
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: classSelector('side-column left'),
    formatter: (str) => str.replace(/^[A-ZÀ-ÖØ-ÞŒŠŸŽ()[\]&#.,; 0-9-]{3,}$/gm, m => {
      return '\n*' + m[0] + m.slice(1).toLowerCase() + '*'
    })
  },
]

function linkifyTarget(target) {
  return `<${target.url}|*${target.name}*>`
}

function getTarget(query) {
  const normalizedQuery = query.toLowerCase()

  let target
  let minDistance = 9999

  targets.forEach(t => [t.name].concat(t.aliases).forEach(term => {
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

module.exports = {
  getTarget,
  targets,
  linkifyTarget,
}
