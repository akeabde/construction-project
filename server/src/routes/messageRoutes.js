const express = require("express");

const ContactMessage = require("../models/ContactMessage");
const { checkAuth, checkAdmin } = require("../middleware/auth");

const router = express.Router();

// Nettoyer une valeur texte.
const cleanText = (value) => String(value || "").trim();

// Verifier si l utilisateur courant peut supprimer un message.
const canDeleteMessage = (message, user) => {
  // 1) Admin peut toujours supprimer.
  const isAdmin = user.role === "admin";
  if (isAdmin) {
    return true;
  }

  // 2) Proprietaire via user id.
  const isOwnerById = message.user && String(message.user) === String(user.id);
  if (isOwnerById) {
    return true;
  }

  // 3) Proprietaire via email (fallback).
  const userEmail = cleanText(user.email).toLowerCase();
  const isOwnerByEmail = message.email === userEmail;
  if (isOwnerByEmail) {
    return true;
  }

  return false;
};

// POST /api/messages
// Creer un nouveau message client.
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) Lire les champs.
    const name = cleanText(req.user.name);
    const email = cleanText(req.user.email).toLowerCase();
    const phone = cleanText(req.body.phone);
    const subject = cleanText(req.body.subject);
    const message = cleanText(req.body.message);

    // 2) Verifier le champ obligatoire.
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    // 3) Sauvegarder le message.
    const newMessage = await ContactMessage.create({
      user: req.user.id,
      name,
      email,
      phone,
      subject,
      message,
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({ message: "Could not send message" });
  }
});

// GET /api/messages/mine
// Retourner les messages du client connecte.
router.get("/mine", checkAuth, async (req, res) => {
  try {
    const userEmail = cleanText(req.user.email).toLowerCase();

    const messages = await ContactMessage.find({
      $or: [{ user: req.user.id }, { email: userEmail }],
    }).sort({ createdAt: -1 });

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Could not load your messages" });
  }
});

// GET /api/messages
// Retourner toutes les conversations (admin).
router.get("/", checkAuth, checkAdmin, async (_req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Could not load messages" });
  }
});

// PATCH /api/messages/:id/reply
// Envoyer une reponse admin.
router.patch("/:id/reply", checkAuth, checkAdmin, async (req, res) => {
  try {
    // 1) Lire la reponse admin.
    const adminReply = cleanText(req.body.reply);

    // 2) Verifier champ obligatoire.
    if (!adminReply) {
      return res.status(400).json({ message: "reply is required" });
    }

    // 3) Mettre a jour la conversation.
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      {
        adminReply,
        status: "replied",
        repliedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.json(message);
  } catch (error) {
    return res.status(500).json({ message: "Could not send reply" });
  }
});

// DELETE /api/messages/:id
// Supprimer une conversation (admin ou proprietaire).
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    // 1) Charger le message.
    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // 2) Verifier le droit de suppression.
    if (!canDeleteMessage(message, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 3) Supprimer.
    await ContactMessage.findByIdAndDelete(req.params.id);
    return res.json({ message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete message" });
  }
});

module.exports = router;
