// ============================================================
// middleware/errorHandler.js - Gestion centralisée des erreurs
// Pattern : Error Boundary (robustesse du service)
// ============================================================

const errorHandler = (err, req, res, next) => {
  console.error(`[Product Service] Erreur : ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors,
    });
  }

  // Violation de contrainte unique (duplicate key)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Un produit avec ce ${field} existe déjà`,
      field,
    });
  }

  // ID MongoDB invalide
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Identifiant invalide',
    });
  }

  // Erreur générique
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
  });
};

// Wrapper async pour éviter les try/catch répétitifs dans les routes
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
