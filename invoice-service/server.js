const express = require("express");
const mongoose = require("mongoose");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();
app.use(express.json());
app.use("/api/invoices", invoiceRoutes);

const PORT = 3004;

mongoose.connect("mongodb://127.0.0.1:27017/invoice-db")
    .then(() => console.log("[OK] Connecte a MongoDB"))
    .catch(err => console.log("[ERREUR] MongoDB:", err.message));

app.listen(PORT, () => {
    console.log("[OK] Invoice Service sur http://localhost:" + PORT);
});
