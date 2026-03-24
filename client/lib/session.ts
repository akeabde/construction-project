import type { Session } from "@/lib/types";

const SESSION_KEY = "fikhi_construction_session";

// --- CHARGER LA SESSION ---
// Cette fonction récupère les données de l'utilisateur stockées dans le navigateur.
export const loadSession = (): Session | null => {
  // Protection pour Next.js (SSR) : On vérifie si on est bien côté navigateur.
  if (typeof window === "undefined") {
    return null;
  }

  // Lire la valeur brute enregistrée dans le 'localStorage'.
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    // On transforme le texte JSON en objet JavaScript manipulable.
    return JSON.parse(raw) as Session;
  } catch {
    // Si ce qu'on a lu n'est pas du bon JSON, on nettoie tout.
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

// --- SAUVEGARDER LA SESSION ---
export const saveSession = (session: Session) => {
  if (typeof window === "undefined") {
    return;
  }
  // On enregistre l'objet sous forme de texte JSON.
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// --- SUPPRIMER LA SESSION (LOGOUT) ---
export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
};
