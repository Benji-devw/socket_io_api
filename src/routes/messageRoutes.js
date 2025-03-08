const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/', auth, getMessages);

module.exports = router; 