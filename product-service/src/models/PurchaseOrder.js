const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, required: true, uppercase: true, trim: true },
    items: [
      {
        productId: { type: String, required: true, uppercase: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'ordered', 'received', 'cancelled'],
      default: 'ordered',
    },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
