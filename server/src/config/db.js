const mongoose = require("mongoose");

// ============================================================
// CONFIGURATION : DATABASE (MongoDB)
// Role : Établir la connexion avec la base de données.
// ============================================================
const connectDatabase = async () => {
  // On récupère l'adresse de la base (MONGO_URI) configurée dans .env ou Docker.
  const uri = process.env.MONGO_URI;

  if (!uri) throw new Error("MONGO_URI manquante dans la configuration.");

  try {
    // On demande à Mongoose de se connecter.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connecté à MongoDB avec succès !");
  } catch (error) {
    console.error("Échec de connexion MongoDB :", error.message);
    throw error;
  }
};

module.exports = connectDatabase;
