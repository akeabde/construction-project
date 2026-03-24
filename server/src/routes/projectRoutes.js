const express = require("express");

const ProjectRequest = require("../models/ProjectRequest");
const { checkAuth, checkAdmin } = require("../middleware/auth");
const { PROJECT_REQUEST_STATUSES } = require("../constants/projectRequestStatus");

const router = express.Router();

// --- FONCTIONS D'AIDE (HELPERS) ---

// 1) Nettoyer un texte simple.
const nettoyerTexte = (valeur) => {
  return String(valeur || "").trim();
};

// 2) Vérifier si les informations de la demande sont complètes.
const verifierDemandeProjet = (donnees) => {
  if (!donnees.fullName) return false;    // Nom manquant ?
  if (!donnees.phone) return false;       // Téléphone manquant ?
  if (!donnees.city) return false;        // Ville manquante ?
  if (!donnees.serviceType) return false; // Type de service manquant ?
  return true; // Tout est bon !
};

// --- ROUTES ---

// ============================================================
// ROUTE : DEMANDER UN PROJET / DEVIS (POST /api/projects)
// Action : Enregistre une nouvelle demande de travaux.
// ============================================================
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) On prépare les données envoyées dans le formulaire.
    const nouvellesDonnees = {
      fullName: nettoyerTexte(req.body.fullName),
      phone: nettoyerTexte(req.body.phone),
      city: nettoyerTexte(req.body.city),
      serviceType: nettoyerTexte(req.body.serviceType),
      budget: nettoyerTexte(req.body.budget),
      notes: nettoyerTexte(req.body.notes)
    };

    // 2) On vérifie si les informations obligatoires sont présentes.
    if (verifierDemandeProjet(nouvellesDonnees) === false) {
      return res.status(400).json({ message: "Veuillez remplir les champs obligatoires (Nom, Tél, Ville, Service)." });
    }

    // 3) On enregistre dans la base de données.
    const nouvelleDemande = await ProjectRequest.create(nouvellesDonnees);
    
    // 4) Succès !
    return res.status(201).json(nouvelleDemande);

  } catch (erreur) {
    console.error("Erreur demande projet:", erreur);
    return res.status(500).json({ message: "Impossible d'envoyer votre demande pour le moment." });
  }
});

// ============================================================
// ROUTE : VOIR TOUTES LES DEMANDES (GET /api/projects) - ADMIN
// ============================================================
router.get("/", checkAuth, checkAdmin, async (req, res) => {
  try {
    // On récupère toutes les demandes, triées par date (récentes en premier).
    const toutesLesDemandes = await ProjectRequest.find().sort({ createdAt: -1 });
    return res.json(toutesLesDemandes);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors du chargement des demandes." });
  }
});

// ============================================================
// ROUTE : CHANGER LE STATUT (PATCH /api/projects/:id/status) - ADMIN
// ============================================================
router.patch("/:id/status", checkAuth, checkAdmin, async (req, res) => {
  try {
    const identifiant = req.params.id;
    const nouveauStatut = req.body.status;

    // On vérifie si l'ID est correct dans l'URL.
    const demandeAModifier = await ProjectRequest.findById(identifiant);
    if (!demandeAModifier) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    // On met à jour uniquement le statut.
    demandeAModifier.status = nouveauStatut;
    await demandeAModifier.save();

    return res.json(demandeAModifier);
  } catch (erreur) {
    return res.status(500).json({ message: "Échec de la mise à jour du statut." });
  }
});

module.exports = router;
