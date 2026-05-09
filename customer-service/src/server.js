// =============================================
// server.js - Point d'entrée Customer Service
// ERP Microservices | Master 1 ISI 2026
// Groupe : Partie 1/5
// =============================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/database");
const customerRoutes = require("./routes/customer.routes");

const app = express();
const PORT = process.env.PORT || 3001;

process.env.MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ── Connexion base de données ──────────────────
connectDB();

// ── Middlewares globaux ────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// ── Routes ────────────────────────────────────
app.use("/api/customers", customerRoutes);

// ── Health Check ──────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "customer-service",
    status: "UP",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// ── Route inconnue (404) ───────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée : ${req.method} ${req.originalUrl}`,
  });
});

// ── Gestionnaire d'erreurs global ─────────────
app.use((err, req, res, next) => {
  console.error("💥 Erreur non gérée :", err.stack);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ── Démarrage du serveur ───────────────────────
app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════");
  console.log("  🚀  Customer Service démarré             ");
  console.log(`  📡  Port       : ${PORT}                 `);
  console.log(
    `  🌿  MongoDB    : ${process.env.MONGODB_URI || process.env.MONGO_URI}`,
  );
  console.log(`  🔧  Env        : ${process.env.NODE_ENV} `);
  console.log("═══════════════════════════════════════════");
});

module.exports = app;
