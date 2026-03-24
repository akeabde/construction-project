import type { Session } from "@/lib/types";

// Clé secrète sous laquelle on enregistre les infos dans le navigateur.
const NOM_DE_LA_CLE = "fikhi_construction_session";

// --- 1) CHARGER LA SESSION ---
// Sert à savoir si l'utilisateur est déjà connecté en ouvrant le site.
export const chargerSession = (): Session | null => {
  // On vérifie si on est bien dans un navigateur (Safety check).
  if (typeof window === "undefined") {
    return null;
  }

  // On lit ce qui est écrit dans la "mémoire locale" (LocalStorage).
  const texteBrut = window.localStorage.getItem(NOM_DE_LA_CLE);
  
  // Si c'est vide, personne n'est connecté.
  if (!texteBrut) {
    return null;
  }

  try {
    // On re-transforme le texte en objet JavaScript.
    const objetSession = JSON.parse(texteBrut);
    return objetSession as Session;
  } catch (erreur) {
    // Si le texte était corrompu, on vide tout.
    window.localStorage.removeItem(NOM_DE_LA_CLE);
    return null;
  }
};

// --- 2) ENREGISTRER LA SESSION ---
// À appeler juste après la connexion ou l'inscription.
export const enregistrerSession = (nouvelleSession: Session) => {
  if (typeof window === "undefined") return;

  // On transforme l'objet en texte JSON pour pouvoir le stocker.
  const texteAEnregistrer = JSON.stringify(nouvelleSession);
  window.localStorage.setItem(NOM_DE_LA_CLE, texteAEnregistrer);
};

// --- 3) SUPPRIMER LA SESSION (DECONNEXION) ---
export const supprimerSession = () => {
  if (typeof window === "undefined") return;

  // On efface tout de la mémoire du navigateur.
  window.localStorage.removeItem(NOM_DE_LA_CLE);
};
