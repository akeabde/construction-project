const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Garantir l existence d un compte admin.
const ensureAdminExists = async () => {
  // Lire les infos admin depuis .env.
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Admin").trim();
  const forceReset = String(process.env.ADMIN_FORCE_RESET || "").trim().toLowerCase() === "true";

  // Si email/password absents, on ne fait rien.
  if (!email || !password) {
    return;
  }

  // Hash du mot de passe admin configure.
  const hashedPassword = await bcrypt.hash(password, 10);

  // Chercher un utilisateur avec cet email.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Si utilisateur existe deja, on garantit role admin.
    let hasChanges = false;

    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      hasChanges = true;
    }

    if (name && existingUser.name !== name) {
      existingUser.name = name;
      hasChanges = true;
    }

    // Ne reinitialiser le mot de passe que si forceReset = true.
    if (forceReset) {
      existingUser.passwordHash = hashedPassword;
      hasChanges = true;
    }

    if (hasChanges) {
      await existingUser.save();
    }
  } else {
    // Sinon, on cree l admin.
    await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: "admin",
    });
  }
};

module.exports = ensureAdminExists;
