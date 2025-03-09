# Socket.io Chat API

Une API de chat en temps réel construite avec Node.js, Express, Socket.io et MongoDB.

## Fonctionnalités

- 🔐 Authentification avec JWT
- 👤 Gestion des utilisateurs avec avatars
- 💬 Messagerie en temps réel
- 📝 Indicateur "X est en train d'écrire..."
- 🔄 Statut en ligne/hors ligne des utilisateurs
- 📱 API RESTful pour les opérations CRUD

## Technologies utilisées

- **Backend**: Node.js, Express
- **Base de données**: MongoDB, Mongoose
- **Temps réel**: Socket.io
- **Authentification**: JWT
- **Upload de fichiers**: Multer

## Installation

1. Cloner le dépôt
```bash
git clone <url-du-repo>
cd socket-api
```
1.bis Cloner le client
```bash
git clone https://github.com/Benji-devw/socket_io_client.git
cd socket_io_client
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Modifier les valeurs dans .env
```

4. Créer la base de donné
# Créer une base de données MongoDB
Database Name: socket-chat

5. Démarrer le serveur
```bash
npm run server
```

## Exemple User data
```bash
{
    "username": "Lisa",
    "password": "test123"
    "avatarUrl": "avatar-1741464682861-542601302.jpg"
}
{
    "username": "Thomas",
    "password": "z"
    "avatarUrl": "Thomas.png"

}
{
    "username": "ben",
    "password": "z"
    "avatarUrl": "avatar-1741465756899-154511153.gif"
}
```


## Structure du projet v1.0.0

```
socket-api/
├── public/                # Fichiers statiques
│   └── avatars/           # Images des avatars
├── src/
│   ├── config/            # Configuration
│   │   ├── database.js    # Configuration MongoDB
│   │   ├── multer.js      # Configuration upload fichiers
│   │   └── socket.js      # Configuration Socket.io
│   ├── controllers/       # Logique métier
│   │   ├── authController.js
│   │   └── messageController.js
│   ├── middleware/        # Middleware
│   │   ├── auth.js        # Middleware JWT
│   │   └── socketAuth.js  # Middleware Socket.io
│   ├── models/            # Modèles Mongoose
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/            # Routes Express
│   │   ├── authRoutes.js
│   │   └── messageRoutes.js
│   └── services/          # Services
│       └── socketService.js
└── server.js              # Point d'entrée
```

## API Endpoints

### Authentification

- **POST /auth/register** - Inscription
  - Body: `{ username, password, avatar (file) }`
  - Response: `{ token, username, avatarUrl }`

- **POST /auth/login** - Connexion
  - Body: `{ username, password }`
  - Response: `{ token, username, avatarUrl }`

- **GET /auth/profile** - Récupérer le profil (authentifié)
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ _id, username, avatarUrl, createdAt, updatedAt }`

- **PUT /auth/profile** - Mettre à jour le profil (authentifié)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ username, avatar (file) }`
  - Response: `{ message, user: { username, avatarUrl } }`

### Messages

- **GET /messages** - Récupérer les messages (authentifié)
  - Headers: `Authorization: Bearer <token>`
  - Response: `[{ content, username, userId, to, createdAt, updatedAt }]`

## Gestion des utilisateurs

### Mise à jour du profil

L'API permet aux utilisateurs de mettre à jour leur profil, notamment:
- Changer leur nom d'utilisateur
- Télécharger ou modifier leur avatar

#### Processus de mise à jour de l'avatar:

1. L'utilisateur envoie une requête `PUT` à `/auth/profile` avec:
   - Le token JWT dans l'en-tête `Authorization`
   - Un nouveau nom d'utilisateur (optionnel)
   - Un fichier image pour l'avatar (optionnel)

2. Le serveur:
   - Vérifie l'authenticité du token
   - Valide le nouveau nom d'utilisateur (s'il est fourni)
   - Traite l'image téléchargée avec Multer
   - Supprime l'ancien avatar si nécessaire
   - Enregistre le nouvel avatar dans `/public/avatars`
   - Met à jour l'URL de l'avatar dans la base de données

3. Restrictions sur les avatars:
   - Taille maximale: 5 MB
   - Types de fichiers acceptés: images uniquement (JPEG, PNG, GIF, etc.)
   - Nommage: les fichiers sont renommés automatiquement pour éviter les conflits

#### Exemple de requête avec curl:

```bash
curl -X PUT http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "username=nouveau_nom" \
  -F "avatar=@chemin/vers/image.jpg"
```

## Socket.io Events

### Client → Serveur

- **private_message** - Envoyer un message privé
  - Data: `{ content, to }`

- **typing_start** - Indiquer que l'utilisateur commence à écrire
  - Data: `{ to }`

- **typing_stop** - Indiquer que l'utilisateur a arrêté d'écrire
  - Data: `{ to }`

### Serveur → Client

- **users** - Liste des utilisateurs
  - Data: `[{ username, isOnline }]`

- **user_connected** - Un utilisateur s'est connecté
  - Data: `{ username, isOnline }`

- **user_disconnected** - Un utilisateur s'est déconnecté
  - Data: `{ username }`

- **private_message** - Recevoir un message privé
  - Data: `{ content, username, to, timestamp, id }`

- **message_history** - Historique des messages
  - Data: `[{ content, username, to, timestamp, id }]`

- **typing_start** - Un utilisateur commence à écrire
  - Data: `{ username }`

- **typing_stop** - Un utilisateur a arrêté d'écrire
  - Data: `{ username }`

## Authentification Socket.io

Pour se connecter au serveur Socket.io, il faut fournir un token JWT dans l'objet auth:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'votre-token-jwt'
  }
});
```

## Licence

MIT 