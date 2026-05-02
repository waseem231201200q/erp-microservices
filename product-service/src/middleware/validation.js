// ============================================================
// middleware/validation.js - Validation des données entrantes
// Pattern : Middleware Express (séparation des préoccupations)
// ============================================================

const Joi = require('joi');

// Schéma de validation pour la création d'un produit
const createProductSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[A-Z0-9\-]+$/)
    .uppercase()
    .required()
    .messages({
      'string.pattern.base': "L'ID doit contenir uniquement des lettres majuscules, chiffres et tirets",
      'any.required': "L'identifiant produit est obligatoire",
    }),

  name: Joi.string().min(2).max(150).required().messages({
    'any.required': 'Le nom du produit est obligatoire',
    'string.min': 'Le nom doit contenir au moins 2 caractères',
  }),

  category: Joi.string()
    .valid(
      'Téléphones',
      'Ordinateurs',
      'Tablettes',
      'Accessoires',
      'Audio',
      'TV & Écrans',
      'Stockage',
      'Réseau',
      'Autre'
    )
    .required()
    .messages({
      'any.only': 'Catégorie non valide',
      'any.required': 'La catégorie est obligatoire',
    }),

  price: Joi.number().positive().required().messages({
    'number.positive': 'Le prix doit être positif',
    'any.required': 'Le prix est obligatoire',
  }),

  quantityInStock: Joi.number().integer().min(0).required().messages({
    'number.integer': 'La quantité doit être un entier',
    'number.min': 'Le stock ne peut pas être négatif',
    'any.required': 'La quantité en stock est obligatoire',
  }),

  supplier: Joi.string().max(100).required().messages({
    'any.required': 'Le fournisseur est obligatoire',
  }),

  isActive: Joi.boolean().default(true),
});

// Schéma de validation pour la mise à jour (stock et prix)
const updateProductSchema = Joi.object({
  quantityInStock: Joi.number().integer().min(0),
  price: Joi.number().positive(),
  name: Joi.string().min(2).max(150),
  isActive: Joi.boolean(),
  supplier: Joi.string().max(100),
}).min(1).messages({
  'object.min': 'Au moins un champ à mettre à jour est requis',
});

// Factory middleware de validation
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Retourne toutes les erreurs, pas seulement la première
    stripUnknown: true, // Supprime les champs non autorisés
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors,
    });
  }

  req.body = value; // Remplace les données avec les valeurs validées/nettoyées
  next();
};

module.exports = {
  validateCreate: validate(createProductSchema),
  validateUpdate: validate(updateProductSchema),
};
