const http = require('http')
const { URL } = require('url')
const assert = require('assert')
const { uuid } = require('./lib')
const EventEmitter = require('events')

const DevProxy = {
  init,
  listen,
}

function init ({ target, encoding = 'utf8', closeAfterFirstRequest = false, webSocketPort = null, webPort = 3031}) {
  this.eventEmitter = new EventEmitter()
  this.server = http.createServer()
  const server = this.server

  server.on('request', (req, res) => {
    const { method, headers } = req
    const url = new URL(req.url, target)
    const { port, protocol, hostname } = url
    const options = { method, headers, hostname, protocol, port, path: req.url, host: false }
    const request = { id: uuid(), inProgress: true, ...options }
    this.eventEmitter.emit('request-started', request)
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
        Object.assign(request, {
          statusCode, responseHeaders: headers, responseBody: resBody,
          inProgress: false,
        })
        this.eventEmitter.emit('request-completed', request)
        if (closeAfterFirstRequest) {
          server.close()
        }
      })
    })
    clientReq.on('error', err => {
      this.eventEmitter.emit('request-error', err)
    })
    clientReq.end()
  })
  server.on('listening', () => {
    this.eventEmitter.emit('listening')
  })
  return this
}

function listen(port) {
  assert(this.server)
  this.port = port
  this.server.listen(port)
}

module.exports = DevProxy