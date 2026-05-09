// =============================================
// routes/customer.routes.js
// Routes + Contrôleurs - Customer Service
// =============================================

const express = require("express");
const router = express.Router();
const Customer = require("../models/customer.model");
const { customerValidationRules, validate } = require("../middleware/validate");

// ─────────────────────────────────────────────
// POST /api/customers
// Créer un nouveau client
// ─────────────────────────────────────────────
router.post("/", customerValidationRules(), validate, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Vérifier l'unicité de l'email
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Un client avec cet email existe déjà",
      });
    }

    // Normaliser l'adresse
    let normalizedAddress = address;
    if (typeof address === "string") {
      normalizedAddress = {
        street: address,
        city: "",
        state: "",
        zip: "",
        country: "Algérie",
      };
    }

    const customer = new Customer({
      name,
      email,
      phone,
      address: normalizedAddress,
    });
    const saved = await customer.save();

    return res.status(201).json({
      success: true,
      message: "Client créé avec succès",
      data: saved,
    });
  } catch (error) {
    console.error("[POST /customers]", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du client",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/customers
// Récupérer tous les clients (avec pagination)
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtre optionnel par nom ou email
    const search = req.query.search;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des clients récupérée",
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /customers]", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des clients",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/customers/:id
// Récupérer un client par son ID
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Aucun client trouvé avec l'id : ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client trouvé",
      data: customer,
    });
  } catch (error) {
    // Gérer les IDs MongoDB malformés
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID invalide",
      });
    }
    console.error("[GET /customers/:id]", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/customers/:id
// Mettre à jour un client existant
// ─────────────────────────────────────────────
router.put("/:id", customerValidationRules(), validate, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Vérifier que l'email n'appartient pas à un autre client
    const emailOwner = await Customer.findOne({ email: email.toLowerCase() });
    if (emailOwner && emailOwner._id.toString() !== req.params.id) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé par un autre client",
      });
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Aucun client trouvé avec l'id : ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client mis à jour avec succès",
      data: updated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }
    console.error("[PUT /customers/:id]", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour",
      error: error.message,
    });
  }
});

module.exports = router;
