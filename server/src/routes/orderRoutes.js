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

// POST /api/orders
// Creer une commande (utilisateur connecte).
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) Lire les champs.
    const items = req.body.items;
    const fullName = cleanText(req.body.fullName);
    const phone = cleanText(req.body.phone);
    const city = cleanText(req.body.city);
    const address = cleanText(req.body.address);
    const notes = cleanText(req.body.notes);

    // 2) Verifier les champs obligatoires.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    if (!fullName || !phone || !city || !address) {
      return res.status(400).json({ message: "fullName, phone, city and address are required" });
    }

    // 3) Garder seulement les lignes valides du panier.
    const validItems = [];
    for (const item of items) {
      const productId = cleanText(item.productId);
      const quantity = Number(item.quantity || 1);

      // Un item est valide si productId Mongo valide + quantity entier > 0.
      if (mongoose.Types.ObjectId.isValid(productId) && isValidQuantity(quantity)) {
        validItems.push({ productId, quantity });
      }
    }

    if (validItems.length === 0) {
      return res.status(400).json({ message: "No valid order items provided" });
    }

    // 4) Charger les produits concernes.
    const productIds = [];
    for (const item of validItems) {
      productIds.push(item.productId);
    }
    const products = await Product.find({ _id: { $in: productIds } });

    // 5) Construire les lignes de commande + verifier stock.
    const productById = new Map(products.map((product) => [String(product._id), product]));
    const orderItems = [];

    for (const item of validItems) {
      const product = productById.get(item.productId);
      if (!product) {
        continue;
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Stock insuffisant pour ${product.title}` });
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

    if (orderItems.length === 0) {
      return res.status(400).json({ message: "No matching products found for order items" });
    }

    // 6) Calculer le total.
    const totalAmount = calculateTotalAmount(orderItems);

    // 7) Sauvegarder la commande.
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      fullName,
      phone,
      city,
      address,
      notes,
    });

    // 8) Mettre a jour le stock (simple decrement).
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
    return res.status(500).json({ message: "Could not create order" });
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
