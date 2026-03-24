"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// On importe nos nouvelles fonctions simplifiées.
import { chargerSession, supprimerSession } from "@/lib/session";
import type { Session } from "@/lib/types";

// ============================================================
// COMPOSANT : BARRE DE NAVIGATION (SiteHeader)
// Role : Affiche le logo, les liens et gère la connexion.
// ============================================================
export default function SiteHeader() {
  const router = useRouter();

  // On crée une "variable d'état" pour stocker les infos de l'utilisateur.
  const [infosSession, setInfosSession] = useState<Session | null>(null);

  // Ce bloc s'exécute une seule fois quand on ouvre la page.
  useEffect(() => {
    // On regarde si quelqu'un est déjà connecté.
    const sessionExistante = chargerSession();
    setInfosSession(sessionExistante);
  }, []);

  // --- ACTION : SE DÉCONNECTER ---
  const actionDeconnexion = () => {
    supprimerSession();      // On efface la mémoire du navigateur.
    setInfosSession(null);   // On met à jour l'affichage immédiatement.
    router.push("/");        // On renvoie l'utilisateur à l'accueil.
  };

  return (
    <header className="shell pt-5">
      <nav className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
        
        {/* 1) LOGO ET NOM DU SITE */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ff7a18] shadow-[0_0_0_5px_rgba(255,122,24,0.2)]" />
          <span className="font-display text-xl font-bold tracking-tight text-[#1a1a1a]">
            FIKHI CONSTRUCTION
          </span>
        </Link>

        {/* 2) MENU DE NAVIGATION (LIENS) */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="btn btn-ghost text-sm">Accueil</Link>
          <Link href="/products" className="btn btn-ghost text-sm">Nos Produits</Link>
          <Link href="/contact" className="btn btn-ghost text-sm">Contact</Link>
        </div>

        {/* 3) ESPACE UTILISATEUR (CONNEXION / PROFIL) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* SI L'UTILISATEUR EST CONNECTÉ */}
          {infosSession ? (
            <>
              <div className="flex items-center gap-3 rounded-full border border-[#d5c9b7] bg-[#f7f2ea] px-3 py-1.5">
                {/* Petite bulle avec l'initiale */}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f2b25] text-xs font-bold text-white">
                  {infosSession.user.name.charAt(0).toUpperCase()}
                </span>
                
                {/* Nom et Rôle */}
                <div className="leading-tight">
                  <p className="text-xs text-[#756853]">
                    {infosSession.user.role === "admin" ? "Administrateur" : "Client"}
                  </p>
                  <p className="text-sm font-semibold text-[#1f2937]">
                    {infosSession.user.name}
                  </p>
                </div>
              </div>

              {/* Si c'est l'admin, on montre le lien vers le tableau de bord */}
              {infosSession.user.role === "admin" && (
                <Link href="/dashboard/admin" className="btn btn-secondary text-sm">Tableau de Bord</Link>
              )}

              {/* Bouton pour quitter */}
              <button className="btn btn-primary text-sm" onClick={actionDeconnexion}>
                Quitter
              </button>
            </>
          ) : (
            /* SI PERSONNE N'EST CONNECTÉ */
            <>
              <Link href="/auth/login" className="btn btn-ghost text-sm">Connexion</Link>
              <Link href="/auth/register" className="btn btn-primary text-sm">Inscription</Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}
