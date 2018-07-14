const http = require('http')
const { URL } = require('url')
const assert = require('assert')

const DevProxy = {
  init,
  listen,
  onListening() {},
}

function init ({ target, encoding = 'utf8', closeAfterFirstRequest = false}) {
  this.server = http.createServer()
  this.history = []
  const server = this.server

  server.on('request', (req, res) => {
    const { method, headers } = req
    const url = new URL(req.url, target)
    const { port, protocol, hostname } = url
    const options = { method, headers, hostname, protocol, port, path: req.url, host: false }
    const clientReq = http.request(options, clientRes => {
      clientRes.setEncoding(encoding)
      let resBody = ''
      clientRes.on('data', chunk => {
        resBody=`${resBody}${chunk}`
      })
      clientRes.on('end', () => {
        res.writeHead(clientRes.statusCode, clientRes.headers)
        res.end(resBody)
        const { statusCode, headers } = clientRes 
        this.history.push({ statusCode, headers, body: resBody })
        if (closeAfterFirstRequest) {
          server.close()
        }
      })
    })
    clientReq.on('error', err => {
      console.log('client error', err)
    })
    clientReq.end()
  })
  server.on('listening', () => {
    this.onListening()
  })
  return this
}

function listen(port) {
  assert(this.server)
  this.server.listen(port)
}

module.exports = DevProxy