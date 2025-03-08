const Message = require('../models/Message');

const handleConnection = (io, socket) => {
  console.log(`User connected: ${socket.user.username}`);
  
  // Envoyer l'historique des messages
  sendMessageHistory(socket);

  // Gestion des messages
  socket.on('message', data => handleMessage(io, socket, data));
  
  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
};

const sendMessageHistory = async (socket) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50);
    socket.emit('message_history', messages.reverse());
  } catch (err) {
    console.error('Error fetching messages:', err);
  }
};

const handleMessage = async (io, socket, data) => {
  try {
    const message = new Message({
      content: data.content,
      username: socket.user.username,
      userId: socket.user._id
    });
    
    await message.save();
    
    io.emit('message', {
      content: message.content,
      username: message.username,
      timestamp: message.createdAt,
      id: message._id
    });
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

module.exports = {
  handleConnection
}; 