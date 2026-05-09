const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");

router.post("/", invoiceController.createInvoice);
router.get("/", invoiceController.getInvoices);
router.get("/:id", invoiceController.getInvoiceById);
router.patch("/:id/status", invoiceController.updateInvoiceStatus);
router.patch("/by-order/:orderId/status", invoiceController.updateInvoiceStatusByOrder);

module.exports = router;
