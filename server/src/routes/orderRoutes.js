const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const { checkAuth, checkAdmin } = require("../middleware/auth");
const { ORDER_STATUSES } = require("../constants/orderStatus");

const router = express.Router();

// --- FONCTIONS D'AIDE (HELPERS) ---

// 1) Nettoyer un texte.
const nettoyerTexte = (valeur) => {
  return String(valeur || "").trim();
};

// 2) Vérifier si un nombre est une quantité valide (Entier > 0).
const verifierSiQuantiteValide = (valeur) => {
  const nombre = Number(valeur);
  return Number.isInteger(nombre) && nombre > 0;
};

// 3) Calculer le montant total d'une commande.
const calculerMontantTotal = (listeArticles) => {
  let total = 0;
  for (const article of listeArticles) {
    total = total + article.lineTotal;
  }
  return total;
};

// --- ROUTES ---

// ============================================================
// ROUTE : CREER UNE COMMANDE (POST /api/orders)
// Action : Valide le panier, calcule le prix et crée la commande.
// ============================================================
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) On récupère les infos envoyées par le client.
    const articlesDuPanier = req.body.items;
    const nomComplet = nettoyerTexte(req.body.fullName);
    const telephone = nettoyerTexte(req.body.phone);
    const ville = nettoyerTexte(req.body.city);
    const adresse = nettoyerTexte(req.body.address);
    const codesPostauxOuNotes = nettoyerTexte(req.body.notes);

    // 2) Vérifications de base (Est-ce que tout est rempli ?).
    if (!Array.isArray(articlesDuPanier) || articlesDuPanier.length === 0) {
      return res.status(400).json({ message: "Votre panier est vide." });
    }

    if (!nomComplet || !telephone || !ville || !adresse) {
      return res.status(400).json({ message: "Merci de remplir vos coordonnées de livraison." });
    }

    // 3) Préparation de la liste finale des articles.
    const articlesFinalises = [];

    // On boucle sur chaque article envoyé par le frontend.
    for (const item of articlesDuPanier) {
      const idProduit = nettoyerTexte(item.productId);
      const quantiteVoulue = Number(item.quantity || 1);

      // On vérifie si l'ID est valide et si la quantité est correcte.
      if (!mongoose.Types.ObjectId.isValid(idProduit) || !verifierSiQuantiteValide(quantiteVoulue)) {
        continue; // On passe à l'article suivant si celui-ci est invalide.
      }

      // On cherche le produit en base de données pour avoir son VRAI prix.
      const produitEnBase = await Product.findById(idProduit);

      if (!produitEnBase) {
        return res.status(404).json({ message: `Le produit ${idProduit} n'existe plus.` });
      }

      // On vérifie si on a assez de stock.
      if (produitEnBase.stock < quantiteVoulue) {
        return res.status(400).json({ message: `Désolé, plus assez de stock pour : ${produitEnBase.title}` });
      }

      // On calcule le prix pour cette ligne (Prix x Quantité).
      const totalLigne = produitEnBase.price * quantiteVoulue;

      // On ajoute cet article à notre liste finale.
      articlesFinalises.push({
        product: produitEnBase._id,
        title: produitEnBase.title,
        imageUrl: produitEnBase.imageUrl,
        price: produitEnBase.price,
        quantity: quantiteVoulue,
        lineTotal: totalLigne
      });
    }

    // 4) On calcule le montant global de la commande.
    const prixTotalCommande = calculerMontantTotal(articlesFinalises);

    // 5) On enregistre la commande dans la base de données.
    const nouvelleCommande = await Order.create({
      user: req.user.id,
      items: articlesFinalises,
      totalAmount: prixTotalCommande,
      fullName: nomComplet,
      phone: telephone,
      city: ville,
      address: adresse,
      notes: codesPostauxOuNotes
    });

    // 6) MISE À JOUR DU STOCK : On retire ce qu'on a vendu.
    for (const articleVendu of articlesFinalises) {
      await Product.findByIdAndUpdate(articleVendu.product, {
        $inc: { stock: -articleVendu.quantity }
      });
    }

    // 7) Succès !
    return res.status(201).json(nouvelleCommande);

  } catch (erreurTechnique) {
    console.error("Erreur commande:", erreurTechnique);
    return res.status(500).json({ message: "Erreur lors de la création de votre commande." });
  }
});

// ============================================================
// ROUTE : VOIR MES COMMANDES (GET /api/orders/mine)
// ============================================================
router.get("/mine", checkAuth, async (req, res) => {
  try {
    // On cherche les commandes qui appartiennent à l'utilisateur connecté.
    const mesCommandes = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(mesCommandes);
  } catch (erreur) {
    return res.status(500).json({ message: "Impossible de charger vos commandes." });
  }
});

// ============================================================
// ROUTE : VOIR TOUTES LES COMMANDES (GET /api/orders) - ADMIN
// ============================================================
router.get("/", checkAuth, checkAdmin, async (req, res) => {
  try {
    // On récupère tout, et on ajoute les infos de l'utilisateur (nom, email).
    const toutesLesCommandes = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    return res.json(toutesLesCommandes);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors du chargement des commandes admin." });
  }
});

// ============================================================
// ROUTE : CHANGER LE STATUT (PATCH /api/orders/:id/status) - ADMIN
// ============================================================
router.patch("/:id/status", checkAuth, checkAdmin, async (req, res) => {
  try {
    const identifiant = req.params.id;
    const nouveauStatut = req.body.status;

    // On met à jour le statut uniquement.
    const commandeModifiee = await Order.findByIdAndUpdate(
      identifiant, 
      { status: nouveauStatut }, 
      { new: true }
    );

    if (!commandeModifiee) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    return res.json(commandeModifiee);
  } catch (erreur) {
    return res.status(500).json({ message: "Échec du changement de statut." });
  }
});

module.exports = router;
