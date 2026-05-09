const crypto = require("crypto");
global.crypto = crypto;
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const orderRoutes = require("./routes/orderRoutes");

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "order-service",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3003;

const mongoURI = process.env.MONGO_URI || "mongodb://mongo-order:27017/order-db";
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Order Service connecté à MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

app.listen(PORT, () => {
  console.log(`🚀 Order Service démarré sur http://localhost:${PORT}`);
});
