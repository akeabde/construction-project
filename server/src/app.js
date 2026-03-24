const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const projectRoutes = require("./routes/projectRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();

const app = express();

// Autoriser tous les appels (CORS) pour le developpement/demo.
const corsOptions = {
  origin: "*",
};

// Middlewares globaux.
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

// Route de test rapide pour verifier que l API tourne.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes principales de l application.
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);

// Si aucune route ne correspond, retourner 404.
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Gestion d erreur globale (dernier middleware).
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
