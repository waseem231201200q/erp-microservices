// ============================================================
// app.js - Configuration de l'application Express
// Séparé de server.js pour faciliter les tests unitaires
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const productRoutes = require('./routes/productRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ──────────────────────────────────────────────
// Middlewares globaux
// ──────────────────────────────────────────────

// Sécurité HTTP (headers sécurisés)
app.use(helmet());

// CORS : dans une architecture microservices, chaque service
// gère ses propres autorisations d'accès cross-origin
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Logging HTTP
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parsing JSON
app.use(express.json({ limit: '10kb' })); // Limite la taille des requêtes
app.use(express.urlencoded({ extended: false }));

// ──────────────────────────────────────────────
// Health Check - utilisé par Docker/Kubernetes
// pour vérifier que le service est vivant
// ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'product-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ──────────────────────────────────────────────
// Routes métier
// ──────────────────────────────────────────────
app.use('/api/products', productRoutes);

// 404 - Route non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} introuvable`,
    service: 'product-service',
  });
});

// Gestionnaire d'erreurs centralisé (toujours en dernier)
app.use(errorHandler);

module.exports = app;
