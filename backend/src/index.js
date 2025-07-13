const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Initialisation de l'application Express
const app = express();

// Configuration CORS et middleware JSON
app.use(cors());
app.use(express.json());

// Initialisation de Prisma avec des logs détaillés
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Middleware de gestion des erreurs globales
app.use((req, res, next) => {
  console.log();
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Route d'inscription simplifiée
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received');
    
    // Vérification des données requises
    const { name, email, password } = req.body;
    console.log('Data:', { name, email, password: '***' });
    
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Simuler une réponse réussie sans accéder à la base de données
    console.log('Returning success response');
    return res.status(201).json({
      message: 'Inscription réussie',
      token: 'test-token-123',
      user: {
        id: 1,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Route de connexion simplifiée
app.post('/api/auth/login', (req, res) => {
  try {
    console.log('Login request received');
    
    // Vérification des données requises
    const { email, password } = req.body;
    console.log('Data:', { email, password: '***' });
    
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    
    // Simuler une réponse réussie sans accéder à la base de données
    console.log('Returning success response');
    return res.status(200).json({
      message: 'Connexion réussie',
      token: 'test-token-456',
      user: {
        id: 1,
        name: 'Utilisateur Test',
        email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Gestionnaire d'erreur 404 pour les routes non trouvées
app.use((req, res) => {
  console.log();
  res.status(404).json({ message: 'Route not found' });
});

// Gestionnaire d'erreur global
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Port d'écoute
const PORT = process.env.PORT || 3001;

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log();
});

// Gestion des erreurs de démarrage du serveur
server.on('error', (error) => {
  console.error('Server startup error:', error);
});

// Gestion des erreurs non interceptées
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
