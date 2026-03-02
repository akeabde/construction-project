const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Garantir l existence d un compte admin.
const ensureAdminExists = async () => {
  // Lire les infos admin depuis .env.
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Admin").trim();

  // Si email/password absents, on ne fait rien.
  if (!email || !password) {
    return;
  }

  // Hash du mot de passe admin configure.
  const hashedPassword = await bcrypt.hash(password, 10);

  // Chercher un utilisateur avec cet email.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Si utilisateur existe deja, on synchronise ses infos admin.
    existingUser.name = name;
    existingUser.role = "admin";
    existingUser.passwordHash = hashedPassword;
    await existingUser.save();
  } else {
    // Sinon, on cree l admin.
    await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: "admin",
    });
  }

  // Important:
  // tout autre compte avec role "admin" devient "user"
  // pour eviter que l ancien admin reste actif.
  await User.updateMany({ role: "admin", email: { $ne: email } }, { role: "user" });
};

module.exports = ensureAdminExists;
