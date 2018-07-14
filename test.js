const http = require('http')
const assert = require('assert')
const DevProxy = require('.')

const test = ({ serverResponse, clientRequest, encoding = 'utf8' }) => {
  const testServer = http.createServer()
  testServer.on('request', (req, res) => {
    console.log(`${req.method} ${req.url}`)
    assert(propsContained(clientRequest.headers, req.headers), 'request headers not passed to proxied server')
    res.writeHead(serverResponse.statusCode, serverResponse.headers)
    res.end(serverResponse.body)
  })
  testServer.listen(3001)
  testServer.on('listening', () => {
    const proxy = Object.create(DevProxy)
    proxy.init({
      target: 'http://localhost:3001',
      closeAfterFirstRequest: true,
    }).listen(3000)

    proxy.onListening = function () {
      const proxyRequest = http.request(clientRequest, proxyRes => {
        let resBody = ''
        proxyRes.setEncoding(encoding)
        proxyRes.on('data', chunk => { resBody = `${resBody}${chunk}`})
        proxyRes.on('end', () => {
          assert(propsContained(serverResponse.headers, proxyRes.headers), 'proxied response headers not passed back')
          assert(resBody === serverResponse.body, 'proxied response body is not passed back')
          assert(proxyRes.statusCode === serverResponse.statusCode, 'statusCode is not equal')
          assert(proxy.history.length === 1)
          testServer.close()
        })
      })
      proxyRequest.end()
    }
  })
}

test({
  clientRequest: {
    port: 3000,
    path: '/api/foo',
    headers: {
      'bar': 'bar-value'
    }
  },
  serverResponse: {
    statusCode: 200,
    headers: {
      'foo': 'foo-value'
    },
    body: '42'
  },
})

const propsContained = (src, target) => {
  let allContained = true
  Object.keys(src).forEach(key => {
    if (!target.hasOwnProperty(key) || target[key] !== src[key]) {
      console.log('not contained', key, src[key], target[key])
      allContained = false
    }
  })
  return allContained
}