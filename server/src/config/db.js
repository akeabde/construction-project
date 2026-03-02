const mongoose = require("mongoose");

// Ouvrir la connexion MongoDB.
const connectDatabase = async () => {
  // Lire l URL Mongo depuis .env.
  const uri = process.env.MONGO_URI;

  // Sans URL on stoppe avec erreur claire.
  if (!uri) throw new Error("MONGO_URI is missing");

  try {
    // Connexion avec timeout court (feedback rapide).
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected");
  } catch (error) {
    throw new Error("MongoDB connection failed: " + error.message);
  }
};

module.exports = connectDatabase;
