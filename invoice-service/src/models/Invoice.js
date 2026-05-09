const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "paid", "cancelled"],
        default: "pending"
    },
    paymentDate: { type: Date },
    paymentMethod: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
    invoiceDate: { type: Date, default: Date.now },
    pdfUrl: String
});

module.exports = mongoose.model("Invoice", invoiceSchema);
