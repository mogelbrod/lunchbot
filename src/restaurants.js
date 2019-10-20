const selectors = require('./selectors')

const restaurants = [
  {
    name: 'Austin Food Works',
    aliases: ['afw'],
    url: 'http://norrtull.austinfoodworks.se/#menu',
    selector: selectors.attribute('id', 'menu-tab1'),
    formatter: (str) => str
      // Remove static intro/outro
      .replace(/^.*Friendly staff!\s*/is, '\n\n')
      .replace(/\n+\s*Requests for table reservations.+/ims, '')
      // Reformat TITLES
      .replace(/\n{2,}\s*([A-Z ]{4,})/g, (_, m) => {
        return `\n\n*${capitalize(m.substr(0, m.length - 1))}*\n${m[m.length - 1]}`
      })
      // Move price tag
      .replace(/\n+(\d+);?-?(\n+|$)/g, '\n_$1 kr_$2')
      .trim()
  },
  {
    name: 'Bar Central',
    aliases: ['bc', 'barcentral'],
    url: 'http://www.barcentral.se/birger-jarlsgatan-41/lunch',
    selector: selectors.className('side-column left'),
    formatter: (str) => str.replace(/^[A-ZÀ-ÖØ-ÞŒŠŸŽ()[\]&#.,; 0-9-]{3,}$/gm, m => {
      // Reformat TITLES
      return `\n*${capitalize(m)}*`
    })
  },
  {
    name: 'Folkparken',
    aliases: ['fp'],
    url: 'https://restaurangfolkparken.se/lunch/',
    selector: selectors.className('entry-content'),
    formatter: (str) => str.replace(/\n\n([A-ZÀ-ÖØ-ÞŒŠŸŽ])/ig, '\n$1')
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
  {
    name: 'Rolfs Kök',
    aliases: ['rk'],
    url: 'http://www.rolfskok.se/meny/Aktuell_lunchmeny.pdf',
    parse: false,
  },
]

function capitalize(str) {
  return str[0] + str.slice(1).toLowerCase()
}

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

function linkifyRestaurant(target, text = target.name) {
  return `<${target.url}|*${text}*>`
}

module.exports = {
  getRestaurant,
  restaurants,
  restaurantList,
  linkifyRestaurant,
}
