class RequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    Error.captureStackTrace(this, this.constructor)
  }
}

function tokenize(str) {
  str = str.replace(/”/g, "“")
  const regexp = /([^\s'"“]+(['"“])([^\2]*?)\2)|[^\s'"“]+|(['"“])([^\4]*?)\4/gi
  const tokens = []
  let match
  do {
    match = regexp.exec(str)
    if (match !== null) {
      tokens.push(match[1] || match[5] || match[0])
    }
  } while (match !== null)
  return tokens
}

function slackDate(date, format = '{date_short_pretty}') {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const fallback = new Date(date.getTime())
    .toISOString().split(/[T.]/)
    .slice(0, format.indexOf('time') >= 0 ? 2 : 1).join(' ')
  const unix = Math.floor(date.getTime() / 1e3)
  return `<!date^${unix}^${format}|${fallback}>`
}

function stringify(obj) {
  return Object.keys(obj)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
    .join('&')
}

module.exports = {
  RequestError,
  slackDate,
  stringify,
  tokenize,
}
