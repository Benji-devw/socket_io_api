const Message = require('../models/Message');
const User = require('../models/User');

// Garder une trace des utilisateurs connectés
const connectedUsers = new Map();

const handleConnection = async (io, socket) => {
  const user = {
    username: socket.user.username,
    isOnline: true
  };
  
  // Ajouter l'utilisateur à la liste des connectés
  connectedUsers.set(socket.user.username, socket.id);
  
  console.log(`User connected: ${user.username}`);
  
  // Récupérer tous les utilisateurs de la base de données
  try {
    const allUsers = await User.find({}, 'username');
    const usersList = allUsers.map(user => ({
      username: user.username,
      isOnline: connectedUsers.has(user.username)
    }));
    
    // Envoyer la liste complète à tout le monde
    io.emit('users', usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
  
  // Envoyer l'historique des messages privés
  sendMessageHistory(socket);

  // Compter les messages non lus et les envoyer
  sendUnreadMessagesCount(socket);

  // Gestion des messages privés
  socket.on('private_message', data => handlePrivateMessage(io, socket, data));
  
  // Gestion du typing indicator
  socket.on('typing_start', (data) => {
    const recipientSocketId = connectedUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing_start', {
        username: socket.user.username
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const recipientSocketId = connectedUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing_stop', {
        username: socket.user.username
      });
    }
  });

  // Marquer les messages comme lus
  socket.on('mark_messages_read', async (data) => {
    try {
      // Marquer tous les messages de l'expéditeur spécifié comme lus
      await Message.updateMany(
        { 
          username: data.from, 
          to: socket.user.username,
          isRead: false
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      // Envoyer une mise à jour des messages non lus
      sendUnreadMessagesCount(socket);

      // Notifier l'expéditeur que ses messages ont été lus
      const senderSocketId = connectedUsers.get(data.from);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', {
          by: socket.user.username
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
  
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
    .sort({ createdAt: 1 })
    .limit(100);
    
    socket.emit('message_history', messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
  }
};

const sendUnreadMessagesCount = async (socket) => {
  try {
    // Compter les messages non lus par expéditeur
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          to: socket.user.username,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transformer le résultat en objet { username: count }
    const unreadCounts = {};
    unreadMessages.forEach(item => {
      unreadCounts[item._id] = item.count;
    });

    // Envoyer le comptage au client
    socket.emit('unread_messages', unreadCounts);
  } catch (error) {
    console.error('Error counting unread messages:', error);
  }
};

const handlePrivateMessage = async (io, socket, data) => {
  try {
    // Créer et sauvegarder le message
    const message = new Message({
      content: data.content,
      username: socket.user.username,
      userId: socket.user._id,
      to: data.to,
      isRead: false
    });
    
    const savedMessage = await message.save();
    
    // Préparer le message à envoyer
    const messageToSend = {
      id: savedMessage._id,
      content: savedMessage.content,
      username: savedMessage.username,
      to: savedMessage.to,
      timestamp: savedMessage.createdAt,
      isRead: savedMessage.isRead
    };

    // Envoyer au destinataire s'il est connecté
    const recipientSocketId = connectedUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private_message', messageToSend);
      
      // Envoyer une mise à jour du comptage des messages non lus
      sendUnreadMessagesCount(io.sockets.sockets.get(recipientSocketId));
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