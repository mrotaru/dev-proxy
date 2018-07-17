const DevProxy = require('.')

const proxy = Object.create(DevProxy)
proxy.init({
  target: 'http://mockbin.com'
}).listen(3000)