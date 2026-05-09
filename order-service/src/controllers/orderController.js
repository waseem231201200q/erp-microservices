const crypto = require("crypto");
global.crypto = crypto;
const Order = require("../models/Order");
const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";
const INVOICE_SERVICE_URL =
  process.env.INVOICE_SERVICE_URL || "http://invoice-service:3004";

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Commande non trouvée" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerId, products } = req.body;
    if (!customerId || !products || products.length === 0) {
      return res.status(400).json({ message: "customerId et produits requis" });
    }

    let totalAmount = 0;
    const verifiedProducts = [];

    for (const item of products) {
      try {
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/products/${item.productId}`,
        );
        const product = response.data?.data || response.data;

        if (!product || product.quantityInStock === undefined) {
          return res
            .status(404)
            .json({ message: `Produit ${item.productId} introuvable` });
        }

        if (product.quantityInStock < item.quantity) {
          return res
            .status(400)
            .json({ message: `Stock insuffisant pour ${product.name}` });
        }

        totalAmount += product.price * item.quantity;
        verifiedProducts.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      } catch (err) {
        return res.status(500).json({
          message: `Erreur produit ${item.productId}: ${err.message}`,
        });
      }
    }

    const newOrder = new Order({
      customerId,
      products: verifiedProducts,
      totalAmount,
      status: "confirmed",
    });
    const savedOrder = await newOrder.save();

    try {
      await axios.post(`${INVOICE_SERVICE_URL}/api/invoices`, {
        orderId: savedOrder._id,
        customerId: savedOrder.customerId,
        amount: savedOrder.totalAmount,
      });
    } catch (invoiceError) {
      console.error("Erreur facture:", invoiceError.message);
    }

    res.status(201).json({ message: "Commande créée", order: savedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
