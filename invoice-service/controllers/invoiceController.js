const Invoice = require("../models/Invoice");

exports.createInvoice = async (req, res) => {
    try {
        const { orderId, customerId, amount } = req.body;
        const invoice = new Invoice({ orderId, customerId, amount });
        await invoice.save();
        res.status(201).json({
            message: "Facture creee avec succes",
            invoice
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ invoiceDate: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Facture non trouvee" });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
