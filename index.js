const http = require('http')
const { URL } = require('url')
const assert = require('assert')
const { uuid } = require('./lib')
const WebSocket = require('ws')

const DevProxy = {
  init,
  listen,
  onListening() {},
  wsEvent,
}

function init ({ target, encoding = 'utf8', closeAfterFirstRequest = false, webSocketPort = null}) {
  this.server = http.createServer()
  this.wsServer = new WebSocket.Server({
    port: 3030,
  })
  this.history = new Map()
  const server = this.server
  const wsServer = this.wsServer

  wsServer && wsServer.on('connection', () => {
    this.haveWsConnection = true
  })

  server.on('request', (req, res) => {
    const { method, headers } = req
    const url = new URL(req.url, target)
    const { port, protocol, hostname } = url
    const options = { method, headers, hostname, protocol, port, path: req.url, host: false }
    const request = { id: uuid(), inProgress: true, ...options }
    this.history.set(request.id, request)
    this.wsEvent({ type: 'request-start', ...request })
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
        this.wsEvent({ type: 'request-complete', id: request.id, payload: request })
        if (closeAfterFirstRequest) {
          server.close()
          wsServer.close()
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

function wsEvent(event) {
  this.wsServer && this.haveWsConnection && this.wsServer.send(JSON.stringify(event))
}

module.exports = DevProxy