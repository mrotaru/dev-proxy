const socket = new WebSocket('ws://localhost:3030')

socket.onopen = () => {
  console.log('socket opened')
}

socket.onmessage = message => {
  console.log('message', JSON.parse(message.data))
}