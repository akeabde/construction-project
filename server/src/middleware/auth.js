const jwt = require("jsonwebtoken");

// Middleware:
// 1) checkAuth  => verifier token JWT
// 2) checkAdmin => verifier role admin

const checkAuth = (req, res, next) => {
  // Lire header Authorization.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Format attendu: "Bearer <token>".
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extraire token.
  const token = authHeader.slice(7);

  // Lire secret JWT.
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "JWT_SECRET is missing on server" });
  }

  try {
    // Verifier signature du token.
    const payload = jwt.verify(token, secret);

    // Sauver payload dans req.user.
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const checkAdmin = (req, res, next) => {
  // Utilisateur non authentifie.
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Utilisateur connecte mais non admin.
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Role admin valide.
  next();
};

module.exports = { checkAuth, checkAdmin };
