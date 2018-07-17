const http = require('http')
const { URL } = require('url')
const assert = require('assert')
const { uuid, printHttpRequest, printHttpResponse } = require('./lib')
const WebSocket = require('ws')
const fs = require('fs')

const DevProxy = {
  init,
  listen,
  onListening() { console.log(`proxy listening at ${this.port}`)},
  wsEvent,
}

function init ({ target, encoding = 'utf8', closeAfterFirstRequest = false, webSocketPort = null, webPort = 3031}) {
  this.server = http.createServer()
  this.wsServer = new WebSocket.Server({ port: 3030 })
  this.history = new Map()
  const server = this.server
  const wsServer = this.wsServer

  const webUiServer = http.createServer()
  webUiServer.on('request', (req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
	<title>dev-proxy web ui</title>
  <script>${fs.readFileSync('./web-ui.js', { encoding: 'utf-8'})}</script>
</head>
<body id="root"></body>
</html>
    `)
  })
  webUiServer.listen(webPort)
  webUiServer.on('listening', () => { console.log(`web ui listening at port ${webPort}`)})

  wsServer && wsServer.on('connection', (ws) => {
    this.ws = ws
  })

  server.on('request', (req, res) => {
    const { method, headers } = req
    const url = new URL(req.url, target)
    const { port, protocol, hostname } = url
    const options = { method, headers, hostname, protocol, port, path: req.url, host: false }
    const request = { id: uuid(), inProgress: true, ...options }
    this.history.set(request.id, request)
    this.wsEvent({ type: 'request-start', ...request })
    printHttpRequest({ method, headers, path: req.url })
    const clientReq = http.request(options, clientRes => {
      clientRes.setEncoding(encoding)
      let resBody = ''
      clientRes.on('data', chunk => {
        resBody=`${resBody}${chunk}`
      })
      clientRes.on('end', () => {
        res.writeHead(clientRes.statusCode, clientRes.headers)
        printHttpResponse({ ...clientRes, body: resBody })
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
          webUiServer.close()
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
  this.port = port
  this.server.listen(port)
}

function wsEvent(event) {
  this.ws && this.ws.send(JSON.stringify(event))
}

module.exports = DevProxy