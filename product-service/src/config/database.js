// ============================================================
// config/database.js - Connexion MongoDB
// Pattern : Single Responsibility (connexion isolée)
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`[Product Service] MongoDB connecté : ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('disconnected', () => {
      console.warn('[Product Service] MongoDB déconnecté. Tentative de reconnexion...');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[Product Service] Erreur MongoDB : ${err.message}`);
    });

  } catch (error) {
    console.error(`[Product Service] Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1); // Arrêt du service si la DB est inaccessible
  }
};

module.exports = connectDB;
