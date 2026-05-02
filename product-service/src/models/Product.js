// ============================================================
// models/Product.js - Modèle Mongoose du Produit
//
// Bounded Context : Product Service est seul responsable
// de la définition et persistance des données produit.
// Les autres services y accèdent uniquement via l'API REST.
// ============================================================

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    // Identifiant métier lisible (ex: PROD-2026-001)
    id: {
      type: String,
      required: [true, "L'identifiant produit est obligatoire"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9\-]+$/, "L'ID doit contenir uniquement des lettres, chiffres et tirets"],
    },

    name: {
      type: String,
      required: [true, 'Le nom du produit est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [150, 'Le nom ne peut pas dépasser 150 caractères'],
    },

    category: {
      type: String,
      required: [true, 'La catégorie est obligatoire'],
      trim: true,
      enum: {
        values: [
          'Téléphones',
          'Ordinateurs',
          'Tablettes',
          'Accessoires',
          'Audio',
          'TV & Écrans',
          'Stockage',
          'Réseau',
          'Autre',
        ],
        message: "Catégorie '{VALUE}' non reconnue",
      },
    },

    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
      set: (v) => Math.round(v * 100) / 100, // Arrondi à 2 décimales
    },

    quantityInStock: {
      type: Number,
      required: [true, 'La quantité en stock est obligatoire'],
      min: [0, 'Le stock ne peut pas être négatif'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'La quantité doit être un nombre entier',
      },
    },

    supplier: {
      type: String,
      required: [true, 'Le fournisseur est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom du fournisseur ne peut pas dépasser 100 caractères'],
    },

    // Champ calculé : indique si le produit est en alerte stock
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Timestamps automatiques : createdAt, updatedAt
    timestamps: true,

    // Transformation JSON : retire __v et _id interne, expose 'id'
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ──────────────────────────────────────────────
// Champ virtuel : alerte stock faible
// ──────────────────────────────────────────────
ProductSchema.virtual('lowStock').get(function () {
  const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
  return this.quantityInStock <= threshold;
});

// ──────────────────────────────────────────────
// Index pour accélérer les requêtes fréquentes
// ──────────────────────────────────────────────
ProductSchema.index({ category: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ quantityInStock: 1 }); // Pour les requêtes low-stock
ProductSchema.index({ name: 'text' }); // Recherche full-text

// ──────────────────────────────────────────────
// Méthode statique : mise à jour du stock
// Utilisée par Order Service via REST
// ──────────────────────────────────────────────
ProductSchema.statics.updateStock = async function (productId, quantity) {
  const product = await this.findOne({ id: productId });
  if (!product) throw new Error(`Produit ${productId} introuvable`);
  if (product.quantityInStock + quantity < 0) {
    throw new Error(`Stock insuffisant. Disponible : ${product.quantityInStock}`);
  }
  product.quantityInStock += quantity;
  return product.save();
};

module.exports = mongoose.model('Product', ProductSchema);
