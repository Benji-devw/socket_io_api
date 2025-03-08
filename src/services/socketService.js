const Message = require('../models/Message');

// Garder une trace des utilisateurs connectés
const connectedUsers = new Map();

const handleConnection = (io, socket) => {
  const user = {
    username: socket.user.username,
    isOnline: true
  };
  
  // Ajouter l'utilisateur à la liste des connectés
  connectedUsers.set(socket.user.username, socket.id);
  
  console.log(`User connected: ${user.username}`);
  
  // Notifier tout le monde du nouvel utilisateur
  io.emit('user_connected', user);
  
  // Envoyer la liste complète des utilisateurs au nouveau connecté
  const usersList = Array.from(connectedUsers.keys()).map(username => ({
    username,
    isOnline: true
  }));
  io.emit('users', usersList);
  
  // Envoyer l'historique des messages privés
  sendMessageHistory(socket);

  // Gestion des messages privés
  socket.on('private_message', data => handlePrivateMessage(io, socket, data));
  
  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.username}`);
    connectedUsers.delete(user.username);
    io.emit('user_disconnected', user.username);
  });
};

const sendMessageHistory = async (socket) => {
  try {
    const messages = await Message.find({
      $or: [
        { username: socket.user.username },
        { to: socket.user.username }
      ]
    })
    .sort({ createdAt: 1 })  // Ordre chronologique
    .limit(100);
    
    socket.emit('message_history', messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
  }
};

const handlePrivateMessage = async (io, socket, data) => {
  try {
    // Créer et sauvegarder le message
    const message = new Message({
      content: data.content,
      username: socket.user.username,
      userId: socket.user._id,
      to: data.to
    });
    
    const savedMessage = await message.save();
    
    // Préparer le message à envoyer
    const messageToSend = {
      id: savedMessage._id,
      content: savedMessage.content,
      username: savedMessage.username,
      to: savedMessage.to,
      timestamp: savedMessage.createdAt
    };

    // Envoyer au destinataire s'il est connecté
    const recipientSocketId = connectedUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private_message', messageToSend);
    }
    
    // Envoyer à l'expéditeur
    socket.emit('private_message', messageToSend);
  } catch (error) {
    console.error('Error saving message:', error);
    socket.emit('message_error', { error: 'Failed to send message' });
  }
};

module.exports = {
  handleConnection
}; 