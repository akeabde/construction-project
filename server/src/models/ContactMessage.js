const mongoose = require("mongoose");

// ============================================================
// MODELE : CONTACT MESSAGE
// Role : Enregistre les messages envoyés via le formulaire de contact.
// ============================================================
const contactMessageSchema = new mongoose.Schema(
  {
    // Si l'utilisateur est connecté, on lie son compte.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    // État du message : 'new' (nouveau), 'replied' (répondu).
    status: { type: String, enum: ["new", "replied"], default: "new" },
    adminReply: { type: String, trim: true }, // Réponse de l'admin.
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
