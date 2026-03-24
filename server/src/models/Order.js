const mongoose = require("mongoose");
const { ORDER_STATUSES } = require("../constants/orderStatus");

// ============================================================
// MODELE : ORDER (Commande)
// Role : Enregistre les achats effectués par les clients.
// ============================================================

// --- Détail d'un produit dans la commande ---
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }, // prix * quantité
  },
  { _id: false }
);

// --- La commande globale ---
const orderSchema = new mongoose.Schema(
  {
    // Qui a passé la commande ?
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Liste des produits achetés.
    items: { type: [orderItemSchema], validate: [(items) => items.length > 0, "Détails requis"] },
    // Montant total à payer.
    totalAmount: { type: Number, required: true, min: 0 },
    
    // Informations de livraison (copiées du formulaire).
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    
    // État de la commande (ex: 'pending', 'confirmed', 'shipped').
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUSES[0],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
