"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearSession, loadSession } from "@/lib/session";
import type { Session } from "@/lib/types";

export default function SiteHeader() {
  // Router pour rediriger apres logout.
  const router = useRouter();

  // Session stockee localement.
  const [session, setSession] = useState<Session | null>(loadSession);

  // Deconnexion simple.
  const logout = () => {
    clearSession();
    setSession(null);
    router.push("/");
  };

  return (
    <header className="shell pt-5">
      <nav className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
        {/* Logo + nom marque */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ff7a18] shadow-[0_0_0_5px_rgba(255,122,24,0.2)]" />
          <span className="font-display text-xl font-bold tracking-tight">FIKHI CONSTRUCTION</span>
        </Link>

        {/* Liens publics */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="btn btn-ghost text-sm">
            Accueil
          </Link>
          <Link href="/about" className="btn btn-ghost text-sm">
            A propos
          </Link>
          <Link href="/products" className="btn btn-ghost text-sm">
            Produits
          </Link>
          <Link href="/contact" className="btn btn-ghost text-sm">
            Contact
          </Link>
        </div>

        {/* Zone session (admin / user / visiteur) */}
        <div className="flex flex-wrap items-center gap-2">
          {session?.user.role === "admin" ? (
            <>
              {/* Badge admin connecte */}
              <div className="flex items-center gap-2 rounded-full border border-[#d5c9b7] bg-[#f7f2ea] px-3 py-1.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f2b25] text-xs font-bold text-white">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="text-xs text-[#756853]">Admin</p>
                  <p className="text-sm font-semibold text-[#1f2937]">{session.user.name}</p>
                </div>
              </div>

              <Link href="/dashboard/admin" className="btn btn-ghost text-sm">
                Administration
              </Link>
              <button className="btn btn-primary text-sm" onClick={logout}>
                Deconnexion
              </button>
            </>
          ) : session ? (
            <>
              {/* Badge utilisateur connecte */}
              <div className="flex items-center gap-2 rounded-full border border-[#d5c9b7] bg-[#f7f2ea] px-3 py-1.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#c46a00] text-xs font-bold text-white">
                  {session.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="text-xs text-[#756853]">Bonjour</p>
                  <p className="text-sm font-semibold text-[#1f2937]">{session.user.name}</p>
                </div>
              </div>
              <button className="btn btn-primary text-sm" onClick={logout}>
                Deconnexion
              </button>
            </>
          ) : (
            <>
              {/* Actions visiteur */}
              <Link href="/auth/login" className="btn btn-ghost text-sm">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn btn-primary text-sm">
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
