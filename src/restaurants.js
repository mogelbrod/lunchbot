const selectors = require('./selectors')

const restaurants = [
  {
    name: 'Folkparken',
    aliases: ['fp'],
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: selectors.className('entry-content'),
    formatter: (str) => str.replace(/\n\n([A-ZÀ-ÖØ-ÞŒŠŸŽ])/ig, '\n$1')
  },
  {
    name: 'Bar Central',
    aliases: ['bc', 'barcentral'],
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: selectors.className('side-column left'),
    formatter: (str) => str.replace(/^[A-ZÀ-ÖØ-ÞŒŠŸŽ()[\]&#.,; 0-9-]{3,}$/gm, m => {
      return '\n*' + m[0] + m.slice(1).toLowerCase() + '*'
    })
  },
  {
    name: 'Knut Bar',
    aliases: ['kb'],
    url: 'https://restaurangknut.se/knut-bar/#menu',
    selector: selectors.textNodeParent(/Lunch V\./i, selectors.tagName('div')),
    formatter: (str) => str
      .replace(/\n+_([^\n_]+)_\n{1,}/gm, '\n\n*$1*\n') // correct spacing for day headers (+ switch _ to *)
  },
  {
    name: 'Knut Restaurant',
    aliases: ['kr'],
    url: 'https://restaurangknut.se/knut-restaurang/#menu',
    selector: selectors.textNodeParent(/Lunch V\./i, selectors.tagName('div')),
    formatter: (str) => str
      .replace(/\n+_([^\n_]+)_\n{1,}/gm, '\n\n*$1*\n') // correct spacing for day headers (+ switch _ to *)
  },
]

function getRestaurant(query) {
  const normalizedQuery = query.toLowerCase()

  let target
  let minDistance = 9999

  restaurants.forEach(t => [t.name].concat(t.aliases).forEach(term => {
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

function restaurantList() {
  return restaurants.map(t => {
    return [
      '-',
      linkifyRestaurant(t),
      t.aliases.length ? `(_${t.aliases.join(', ')})_` : ''
    ].join(' ')
  }).join('\n')
}

function linkifyRestaurant(target) {
  return `<${target.url}|*${target.name}*>`
}

module.exports = {
  getRestaurant,
  restaurants,
  restaurantList,
  linkifyRestaurant,
}
