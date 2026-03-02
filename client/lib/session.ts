import type { Session } from "@/lib/types";

const SESSION_KEY = "fikhi_construction_session";

// Charger la session depuis localStorage.
export const loadSession = (): Session | null => {
  // Protection pour rendu serveur (pas de window).
  if (typeof window === "undefined") {
    return null;
  }

  // Lire la valeur brute.
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    // Convertir texte JSON vers objet Session.
    return JSON.parse(raw) as Session;
  } catch {
    // Si JSON invalide, nettoyer la cle.
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

// Sauvegarder la session dans localStorage.
export const saveSession = (session: Session) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// Supprimer la session (logout).
export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
};
