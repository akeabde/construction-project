const express = require("express");

const Product = require("../models/Product");
const { checkAuth, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// Nettoyer une valeur texte (eviter null/undefined + espaces).
const cleanText = (value) => String(value || "").trim();

// Nettoyer la liste des caracteristiques (specs) produit.
const readSpecs = (rawSpecs) => {
  // Si ce n est pas un tableau, on retourne une liste vide.
  if (!Array.isArray(rawSpecs)) {
    return [];
  }

  // Version simple pour debutant: boucle classique.
  const specs = [];
  for (const item of rawSpecs) {
    const oneSpec = cleanText(item);
    if (oneSpec) {
      specs.push(oneSpec);
    }
  }

  return specs;
};

// Lire les champs produit depuis req.body.
const readProductPayload = (body) => {
  return {
    title: cleanText(body.title),
    description: cleanText(body.description),
    price: Number(body.price),
    imageUrl: cleanText(body.imageUrl),
    category: cleanText(body.category),
    stock: Number(body.stock || 0),
    unit: cleanText(body.unit || "piece"),
    featured: Boolean(body.featured),
    specs: readSpecs(body.specs),
  };
};

// Verifier les champs obligatoires avant create/update.
const isProductPayloadValid = (payload) => {
  if (!payload.title) return false;
  if (!payload.description) return false;
  if (Number.isNaN(payload.price)) return false;
  if (!payload.imageUrl) return false;
  if (!payload.category) return false;
  return true;
};

// GET /api/products
// Retourne la liste des produits (route publique).
router.get("/", async (req, res) => {
  try {
    // Lire les filtres optionnels.
    const search = cleanText(req.query.search);
    const category = cleanText(req.query.category);
    const featured = cleanText(req.query.featured);

    // Construire la requete Mongo pas a pas.
    const query = {};

    // Recherche texte simple dans plusieurs champs.
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Filtrer par categorie (sauf "all").
    if (category && category !== "all") {
      query.category = category;
    }

    // Filtrer les produits mis en avant.
    if (featured === "true") {
      query.featured = true;
    }

    // Charger les produits du plus recent au plus ancien.
    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Could not load products" });
  }
});

// GET /api/products/:id
// Retourne le detail d un produit.
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Could not load product" });
  }
});

// POST /api/products
// Creer un nouveau produit (admin uniquement).
router.post("/", checkAuth, checkAdmin, async (req, res) => {
  try {
    // Lire et nettoyer les champs.
    const payload = readProductPayload(req.body);

    // Verifier champs obligatoires.
    if (!isProductPayloadValid(payload)) {
      return res.status(400).json({ message: "title, description, price, imageUrl and category are required" });
    }

    // Creer produit en base.
    const product = await Product.create(payload);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Could not create product" });
  }
});

// PUT /api/products/:id
// Mettre a jour un produit (admin uniquement).
router.put("/:id", checkAuth, checkAdmin, async (req, res) => {
  try {
    // Lire et nettoyer les champs.
    const payload = readProductPayload(req.body);

    // Verifier champs obligatoires.
    if (!isProductPayloadValid(payload)) {
      return res.status(400).json({ message: "title, description, price, imageUrl and category are required" });
    }

    // Mettre a jour le produit.
    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Could not update product" });
  }
});

// DELETE /api/products/:id
// Supprimer un produit (admin uniquement).
router.delete("/:id", checkAuth, checkAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete product" });
  }
});

module.exports = router;
