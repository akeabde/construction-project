const jwt = require("jsonwebtoken");

// ============================================================
// MIDDLEWARE : AUTHENTIFICATION
// Role : Protéger les routes et vérifier l'identité de l'utilisateur.
// ============================================================

// 1) checkAuth : Vérifier si l'utilisateur est bien connecté.
const checkAuth = (req, res, next) => {
  // On récupère le badge (token) envoyé dans l'en-tête de la requête.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Non autorisé (Token manquant)" });
  }

  // Le format standard c'est : "Bearer LE_JETON_ICI".
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Format de token invalide" });
  }

  // On extrait le token (on coupe "Bearer ").
  const token = authHeader.slice(7);

  // La clé secrète doit être configurée sur le serveur.
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Erreur serveur : JWT_SECRET manquant" });
  }

  try {
    // On vérifie si le token est vrai et n'a pas expiré.
    const payload = jwt.verify(token, secret);

    // On stocke les infos de l'utilisateur dans la requête pour la suite.
    req.user = payload;
    
    // On passe à l'étape suivante (la route).
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// 2) checkAdmin : Vérifier si l'utilisateur a les droits d'administrateur.
const checkAdmin = (req, res, next) => {
  // Si checkAuth n'a pas été appelé avant, on bloque.
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  // On vérifie le rôle stocké dans le token.
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé (Admin uniquement)" });
  }

  // C'est bon, c'est l'admin !
  next();
};

module.exports = { checkAuth, checkAdmin };
