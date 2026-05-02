// ============================================================
// server.js - Point d'entrée du Product Service
// ERP Microservices - Master 1 ISI 2026
// ============================================================

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3001;

// Démarrage séquentiel : DB d'abord, puis le serveur HTTP
const startServer = async () => {
  try {
    // 1. Connexion à MongoDB
    await connectDB();

    // 2. Démarrage du serveur Express
    const server = app.listen(PORT, () => {
      console.log('════════════════════════════════════════════');
      console.log(`  🚀 Product Service démarré`);
      console.log(`  Port     : ${PORT}`);
      console.log(`  Env      : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Health   : http://localhost:${PORT}/health`);
      console.log(`  API      : http://localhost:${PORT}/api/products`);
      console.log('════════════════════════════════════════════');
    });

    // Arrêt propre (Graceful Shutdown)
    // Crucial en microservices pour ne pas perdre de requêtes en cours
    const shutdown = async (signal) => {
      console.log(`\n[Product Service] Signal ${signal} reçu. Arrêt en cours...`);
      server.close(async () => {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('[Product Service] Connexions fermées. Service arrêté.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop
    process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C

    // Gestion des promesses non capturées
    process.on('unhandledRejection', (reason) => {
      console.error('[Product Service] Promesse non capturée :', reason);
      shutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('[Product Service] Échec du démarrage :', error.message);
    process.exit(1);
  }
};

startServer();
