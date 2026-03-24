const mongoose = require("mongoose");

// ============================================================
// MODELE : PRODUCT (Produit)
// Role : Gère le catalogue des produits (prix, stock, etc.).
// ============================================================
const productSchema = new mongoose.Schema(
  {
    // Nom affiché du produit.
    title: { type: String, required: true, trim: true },
    // Description détaillée.
    description: { type: String, required: true, trim: true },
    // Prix unitaire (en Dirhams par exemple).
    price: { type: Number, required: true, min: 0 },
    // Lien vers l'image du produit.
    imageUrl: { type: String, required: true, trim: true },
    // Catégorie (ex: 'Matériaux', 'Outillage').
    category: { type: String, required: true, trim: true },
    // Quantité disponible en stock.
    stock: { type: Number, default: 0, min: 0 },
    // Unité de mesure (ex: 'sac', 'mètre', 'pièce').
    unit: { type: String, default: "piece", trim: true },
    // Est-ce que ce produit doit apparaître en "Une" ?
    featured: { type: Boolean, default: false },
    // Liste de détails techniques (Facultatif).
    specs: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
