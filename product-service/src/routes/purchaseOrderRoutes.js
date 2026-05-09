const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { supplierCode, items, expectedDate } = req.body;
    if (!supplierCode || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'supplierCode et items requis' });
    }

    const supplier = await Supplier.findOne({
      code: supplierCode.toUpperCase(),
      isActive: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const po = await PurchaseOrder.create({
      supplierCode: supplierCode.toUpperCase(),
      items: items.map((item) => ({
        productId: String(item.productId || '').toUpperCase(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      })),
      expectedDate,
      status: 'ordered',
      totalAmount,
    });

    res.status(201).json({ success: true, data: po });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const poList = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: poList });
  })
);

router.patch(
  '/:id/receive',
  asyncHandler(async (req, res) => {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Commande d'achat introuvable" });
    }
    if (po.status === 'received') {
      return res.status(400).json({ success: false, message: 'Déjà reçue' });
    }

    for (const item of po.items) {
      await Product.findOneAndUpdate(
        { id: item.productId, isActive: true },
        { $inc: { quantityInStock: item.quantity } }
      );
    }

    po.status = 'received';
    po.receivedDate = new Date();
    await po.save();

    return res.json({ success: true, data: po });
  })
);

module.exports = router;
