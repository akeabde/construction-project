"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSession, loadSession } from "@/lib/session";
import type { Session } from "@/lib/types";

// ============================================================
// COMPOSANT : SITE HEADER (Barre de navigation)
// Role : Affiche le menu, le logo et gère l'affichage de la session utilisateur.
// ============================================================
export default function SiteHeader() {
  const router = useRouter();

  // On utilise un 'state' pour stocker la session car elle peut changer.
  const [session, setSession] = useState<Session | null>(null);

  // Au chargement du composant, on lit la session depuis le navigateur (localStorage).
  useEffect(() => {
    setSession(loadSession());
  }, []);

  // --- FONCTION DE DECONNEXION ---
  const logout = () => {
    clearSession();     // Nettoie le localStorage.
    setSession(null);   // Met à jour l'interface.
    router.push("/");   // Redirige vers l'accueil.
  };

  return (
    <header className="shell pt-5">
      <nav className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
        
        {/* LOGO ET NOM DU PROJET */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ff7a18] shadow-[0_0_0_5px_rgba(255,122,24,0.2)]" />
          <span className="font-display text-xl font-bold tracking-tight">FIKHI CONSTRUCTION</span>
        </Link>

        {/* LIENS DE NAVIGATION PUBLICS */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="btn btn-ghost text-sm">Accueil</Link>
          <Link href="/about" className="btn btn-ghost text-sm">À propos</Link>
          <Link href="/products" className="btn btn-ghost text-sm">Produits</Link>
          <Link href="/contact" className="btn btn-ghost text-sm">Contact</Link>
        </div>

        {/* ZONE UTILISATEUR : Dépend si on est connecté ou non */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* CAS 1 : C'est l'ADMINISTRATEUR */}
          {session?.user.role === "admin" ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-[#d5c9b7] bg-[#f7f2ea] px-3 py-1.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f2b25] text-xs font-bold text-white">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="text-xs text-[#756853]">Admin</p>
                  <p className="text-sm font-semibold text-[#1f2937]">{session.user.name}</p>
                </div>
              </div>
              <Link href="/dashboard/admin" className="btn btn-ghost text-sm">Administration</Link>
              <button className="btn btn-primary text-sm" onClick={logout}>Déconnexion</button>
            </>
          
          /* CAS 2 : C'est un UTILISATEUR normal connecté */
          ) : session ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-[#d5c9b7] bg-[#f7f2ea] px-3 py-1.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#c46a00] text-xs font-bold text-white">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="text-xs text-[#756853]">Bonjour</p>
                  <p className="text-sm font-semibold text-[#1f2937]">{session.user.name}</p>
                </div>
              </div>
              <button className="btn btn-primary text-sm" onClick={logout}>Déconnexion</button>
            </>
          
          /* CAS 3 : Personne n'est connecté (Visiteur) */
          ) : (
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
