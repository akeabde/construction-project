const express = require("express");

const Product = require("../models/Product");
const { checkAuth, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// --- FONCTIONS D'AIDE (HELPERS) ---

// 1) Nettoyer un texte simple (enlever les espaces inutiles).
const nettoyerTexte = (valeur) => {
  return String(valeur || "").trim();
};

// 2) Extraire proprement la liste des caractéristiques (specs).
const extraireCaracteristiques = (listeBrute) => {
  if (!Array.isArray(listeBrute)) {
    return [];
  }

  const caracteristiquesNettoyées = [];
  for (const element of listeBrute) {
    const texteNettoyé = nettoyerTexte(element);
    if (texteNettoyé !== "") {
      caracteristiquesNettoyées.push(texteNettoyé);
    }
  }
  return caracteristiquesNettoyées;
};

// 3) Vérifier si les informations d'un produit sont complètes.
const verifierSiProduitEstValide = (donnees) => {
  if (!donnees.title) return false;       // Titre manquant ?
  if (!donnees.description) return false; // Description manquante ?
  if (!donnees.price) return false;       // Prix manquant ?
  if (!donnees.category) return false;    // Catégorie manquante ?
  if (!donnees.imageUrl) return false;    // Image manquante ?
  return true; // Tout est bon !
};

// --- ROUTES ---

// ============================================================
// ROUTE : VOIR TOUS LES PRODUITS (GET /api/products)
// ============================================================
router.get("/", async (req, res) => {
  try {
    // 1) On récupère les filtres demandés dans l'URL.
    const motCleRecherche = nettoyerTexte(req.query.search);
    const categorieChoisie = nettoyerTexte(req.query.category);
    const estMisEnAvant = nettoyerTexte(req.query.featured);

    // 2) On prépare la recherche pour MongoDB.
    const filtreMongo = {};

    // Si on cherche un mot clé précis.
    if (motCleRecherche !== "") {
      filtreMongo.$or = [
        { title: { $regex: motCleRecherche, $options: "i" } },
        { category: { $regex: motCleRecherche, $options: "i" } }
      ];
    }

    // Si on veut une catégorie précise (et pas 'toutes').
    if (categorieChoisie !== "" && categorieChoisie !== "all") {
      filtreMongo.category = categorieChoisie;
    }

    // Si on veut uniquement les produits "Coups de coeur".
    if (estMisEnAvant === "true") {
      filtreMongo.featured = true;
    }

    // 3) On lance la recherche dans la base de données.
    const listeDesProduits = await Product.find(filtreMongo).sort({ createdAt: -1 });

    // 4) On renvoie la liste au client.
    return res.json(listeDesProduits);

  } catch (erreur) {
    console.error("Erreur technique produits:", erreur);
    return res.status(500).json({ message: "Impossible de charger le catalogue." });
  }
});

// ============================================================
// ROUTE : VOIR LE DETAIL D'UN PRODUIT (GET /api/products/:id)
// ============================================================
router.get("/:id", async (req, res) => {
  try {
    const identifiant = req.params.id;
    const produitTrouve = await Product.findById(identifiant);

    if (!produitTrouve) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    return res.json(produitTrouve);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors du chargement." });
  }
});

// ============================================================
// ROUTE : CREER UN PRODUIT (POST /api/products) - ADMIN
// ============================================================
router.post("/", checkAuth, checkAdmin, async (req, res) => {
  try {
    // 1) On prépare les données envoyées par l'admin.
    const nouvellesDonnees = {
      title: nettoyerTexte(req.body.title),
      description: nettoyerTexte(req.body.description),
      price: Number(req.body.price),
      imageUrl: nettoyerTexte(req.body.imageUrl),
      category: nettoyerTexte(req.body.category),
      stock: Number(req.body.stock || 0),
      unit: nettoyerTexte(req.body.unit || "pièce"),
      featured: Boolean(req.body.featured),
      specs: extraireCaracteristiques(req.body.specs),
    };

    // 2) On vérifie si tout est correct.
    if (verifierSiProduitEstValide(nouvellesDonnees) === false) {
      return res.status(400).json({ message: "Veuillez remplir toutes les informations obligatoires." });
    }

    // 3) On enregistre dans la base.
    const produitCree = await Product.create(nouvellesDonnees);

    return res.status(201).json(produitCree);
  } catch (erreur) {
    console.error("Erreur création produit:", erreur);
    return res.status(500).json({ message: "Échec de la création du produit." });
  }
});

// ============================================================
// ROUTE : MODIFIER UN PRODUIT (PUT /api/products/:id) - ADMIN
// ============================================================
router.put("/:id", checkAuth, checkAdmin, async (req, res) => {
  try {
    const identifiant = req.params.id;
    
    // 1) On prépare les modifications.
    const modifications = {
      title: nettoyerTexte(req.body.title),
      description: nettoyerTexte(req.body.description),
      price: Number(req.body.price),
      imageUrl: nettoyerTexte(req.body.imageUrl),
      category: nettoyerTexte(req.body.category),
      stock: Number(req.body.stock),
      unit: nettoyerTexte(req.body.unit),
      featured: Boolean(req.body.featured),
      specs: extraireCaracteristiques(req.body.specs),
    };

    // 2) On met à jour le produit.
    const produitMisAJour = await Product.findByIdAndUpdate(identifiant, modifications, { 
      new: true,         // Nous renvoie le produit après modif.
      runValidators: true // Vérifie que les données sont conformes au modèle.
    });

    if (!produitMisAJour) {
      return res.status(404).json({ message: "Produit impossible à modifier (introuvable)." });
    }

    return res.json(produitMisAJour);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors de la modification." });
  }
});

// ============================================================
// ROUTE : SUPPRIMER UN PRODUIT (DELETE /api/products/:id) - ADMIN
// ============================================================
router.delete("/:id", checkAuth, checkAdmin, async (req, res) => {
  try {
    const identifiant = req.params.id;
    const produitSupprime = await Product.findByIdAndDelete(identifiant);

    if (!produitSupprime) {
      return res.status(404).json({ message: "Produit déjà supprimé ou introuvable." });
    }

    return res.json({ message: "Félicitations, le produit a été supprimé." });
  } catch (erreur) {
    return res.status(500).json({ message: "Échec de la suppression." });
  }
});

module.exports = router;
