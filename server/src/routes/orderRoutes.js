const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const { checkAuth, checkAdmin } = require("../middleware/auth");
const { ORDER_STATUSES } = require("../constants/orderStatus");

const router = express.Router();

// Nettoyer une valeur texte.
const cleanText = (value) => String(value || "").trim();

// Verifier une quantite d item.
const isValidQuantity = (value) => Number.isInteger(value) && value > 0;

// Statuts que l admin peut choisir (sans "in_progress" qui est automatique au debut).
const ADMIN_ORDER_STATUSES = ORDER_STATUSES.slice(1);

// Calculer total global de commande.
const calculateTotalAmount = (orderItems) => {
  let totalAmount = 0;
  for (const item of orderItems) {
    totalAmount += item.lineTotal;
  }
  return totalAmount;
};

// ============================================================
// ROUTE : CREER UNE COMMANDE (POST /api/orders)
// Action : Enregistre les produits du panier dans la base.
// ============================================================
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) On récupère les infos envoyées par le client.
    const items = req.body.items;
    const fullName = cleanText(req.body.fullName);
    const phone = cleanText(req.body.phone);
    const city = cleanText(req.body.city);
    const address = cleanText(req.body.address);
    const notes = cleanText(req.body.notes);

    // 2) Vérification de sécurité de base.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Le panier est vide." });
    }

    if (!fullName || !phone || !city || !address) {
      return res.status(400).json({ message: "Toutes les coordonnées de livraison sont requises." });
    }

    // 3) On vérifie que chaque produit existe et qu'il y a du stock.
    const validItems = [];
    for (const item of items) {
      const productId = cleanText(item.productId);
      const quantity = Number(item.quantity || 1);
      if (mongoose.Types.ObjectId.isValid(productId) && isValidQuantity(quantity)) {
        validItems.push({ productId, quantity });
      }
    }

    // 4) On charge les produits depuis la base de données.
    const productIds = validItems.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((p) => [String(p._id), p]));

    // 5) On construit la liste finale des produits commandés (avec prix à l'instant T).
    const orderItems = [];
    for (const item of validItems) {
      const product = productById.get(item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Stock insuffisant pour : ${product.title}` });
      }

      const lineTotal = product.price * item.quantity;
      orderItems.push({
        product: product._id,
        title: product.title,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // 6) On enregistre la commande finale.
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: calculateTotalAmount(orderItems),
      fullName,
      phone,
      city,
      address,
      notes,
    });

    // 7) Mise à jour du stock : On diminue les quantités vendues.
    const stockUpdates = orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    }));
    if (stockUpdates.length > 0) {
      await Product.bulkWrite(stockUpdates);
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error("Erreur commande:", error);
    return res.status(500).json({ message: "Impossible de créer la commande." });
  }
});

// GET /api/orders/mine
// Retourner les commandes du client connecte.
router.get("/mine", checkAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Could not load your orders" });
  }
});

// GET /api/orders
// Retourner toutes les commandes (admin).
router.get("/", checkAuth, checkAdmin, async (_req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Could not load orders" });
  }
});

// PATCH /api/orders/:id/status
// Changer le statut d une commande (admin).
router.patch("/:id/status", checkAuth, checkAdmin, async (req, res) => {
  try {
    // 1) Lire le statut choisi par admin.
    const status = req.body.status;

    // 2) Verifier que le statut est autorise.
    if (!ADMIN_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 3) Mettre a jour la commande.
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Could not update order status" });
  }
});

// DELETE /api/orders/:id
// Supprimer une commande (admin).
router.delete("/:id", checkAuth, checkAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete order" });
  }
});

module.exports = router;
