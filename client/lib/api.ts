// L'URL de base du serveur API. 
// "/api" signifie qu'on utilise le proxy Nginx (Port 80).
const URL_DU_SERVEUR = process.env.NEXT_PUBLIC_API_URL || "/api";

// --- STRUCTURE DES OPTIONS ---
type OptionsDeLaRequete = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; // Le type d'action (Défaut: GET)
  token?: string; // Le badge de connexion (Standard JWT)
  body?: unknown; // Les données à envoyer (ex: Formulaire)
};

// --- FONCTION : LIRE L'ERREUR ---
// Sert à transformer une erreur complexe en texte simple compréhensible.
const extraireMessageErreur = (donneesRecues: any, texteParDefaut: string) => {
  if (donneesRecues && donneesRecues.message) {
    return String(donneesRecues.message);
  }
  return texteParDefaut; // Si on ne trouve pas de message précis.
};

// --- FONCTION PRINCIPALE : APPEL API ---
// C'est la "boîte aux lettres" du frontend pour parler au backend.
export const appelAPI = async <Resultat>(chemin: string, options: OptionsDeLaRequete = {}): Promise<Resultat> => {
  
  // 1) On prépare l'adresse complète (URL).
  const adresseComplete = `${URL_DU_SERVEUR}${chemin}`;
  console.log(`[Frontend] Vers le serveur : ${adresseComplete}`);

  // 2) On prépare la "Feuille de demande" (Request Headers).
  const configuration = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      // Si on a un jeton de connexion, on l'ajoute.
      ...(options.token ? { "Authorization": `Bearer ${options.token}` } : {})
    },
    // On transforme les données JS en texte JSON.
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  // 3) On envoie la demande au serveur avec 'fetch'.
  const reponseDuServeur = await fetch(adresseComplete, configuration);

  // 4) On essaie de lire les données reçues (JSON).
  let donnees: any = null;
  try {
    donnees = await reponseDuServeur.json();
  } catch (erreurLecture) {
    donnees = null;
  }

  // 5) Si le serveur renvoie une erreur (Bug ou Inscription ratée).
  if (reponseDuServeur.ok === false) {
    const messageFinal = extraireMessageErreur(donnees, "Désolé, la demande a échoué.");
    throw new Error(messageFinal);
  }

  // 6) On renvoie le résultat final.
  return donnees as Resultat;
};
