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
// MIDDLEWARE : VERIFIER LA CONNEXION (checkAuth)
// Role : Empêcher les visiteurs non connectés d'accéder à certaines pages.
// ============================================================
const checkAuth = (req, res, next) => {
  // 1) On regarde si l'utilisateur a envoyé son "Badge" (Token) dans la requête.
  const enteteAuthentification = req.headers.authorization;

  // Si l'en-tête n'existe pas, on arrête tout.
  if (!enteteAuthentification) {
    return res.status(401).json({ message: "Désolé, vous n'êtes pas connecté." });
  }

  // 2) On vérifie que le format est correct (doit commencer par 'Bearer ').
  if (!enteteAuthentification.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Le format du badge est incorrect." });
  }

  // 3) On récupère uniquement le code du jeton (on retire 'Bearer ').
  const jetonATester = enteteAuthentification.slice(7);

  // 4) On vérifie si le jeton est valide avec notre clé secrète.
  const cleSecrete = process.env.JWT_SECRET;

  try {
    const donneesDecodees = jwt.verify(jetonATester, cleSecrete);

    // Si c'est bon, on enregistre les infos de l'utilisateur dans 'req.user'.
    // Comme ça, les prochaines fonctions sauront qui est connecté.
    req.user = donneesDecodees;

    // On passe à la suite !
    next();
  } catch (erreur) {
    // Si le jeton est faux ou expiré, on refuse l'accès.
    return res.status(401).json({ message: "Votre session a expiré, merci de vous reconnecter." });
  }
};

// ============================================================
// ROUTE : INSCRIPTION (REGISTER)
// Action : Crée un nouveau profil utilisateur dans la base.
// ============================================================
router.post("/register", async (req, res) => {
  try {
    // 1) On récupère les informations envoyées par le visiteur.
    const nomSaisi = cleanText(req.body.name);
    const emailSaisi = cleanEmail(req.body.email);
    const motDePasseSaisi = String(req.body.password || "");

    // 2) On vérifie si tous les champs sont bien remplis.
    if (!nomSaisi || !emailSaisi || !motDePasseSaisi) {
      return res.status(400).json({ message: "Merci de remplir tous les champs (Nom, Email, Mot de passe)." });
    }

    // 3) On vérifie la longueur du mot de passe (minimum 6).
    if (motDePasseSaisi.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit faire 6 caractères au minimum." });
    }

    // 4) On vérifie si cet email est déjà pris par quelqu'un d'autre.
    const utilisateurDejaExistant = await User.findOne({ email: emailSaisi });
    if (utilisateurDejaExistant) {
      return res.status(409).json({ message: "Ce compte existe déjà avec cet email." });
    }

    // 5) On transforme le mot de passe en code secret (Hash) pour la sécurité.
    const motDePasseHash = await bcrypt.hash(motDePasseSaisi, 10);

    // 6) On crée l'utilisateur dans MongoDB.
    const nouvelUtilisateur = await User.create({
      name: nomSaisi,
      email: emailSaisi,
      passwordHash: motDePasseHash,
      role: "user", // Par défaut, tout le monde est un utilisateur simple.
    });

    // 7) On crée un jeton de connexion automatique.
    const jetonDeConnexion = createToken(nouvelUtilisateur);

    // 8) On renvoie le profil créé.
    return res.status(201).json({
      token: jetonDeConnexion,
      user: {
        id: nouvelUtilisateur._id,
        name: nouvelUtilisateur.name,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
      },
    });

  } catch (erreurFatale) {
    console.error("Erreur technique d'inscription:", erreurFatale);
    return res.status(500).json({ message: "Désolé, l'inscription a échoué techniquement." });
  }
});

// ============================================================
// ROUTE : CONNEXION (LOGIN)
// Action : Vérifie l'email et le mot de passe pour donner l'accès.
// ============================================================
router.post("/login", async (req, res) => {
  try {
    // 1) On récupère ce que l'utilisateur a tapé.
    const emailSaisi = cleanEmail(req.body.email);
    const motDePasseSaisi = String(req.body.password || "");

    // 2) On vérifie si les champs sont vides.
    if (!emailSaisi || !motDePasseSaisi) {
      return res.status(400).json({ message: "Veuillez remplir l'email et le mot de passe." });
    }

    // 3) On cherche dans la base de données si un utilisateur a cet email.
    const utilisateurTrouve = await User.findOne({ email: emailSaisi });

    if (!utilisateurTrouve) {
      // Si on ne trouve personne, on renvoie une erreur.
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // 4) On vérifie si le mot de passe est le bon.
    // On compare le texte saisi avec le 'hash' enregistré.
    const estLeBonMotDePasse = await bcrypt.compare(motDePasseSaisi, utilisateurTrouve.passwordHash);

    if (estLeBonMotDePasse === false) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // 5) Tout est bon ! On crée le jeton de connexion (Token).
    const jetonDeConnexion = createToken(utilisateurTrouve);

    // 6) On renvoie la réponse finale avec le token et les infos.
    return res.json({
      token: jetonDeConnexion,
      user: {
        id: utilisateurTrouve._id,
        name: utilisateurTrouve.name,
        email: utilisateurTrouve.email,
        role: utilisateurTrouve.role,
      },
    });
  } catch (erreurFatale) {
    console.error("Erreur technique de connexion:", erreurFatale);
    return res.status(500).json({ message: "Désolé, une erreur technique est survenue." });
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
