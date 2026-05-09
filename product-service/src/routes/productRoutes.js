// ============================================================
// routes/productRoutes.js - Endpoints REST du Product Service
//
// API Contract (contrat d'interface exposé aux autres services) :
//   POST   /api/products              → Créer un produit
//   GET    /api/products              → Lister tous les produits
//   GET    /api/products/low-stock    → Produits en alerte stock
//   GET    /api/products/:id          → Détail d'un produit
//   PUT    /api/products/:id          → Mettre à jour un produit
//   DELETE /api/products/:id          → Désactiver un produit (soft delete)
// ============================================================

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { validateCreate, validateUpdate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// ──────────────────────────────────────────────
// POST /api/products
// Créer un nouveau produit
// ──────────────────────────────────────────────
router.post(
  '/',
  validateCreate,
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product,
    });
  })
);

// ──────────────────────────────────────────────
// GET /api/products
// Lister tous les produits (avec filtres et pagination)
// Query params : category, supplier, minPrice, maxPrice, page, limit, search
// ──────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      category,
      supplier,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
      sort = 'name',
    } = req.query;

    // Construction dynamique du filtre
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (supplier) filter.supplier = new RegExp(supplier, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ──────────────────────────────────────────────
// GET /api/products/low-stock
// IMPORTANT : Cette route DOIT être AVANT /api/products/:id
// sinon Express interpréterait "low-stock" comme un :id
// ──────────────────────────────────────────────
router.get(
  '/low-stock',
  asyncHandler(async (req, res) => {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

    const products = await Product.find({
      isActive: true,
      quantityInStock: { $lte: threshold },
    }).sort({ quantityInStock: 1 }); // Du plus critique au moins critique

    res.json({
      success: true,
      message: `${products.length} produit(s) en alerte stock (seuil : ${threshold} unités)`,
      threshold,
      data: products,
    });
  })
);

// ──────────────────────────────────────────────
// PATCH /api/products/:id/stock-adjust
// Ajustement atomique du stock (+/-)
// ──────────────────────────────────────────────
router.patch(
  '/:id/stock-adjust',
  asyncHandler(async (req, res) => {
    const { delta } = req.body;
    if (!Number.isInteger(delta)) {
      return res.status(400).json({
        success: false,
        message: 'Le champ delta doit être un entier',
      });
    }

    if (delta < 0) {
      const product = await Product.findOneAndUpdate(
        {
          id: req.params.id.toUpperCase(),
          isActive: true,
          quantityInStock: { $gte: Math.abs(delta) },
        },
        { $inc: { quantityInStock: delta } },
        { new: true }
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Produit introuvable ou stock insuffisant',
        });
      }

      return res.json({
        success: true,
        message: 'Stock décrémenté avec succès',
        data: product,
      });
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id.toUpperCase(), isActive: true },
      { $inc: { quantityInStock: delta } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit "${req.params.id}" introuvable`,
      });
    }

    return res.json({
      success: true,
      message: 'Stock incrémenté avec succès',
      data: product,
    });
  })
);

// ──────────────────────────────────────────────
// GET /api/products/:id
// Récupérer un produit par son identifiant métier
// ──────────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({
      id: req.params.id.toUpperCase(),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit "${req.params.id}" introuvable`,
      });
    }

    res.json({
      success: true,
      data: product,
    });
  })
);

// ──────────────────────────────────────────────
// PUT /api/products/:id
// Mettre à jour un produit (notamment le stock)
// Utilisé par Order Service pour décrémenter le stock
// lors de la validation d'une commande
// ──────────────────────────────────────────────
router.put(
  '/:id',
  validateUpdate,
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id.toUpperCase() },
      { $set: req.body },
      {
        new: true,        // Retourne le document mis à jour
        runValidators: true, // Valide avec le schéma Mongoose
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit "${req.params.id}" introuvable`,
      });
    }

    // Alerte si le stock vient de passer sous le seuil
    const warning =
      product.lowStock
        ? `⚠ Alerte : stock faible (${product.quantityInStock} unité(s) restante(s))`
        : null;

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      warning,
      data: product,
    });
  })
);

// ──────────────────────────────────────────────
// DELETE /api/products/:id
// Soft delete : désactivation (isActive = false)
// On ne supprime jamais physiquement un produit
// pour conserver l'historique des commandes/factures
// ──────────────────────────────────────────────
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { id: req.params.id.toUpperCase() },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit "${req.params.id}" introuvable`,
      });
    }

    res.json({
      success: true,
      message: 'Produit désactivé (soft delete)',
      data: { id: product.id, name: product.name, isActive: product.isActive },
    });
  })
);

module.exports = router;
