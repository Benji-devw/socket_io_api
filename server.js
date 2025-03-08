require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const cors = require('cors');

// Import des configurations
const connectDB = require('./src/config/database');
const configureSocket = require('./src/config/socket');

// Import des routes
const authRoutes = require('./src/routes/authRoutes');
const messageRoutes = require('./src/routes/messageRoutes');

// Import des services
const { handleConnection } = require('./src/services/socketService');

// Initialisation de l'app
const app = express();
const httpServer = createServer(app);
const io = configureSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connexion à la base de données
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);

// Socket.IO
io.on('connection', socket => handleConnection(io, socket));

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});