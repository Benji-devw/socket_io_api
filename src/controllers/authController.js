const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Fonction pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '7d' }
  );
};

// Inscription
const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      // Si un fichier a été uploadé, le supprimer
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }
    
    // Créer un nouvel utilisateur avec l'avatar s'il existe
    const avatarUrl = req.file ? `/avatars/${req.file.filename}` : undefined;
    const user = new User({ username, password, avatarUrl });
    await user.save();
    
    // Générer un token JWT
    const token = generateToken(user._id);
    
    res.status(201).json({ 
      token,
      username: user.username,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    // Si une erreur survient et qu'un fichier a été uploadé, le supprimer
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: error.message });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    const token = generateToken(user._id);
    
    res.json({ 
      token, 
      username: user.username,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Récupérer le profil
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      // Si un fichier a été uploadé, le supprimer
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Si le nom d'utilisateur est fourni et différent, vérifier qu'il n'est pas déjà pris
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        // Si un fichier a été uploadé, le supprimer
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }
      user.username = username;
    }
    
    // Si un nouvel avatar est fourni
    if (req.file) {
      // Supprimer l'ancien avatar s'il existe et n'est pas l'avatar par défaut
      if (user.avatarUrl && !user.avatarUrl.includes('default-avatar') && fs.existsSync(path.join(__dirname, '../../public', user.avatarUrl))) {
        fs.unlinkSync(path.join(__dirname, '../../public', user.avatarUrl));
      }
      
      // Mettre à jour l'URL de l'avatar
      user.avatarUrl = `/avatars/${req.file.filename}`;
    }
    
    await user.save();
    
    res.json({ 
      message: 'Profil mis à jour avec succès',
      user: {
        username: user.username,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    // Si une erreur survient et qu'un fichier a été uploadé, le supprimer
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
}; 