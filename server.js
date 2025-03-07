require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connexion MongoDB avec plus de logs
console.log('Tentative de connexion à MongoDB:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err);
    console.error('Stack:', err.stack);
  });

// Routes API REST
app.get('/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté');

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Client rejoint la room: ${room}`);
  });

  socket.on('message', async (data) => {
    console.log('Message reçu:', data);
    try {
      const message = new Message({
        user: data.user,
        content: data.content,
        room: data.room
      });
      const savedMessage = await message.save();
      console.log('Message sauvegardé:', savedMessage);
      io.to(data.room).emit('message', savedMessage);
    } catch (err) {
      console.error('Erreur sauvegarde message:', err);
      console.error('Stack:', err.stack);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});