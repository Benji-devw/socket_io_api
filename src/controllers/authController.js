const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// URL de base de l'API
const API_URL = process.env.API_URL || 'http://localhost:3000';

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
    let avatarUrl;
    if (req.file) {
      avatarUrl = `/avatars/${req.file.filename}`;
    } else if (req.fileUrl) {
      avatarUrl = req.fileUrl; // Déjà un chemin relatif
    }
    
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
    
    // Nous renvoyons l'avatar tel qu'il est stocké (chemin relatif)
    // Le client est responsable de préfixer avec l'URL de base si nécessaire
    
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
      console.log('req.file', req.file);
      // Supprimer l'ancien avatar s'il existe et n'est pas l'avatar par défaut
      if (user.avatarUrl && !user.avatarUrl.includes('default-avatar')) {
        // Extraire le chemin relatif, qu'il soit absolu ou relatif
        const avatarPath = user.avatarUrl.startsWith('http') 
          ? user.avatarUrl.replace(new RegExp(`^${API_URL}`), '')
          : user.avatarUrl;
        
        const fullPath = path.join(__dirname, '../../public', avatarPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Stocker le chemin relatif dans la base de données
      user.avatarUrl = `${API_URL}/avatars/${req.file.filename}`;
    }

    await user.save();
    
    // Générer un nouveau token pour refléter les changements
    const token = generateToken(user._id);
    
    res.json({ 
      message: 'Profil mis à jour avec succès',
      token,
      user: {
        username: user.username,
        avatarUrl: user.avatarUrl // Renvoie le chemin relatif tel que stocké
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