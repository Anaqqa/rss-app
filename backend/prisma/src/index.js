const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const feedsRoutes = require('./routes/feeds');
const collectionsRoutes = require('./routes/collections');
const articlesRoutes = require('./routes/articles');

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Vérification de la connexion à la base de données
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', message: 'Connected to database' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/articles', articlesRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Gestion des erreurs non interceptées
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});