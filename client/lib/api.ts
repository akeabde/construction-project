// URL de base de l'API. Si on est sur ngrok/prod, on utilise /api (piloté par Nginx).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string; // Jeton JWT pour les routes protégées (ex: admin).
  body?: unknown; // Données à envoyer (pour POST/PUT).
};

// --- EXTRAIRE LES ERREURS ---
// Petite fonction pour lire le message d'erreur renvoyé par le serveur Node.js.
const getApiErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
};

// --- FONCTION PRINCIPALE APPEL API ---
// C'est ici que tous les appels vers le serveur sont centralisés.
export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  // DEBUG : Voir l'URL exacte dans la console du navigateur (F12).
  const finalUrl = `${API_URL}${path}`;
  console.log(`[Requete API] vers : ${finalUrl}`);

  // Utilisation de la fonction standard 'fetch' du navigateur.
  const response = await fetch(finalUrl, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      // Si on a un token, on l'ajoute dans le header Authorization (Standard JWT).
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    // On transforme l'objet JS en texte JSON pour le serveur.
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Tenter de lire la réponse (elle doit être en JSON).
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Si le serveur répond avec une erreur (ex: 401, 404, 500).
  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "La requête a échoué"));
  }

  // On retourne les données reçues.
  return payload as T;
};
