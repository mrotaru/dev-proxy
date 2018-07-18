const DevProxy = require('.')
const http = require('http')
const fs = require('fs')
const WebSocket = require('ws')

const { printHttpRequest, printHttpResponse } = require('./lib')

const config = {
  proxyPort: 3000,
  webUI: true,
  webPort: 3001,
  webSockets: true,
  webSocketsPort: 3002,
  cliOutput: true,
}

let ws = null
if (config.webSockets) {
  const wsServer = new WebSocket.Server({ port: config.webSocketsPort })
  wsServer.on('connection', _ws => {
    ws = _ws
  })
}

let webUiServer = null
if (config.webUI) {
  webUiServer = http.createServer()
  webUiServer.on('request', (req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>dev-proxy web ui</title>
        <script>
        const webSocketsPort=${config.webSocketsPort}
        ${fs.readFileSync('./web-ui.js', { encoding: 'utf-8' })}
        </script>
      </head>
      <body id="root"></body>
      </html>
      `)
  })
  webUiServer.listen(config.webPort)
  webUiServer.on('listening', () => {
    console.log(`web ui listening at port ${config.webPort}`)
  })
}

const proxy = Object.create(DevProxy)
proxy
  .init({
    target: 'http://mockbin.com',
  })
  .listen(config.proxyPort)
proxy.eventEmitter.on('listening', () => {
  console.log(`proxy listening on ${config.proxyPort}`)
  proxy.eventEmitter.on('request-started', event => {
    const { method, headers, path, id } = event
    const request = { method, headers, path }
    if (config.cliOutput) {
      printHttpRequest(request)
    }

    if (config.webSockets) {
      ws &&
        ws.send(
          JSON.stringify({
            type: 'request-start',
            id,
            payload: { ...request },
          }),
        )
    }
  })

  proxy.eventEmitter.on(
    'request-completed',
    ({ statusCode, responseHeaders, responseBody, id }) => {
      if (config.cliOutput) {
        printHttpResponse({
          statusCode,
          headers: responseHeaders,
          body: responseBody,
        })
      }

      if (config.webSockets) {
        ws &&
          ws.send(
            JSON.stringify({
              type: 'request-complete',
              id,
              payload: { statusCode, responseHeaders, responseBody },
            }),
          )
      }
    },
  )
})
