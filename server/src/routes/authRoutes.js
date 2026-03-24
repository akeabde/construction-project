const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { checkAuth } = require("../middleware/auth");

const router = express.Router();

// Nettoyer email.
const cleanEmail = (value) => String(value || "").trim().toLowerCase();

// Nettoyer texte simple.
const cleanText = (value) => String(value || "").trim();

// Creer JWT a partir d un utilisateur.
const createToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET missing");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    secret,
    { expiresIn: "7d" }
  );
};

// ============================================================
// ROUTE : INSCRIPTION (REGISTER)
// Action : Crée un nouvel utilisateur.
// ============================================================
router.post("/register", async (req, res) => {
  try {
    // 1) Lire et nettoyer les champs du formulaire.
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    // 2) Vérifier que tout est rempli.
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Le nom, l'email et le mot de passe sont obligatoires." });
    }

    // 3) Le mot de passe doit être assez long (sécurité).
    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères." });
    }

    // 4) Vérifier si cet email appartient déjà à quelqu'un.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    // 5) Sécurité : On ne stocke JAMAIS le mot de passe en clair.
    // On utilise bcrypt pour le transformer en charabia (hash).
    const passwordHash = await bcrypt.hash(password, 10);

    // 6) Enregistrement dans MongoDB.
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "user",
    });

    // 7) On connecte l'utilisateur tout de suite en créant un jeton JWT.
    const token = createToken(user);

    // 8) Succès ! On renvoie la session (token + infos utilisateur).
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
});

// ============================================================
// ROUTE : CONNEXION (LOGIN)
// Action : Vérifie les identifiants et connecte l'utilisateur.
// ============================================================
router.post("/login", async (req, res) => {
  try {
    // 1) Lire les identifiants.
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    // 2) Chercher l'utilisateur par son email.
    const user = await User.findOne({ email });
    if (!user) {
      // Pour la sécurité, on reste vague sur l'erreur (Identifiants invalides).
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 3) Comparer le mot de passe saisi avec celui (hashé) de la base.
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 4) Créer un jeton JWT (la clé de l'utilisateur).
    const token = createToken(user);

    // 5) Renvoyer la session.
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur connexion:", error);
    return res.status(500).json({ message: "Erreur lors de la connexion." });
  }
});

// Route "me": recuperer utilisateur connecte.
router.get("/me", checkAuth, async (req, res) => {
  try {
    // id vient du payload JWT.
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch user" });
  }
});

module.exports = router;
