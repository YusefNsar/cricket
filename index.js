const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const app = require('./app');
const socketHandler = require('./socket');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  transports: ['websocket'],
  cors: {
    origin: 'http://localhost:3000',
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected...');
  socketHandler(socket);
});

const PORT = process.env.PORT || config.port;

const server = httpServer.listen(PORT, () => {
  console.log('server is running on port', server.address().port);
});
