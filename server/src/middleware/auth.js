const jwt = require("jsonwebtoken");

// ============================================================
// MIDDLEWARE : AUTHENTIFICATION
// Role : Protéger les routes et vérifier l'identité de l'utilisateur.
// ============================================================

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
  
  if (!cleSecrete) {
    return res.status(500).json({ message: "Erreur serveur : la clé secrète est manquante." });
  }

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
// MIDDLEWARE : VERIFIER SI C'EST L'ADMIN (checkAdmin)
// Role : Réserver certaines actions aux administrateurs uniquement.
// ============================================================
const checkAdmin = (req, res, next) => {
  // 1) On vérifie d'abord si l'utilisateur est connecté.
  if (!req.user) {
    return res.status(401).json({ message: "Action interdite : vous n'êtes pas connecté." });
  }

  // 2) On vérifie si son rôle est bien 'admin'.
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Action interdite : réservé aux administrateurs." });
  }

  // 3) C'est un admin ! On le laisse passer.
  next();
};

module.exports = { checkAuth, checkAdmin };
