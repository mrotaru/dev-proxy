const socket = new WebSocket(`ws://localhost:${webSocketsPort}`)

socket.onopen = () => {
  console.log('socket opened')
}

socket.onmessage = message => {
  console.log('message', JSON.parse(message.data))
}
