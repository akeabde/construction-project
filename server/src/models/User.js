const mongoose = require("mongoose");

// ============================================================
// MODELE : USER (Utilisateur)
// Role : Gère les comptes, les emails et les rôles (Admin/User).
// ============================================================
const userSchema = new mongoose.Schema(
  {
    // Nom complet de l'utilisateur.
    name: { type: String, required: true, trim: true },
    // Email unique (sert d'identifiant pour la connexion).
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Mot de passe sécurisé (hashé avec bcrypt).
    passwordHash: { type: String, required: true },
    // Rôle : 'admin' a tous les droits, 'user' peut juste commander.
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true } // Ajoute 'createdAt' et 'updatedAt' automatiquement.
);

module.exports = mongoose.model("User", userSchema);
