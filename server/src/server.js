const app = require("./app");
const connectDatabase = require("./config/db");
const ensureAdminExists = require("./config/seedAdmin");

const PORT = Number(process.env.PORT) || 5000;

// Lancer le serveur seulement apres connexion DB + creation admin.
const startServer = async () => {
  try {
    // 1) Connexion MongoDB.
    await connectDatabase();

    // 2) Creer/garantir le compte admin configure dans .env.
    await ensureAdminExists();

    // 3) Demarrer l API.
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
