// =============================================
// middleware/validate.js
// Middleware de validation des entrées
// =============================================

const { body, validationResult } = require('express-validator');

// Règles de validation pour la création / mise à jour d'un client
const customerValidationRules = () => [
  body('name')
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .trim(),

  body('email')
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),

  body('phone')
    .notEmpty().withMessage('Le téléphone est obligatoire')
    .trim(),

  body('address.city').optional().trim(),
  body('address.street').optional().trim(),
  body('address.zip').optional().trim(),
  body('address.country').optional().trim(),
];

// Middleware de vérification des résultats
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { customerValidationRules, validate };
