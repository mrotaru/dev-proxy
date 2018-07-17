// based on: https://stackoverflow.com/a/2117523/447661
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const reset = "\x1b[0m"
const colors = {
  black: (text) => `\x1b[30m${text}${reset}`,
  gray: (text) => `\x1b[1;30m${text}${reset}`,
  red: (text) => `\x1b[31m${text}${reset}`,
  green: (text) => `\x1b[32m${text}${reset}`,
  yellow: (text) => `\x1b[33m${text}${reset}`,
  blue: (text) => `\x1b[34m${text}${reset}`,
  lightBlue: (text) => `\x1b[1;34m${text}${reset}`,
  magenta: (text) => `\x1b[35m${text}${reset}`,
  cyan: (text) => `\x1b[36m${text}${reset}`,
  white: (text) => `\x1b[37m${text}${reset}`,
}

const { gray, blue, magenta, cyan } = colors

const printHttpRequest = ({ method, headers, path }) => {
  console.log(`${blue(method)} ${magenta(path)}`)
  Object.keys(headers).forEach(key => {
    console.log(`${gray(key)}: ${cyan(headers[key])}`)
  })
  console.log()
}

const printHttpResponse = ({ statusCode, headers, body }) => {
  console.log(`-> ${magenta(statusCode)}`)
  Object.keys(headers).forEach(key => {
    console.log(`${gray(key)}: ${cyan(headers[key])}`)
  })
  console.log()
  if (!headers['content-encoding']) {
    console.log(body)
  } else {
    console.log('<encoded content>')
  }
  console.log()
}

module.exports = {
  uuid,
  printHttpRequest,
  printHttpResponse,
}
