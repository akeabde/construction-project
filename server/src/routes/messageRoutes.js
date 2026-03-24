const express = require("express");

const ContactMessage = require("../models/ContactMessage");
const { checkAuth, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// --- FONCTION D'AIDE (HELPER) ---

// 1) Vérifier si l'utilisateur a le droit de supprimer ce message.
const verifierDroitSuppression = (messageAtester, utilisateurConnecte) => {
  // L'administrateur peut tout supprimer.
  if (utilisateurConnecte.role === "admin") {
    return true;
  }

  // Si l'utilisateur est celui qui a envoyé le message (via son ID).
  if (String(messageAtester.user) === String(utilisateurConnecte.id)) {
    return true;
  }

  // Par défaut, on refuse.
  return false;
};

// --- ROUTES ---

// ============================================================
// ROUTE : ENVOYER UN MESSAGE DE CONTACT (POST /api/messages)
// Action : Enregistre une question ou un message dans la base.
// ============================================================
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) On récupère les infos de l'utilisateur connecté.
    const nomExpediteur = req.user.name;
    const emailExpediteur = req.user.email;
    const telephone = String(req.body.phone || "").trim();
    const sujetDuMessage = String(req.body.subject || "").trim();
    const texteDuMessage = String(req.body.message || "").trim();

    // 2) On vérifie que le message n'est pas vide.
    if (!texteDuMessage) {
      return res.status(400).json({ message: "S'il vous plaît, écrivez un message avant d'envoyer." });
    }

    // 3) On crée l'enregistrement dans MongoDB.
    const nouveauMessage = await ContactMessage.create({
      user: req.user.id,
      name: nomExpediteur,
      email: emailExpediteur,
      phone: telephone,
      subject: sujetDuMessage,
      message: texteDuMessage
    });

    return res.status(201).json(nouveauMessage);

  } catch (erreur) {
    console.error("Erreur message contact:", erreur);
    return res.status(500).json({ message: "Échec de l'envoi du message." });
  }
});

// ============================================================
// ROUTE : VOIR MES MESSAGES (GET /api/messages/mine)
// ============================================================
router.get("/mine", checkAuth, async (req, res) => {
  try {
    // On cherche tous les messages envoyés par cet utilisateur.
    const mesMessages = await ContactMessage.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    return res.json(mesMessages);
  } catch (erreur) {
    return res.status(500).json({ message: "Impossible de charger vos messages." });
  }
});

// ============================================================
// ROUTE : VOIR TOUS LES MESSAGES (GET /api/messages) - ADMIN
// ============================================================
router.get("/", checkAuth, checkAdmin, async (req, res) => {
  try {
    // L'admin récupère tout pour pouvoir répondre.
    const tousLesMessages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.json(tousLesMessages);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors du chargement des messages admin." });
  }
});

// ============================================================
// ROUTE : RÉPONDRE À UN MESSAGE (PATCH /api/messages/:id/reply) - ADMIN
// ============================================================
router.patch("/:id/reply", checkAuth, checkAdmin, async (req, res) => {
  try {
    const identifiant = req.params.id;
    const reponseDeLAdmin = String(req.body.reply || "").trim();

    if (!reponseDeLAdmin) {
      return res.status(400).json({ message: "La réponse ne peut pas être vide." });
    }

    // On met à jour le message avec la réponse de l'admin.
    const messageMisAJour = await ContactMessage.findByIdAndUpdate(
      identifiant,
      {
        adminReply: reponseDeLAdmin,
        status: "replied", // Statut : "Répondu"
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!messageMisAJour) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    return res.json(messageMisAJour);
  } catch (erreur) {
    return res.status(500).json({ message: "Erreur lors de l'envoi de la réponse." });
  }
});

// ============================================================
// ROUTE : SUPPRIMER UN MESSAGE (DELETE /api/messages/:id)
// ============================================================
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const identifiant = req.params.id;
    
    // 1) On cherche le message.
    const messageTrouve = await ContactMessage.findById(identifiant);
    
    if (!messageTrouve) {
      return res.status(404).json({ message: "Message introuvable." });
    }

    // 2) On vérifie si l'utilisateur a le droit (Lui-même ou Admin).
    if (verifierDroitSuppression(messageTrouve, req.user) === false) {
      return res.status(403).json({ message: "Vous n'avez pas le droit de supprimer ce message." });
    }

    // 3) On supprime.
    await ContactMessage.findByIdAndDelete(identifiant);
    
    return res.json({ message: "Message supprimé avec succès." });
  } catch (erreur) {
    return res.status(500).json({ message: "Échec de la suppression." });
  }
});

module.exports = router;
