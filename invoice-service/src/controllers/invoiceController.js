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

exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status, paymentMethod, paymentReference } = req.body;
        if (!["pending", "paid", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Statut facture invalide" });
        }

        const update = { status };
        if (status === "paid") {
            update.paymentDate = new Date();
            if (paymentMethod) update.paymentMethod = paymentMethod;
            if (paymentReference) update.paymentReference = paymentReference;
        }

        const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!invoice) {
            return res.status(404).json({ message: "Facture non trouvee" });
        }
        return res.json({ message: "Facture mise a jour", invoice });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updateInvoiceStatusByOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status },
            { new: true }
        );
        if (!invoice) {
            return res.status(404).json({ message: "Facture non trouvee" });
        }
        return res.json({ message: "Facture mise a jour", invoice });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
