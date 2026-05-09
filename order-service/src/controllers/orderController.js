const crypto = require("crypto");
global.crypto = crypto;
const Order = require("../models/Order");
const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";
const INVOICE_SERVICE_URL =
  process.env.INVOICE_SERVICE_URL || "http://invoice-service:3004";
const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL || "http://customer-service:3001";

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

    try {
      await axios.get(`${CUSTOMER_SERVICE_URL}/api/customers/${customerId}`);
    } catch (error) {
      return res.status(400).json({ message: "Client introuvable" });
    }

    let totalAmount = 0;
    const verifiedProducts = [];
    const stockAdjustments = [];

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

        totalAmount += product.price * item.quantity;
        verifiedProducts.push({
          productId: item.productId,
          quantity: item.quantity,
        });
        stockAdjustments.push({
          productId: item.productId,
          delta: -Math.abs(item.quantity),
        });
      } catch (err) {
        return res.status(500).json({
          message: `Erreur produit ${item.productId}: ${err.message}`,
        });
      }
    }

    for (const adjustment of stockAdjustments) {
      try {
        await axios.patch(
          `${PRODUCT_SERVICE_URL}/api/products/${adjustment.productId}/stock-adjust`,
          { delta: adjustment.delta },
        );
      } catch (error) {
        return res.status(400).json({
          message: `Stock insuffisant pour le produit ${adjustment.productId}`,
        });
      }
    }

    const newOrder = new Order({
      customerId,
      products: verifiedProducts,
      totalAmount,
      status: "confirmed",
    });
    let savedOrder;
    try {
      savedOrder = await newOrder.save();
    } catch (error) {
      for (const adjustment of stockAdjustments) {
        await axios.patch(
          `${PRODUCT_SERVICE_URL}/api/products/${adjustment.productId}/stock-adjust`,
          { delta: Math.abs(adjustment.delta) },
        );
      }
      return res.status(500).json({ message: error.message });
    }

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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut de commande invalide" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    const previousStatus = order.status;
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.products) {
        await axios.patch(
          `${PRODUCT_SERVICE_URL}/api/products/${item.productId}/stock-adjust`,
          { delta: Math.abs(item.quantity) },
        );
      }
      try {
        await axios.patch(
          `${INVOICE_SERVICE_URL}/api/invoices/by-order/${order._id}/status`,
          { status: "cancelled" },
        );
      } catch (error) {
        console.error("Invoice cancellation sync failed:", error.message);
      }
    }

    order.status = status;
    await order.save();

    return res.json({ message: "Statut mis a jour", order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
