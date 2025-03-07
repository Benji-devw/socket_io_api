const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema); 