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

// Route inscription.
router.post("/register", async (req, res) => {
  try {
    // 1) Lire champs.
    const name = cleanText(req.body.name);
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    // 2) Verifier champs obligatoires.
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // 3) Verifier longueur mot de passe.
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // 4) Verifier email deja utilise.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // 5) Hasher mot de passe.
    const passwordHash = await bcrypt.hash(password, 10);

    // 6) Creer utilisateur.
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "user",
    });

    // 7) Creer token JWT.
    const token = createToken(user);

    // 8) Retourner session.
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
    return res.status(500).json({ message: "Could not register user" });
  }
});

// Route connexion.
router.post("/login", async (req, res) => {
  try {
    // 1) Lire champs.
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || "");

    // 2) Verifier champs obligatoires.
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    // 3) Chercher utilisateur.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4) Comparer mot de passe.
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5) Creer token.
    const token = createToken(user);

    // 6) Retourner session.
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
    return res.status(500).json({ message: "Could not login user" });
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
