const express = require('express');
const Supplier = require('../models/Supplier');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  })
);

router.put(
  '/:code',
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    }
    return res.json({ success: true, data: supplier });
  })
);

router.delete(
  '/:code',
  asyncHandler(async (req, res) => {
    const supplier = await Supplier.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      { isActive: false },
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    }
    return res.json({ success: true, data: supplier });
  })
);

module.exports = router;
