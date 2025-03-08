const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const auth = require('../middleware/auth');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile 
} = require('../controllers/authController');

// Routes publiques
router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

// Routes protégées
router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('avatar'), updateProfile);

module.exports = router; 