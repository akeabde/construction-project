"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { appelAPI } from "@/lib/api";
import { chargerSession, enregistrerSession } from "@/lib/session";
import type { Session } from "@/lib/types";

// ============================================================
// PAGE : INSCRIPTION (Register)
// Role : Permet à un nouveau client de créer son compte.
// ============================================================
export default function RegisterPage() {
  const router = useRouter();

  // --- VARIABLES D'ÉTAT (STATE) ---
  const [nomSaisi, setNomSaisi] = useState("");
  const [emailSaisi, setEmailSaisi] = useState("");
  const [motDePasseSaisi, setMotDePasseSaisi] = useState("");

  const [messageErreur, setMessageErreur] = useState("");
  const [enCoursDeChargement, setEnCoursDeChargement] = useState(false);

  // --- SÉCURITÉ : Redirection si déjà connecté ---
  useEffect(() => {
    const sessionActuelle = chargerSession();
    if (sessionActuelle) {
      router.replace("/"); // Si déjà connecté, on n'a rien à faire ici.
    }
  }, [router]);

  // --- ACTION : CRÉER LE COMPTE ---
  const gererInscription = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault(); // On bloque le rechargement de la page.
    
    setMessageErreur("");
    setEnCoursDeChargement(true);

    try {
      // 1) On envoie les infos au serveur Node.js.
      const sessionRecue = await appelAPI<Session>("/auth/register", {
        method: "POST",
        body: { 
          name: nomSaisi, 
          email: emailSaisi, 
          password: motDePasseSaisi 
        }
      });

      // 2) On enregistre les infos de connexion dans le navigateur.
      enregistrerSession(sessionRecue);

      // 3) Bravo ! On redirige l'utilisateur vers l'accueil.
      router.push("/");

    } catch (erreur: any) {
      // Si l'inscription échoue (Ex: Email déjà utilisé).
      setMessageErreur(erreur.message || "L'inscription a échoué.");
    } finally {
      setEnCoursDeChargement(false);
    }
  };

  return (
    <>
      <SiteHeader />

      <main className="shell flex min-h-[80vh] items-center justify-center py-10">
        <section className="panel w-full max-w-md space-y-6 p-8">
          
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Inscription</h1>
            <p className="text-[#6b7280]">Devenez client pour voir nos prix et commander.</p>
          </div>

          <form className="space-y-4" onSubmit={gererInscription}>
            {/* Nom complet */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#374151]">Votre Nom complet</label>
              <input 
                type="text" 
                placeholder="Ex: Mohammed Lahcen" 
                value={nomSaisi} 
                onChange={(e) => setNomSaisi(e.target.value)} 
                required 
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#374151]">Adresse Email</label>
              <input 
                type="email" 
                placeholder="Ex: mohammed@gmail.com" 
                value={emailSaisi} 
                onChange={(e) => setEmailSaisi(e.target.value)} 
                required 
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#374151]">Choisir un mot de passe (6 caractères min)</label>
              <input 
                type="password" 
                placeholder="Ex: secret123" 
                minLength={6}
                value={motDePasseSaisi} 
                onChange={(e) => setMotDePasseSaisi(e.target.value)} 
                required 
              />
            </div>

            {/* Bouton d'action */}
            <button 
              type="submit" 
              className="btn btn-primary w-full py-3" 
              disabled={enCoursDeChargement}
            >
              {enCoursDeChargement ? "Création en cours..." : "Créer mon compte"}
            </button>

            {/* Message d'erreur */}
            {messageErreur && (
              <p className="text-center text-sm font-medium text-[#ef4444] bg-[#fee2e2] p-2 rounded-md">
                {messageErreur}
              </p>
            )}
          </form>

          <div className="pt-4 border-t border-[#e5e7eb] text-center text-sm text-[#4b5563]">
            Vous avez déjà un compte ?{" "}
            <Link href="/auth/login" className="font-bold text-[#ff7a18] hover:underline">
              Se connecter ici
            </Link>
          </div>

        </section>
      </main>
    </>
  );
}
