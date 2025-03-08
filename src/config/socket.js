const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth');

const configureSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Appliquer le middleware d'authentification
  io.use(socketAuth);

  return io;
};

module.exports = configureSocket; 