const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ============================================================
// CONFIGURATION : SEED ADMIN (Admin par défaut)
// Role : S'assurer qu'un compte administrateur existe au démarrage.
// ============================================================
const ensureAdminExists = async () => {
  // 1) Lire les paramètres configurés.
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Admin").trim();
  const forceReset = String(process.env.ADMIN_FORCE_RESET || "").trim().toLowerCase() === "true";

  // Si rien n'est configuré, on ne fait rien.
  if (!email || !password) return;

  // 2) Préparer le mot de passe sécurisé.
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3) Vérifier si cet admin existe déjà.
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    let hasChanges = false;

    // On garantit que ses droits sont bien 'admin'.
    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      hasChanges = true;
    }

    // On peut forcer la mise à jour du mot de passe (utile pour Reset).
    if (forceReset) {
      existingUser.passwordHash = hashedPassword;
      hasChanges = true;
    }

    if (hasChanges) await existingUser.save();
  } else {
    // 4) Si l'admin n'existe pas encore, on le crée.
    await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: "admin",
    });
    console.log(`Admin créé par défaut : ${email}`);
  }
};

module.exports = ensureAdminExists;
