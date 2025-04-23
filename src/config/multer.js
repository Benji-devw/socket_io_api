const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier avatars s'il n'existe pas
const avatarDir = path.join(__dirname, '../../public/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec l'extension d'origine
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `avatar-${uniqueSuffix}${ext}`;
    // Ajouter l'URL complète
    req.fileUrl = `${process.env.API_URL}/avatars/${filename}`;
    cb(null, filename);
  }
});

// Filtre pour n'accepter que les images PNG, JPG et GIF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image PNG, JPG ou GIF'), false);
  }
};

// Limiter la taille des fichiers à 5MB
const limits = {
  fileSize: 5 * 1024 * 1024
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits
});

module.exports = upload; 