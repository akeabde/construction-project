"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { appelAPI } from "@/lib/api";
import { chargerSession, enregistrerSession } from "@/lib/session";
import type { Session } from "@/lib/types";

// ============================================================
// PAGE : CONNEXION (Login)
// Role : Permet à l'utilisateur de se connecter à son compte.
// ============================================================
export default function LoginPage() {
  const router = useRouter();

  // --- VARIABLES D'ÉTAT (STATE) ---
  const [emailSaisi, setEmailSaisi] = useState("");
  const [motDePasseSaisi, setMotDePasseSaisi] = useState("");
  
  const [messageErreur, setMessageErreur] = useState("");
  const [enCoursDeChargement, setEnCoursDeChargement] = useState(false);

  // --- SÉCURITÉ : Redirection si déjà connecté ---
  useEffect(() => {
    const sessionActuelle = chargerSession();
    if (sessionActuelle) {
      // Si on est déjà connecté, on n'a rien à faire ici.
      if (sessionActuelle.user.role === "admin") {
        router.replace("/dashboard/admin"); // Go vers Administration.
      } else {
        router.replace("/"); // Go vers l'Accueil.
      }
    }
  }, [router]);

  // --- ACTION : ENVOYER LE FORMULAIRE ---
  const gererConnexion = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault(); // Empêche la page de se recharger.
    
    setMessageErreur("");
    setEnCoursDeChargement(true);

    try {
      // 1) On appelle notre backend pour vérifier les identifiants.
      const sessionRecue = await appelAPI<Session>("/auth/login", {
        method: "POST",
        body: { 
          email: emailSaisi, 
          password: motDePasseSaisi 
        }
      });

      // 2) On enregistre les infos dans le navigateur (LocalStorage).
      enregistrerSession(sessionRecue);

      // 3) On redirige selon le rôle.
      if (sessionRecue.user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/");
      }

    } catch (erreur: any) {
      // Si le serveur dit non (Mauvais mot de passe, etc.).
      setMessageErreur(erreur.message || "Impossible de se connecter.");
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
            <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Connexion</h1>
            <p className="text-[#6b7280]">Accédez à votre espace pour commander.</p>
          </div>

          <form className="space-y-4" onSubmit={gererConnexion}>
            {/* Champ Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#374151]">Adresse Email</label>
              <input 
                type="email" 
                placeholder="Ex: ali@gmail.com" 
                value={emailSaisi} 
                onChange={(e) => setEmailSaisi(e.target.value)} 
                required 
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#374151]">Mot de passe</label>
              <input 
                type="password" 
                placeholder="Votre mot de passe secret" 
                value={motDePasseSaisi} 
                onChange={(e) => setMotDePasseSaisi(e.target.value)} 
                required 
              />
            </div>

            {/* Bouton de validation */}
            <button 
              type="submit" 
              className="btn btn-primary w-full py-3" 
              disabled={enCoursDeChargement}
            >
              {enCoursDeChargement ? "Vérification..." : "Se connecter"}
            </button>

            {/* Affichage de l'erreur si elle existe */}
            {messageErreur && (
              <p className="text-center text-sm font-medium text-[#ef4444] bg-[#fee2e2] p-2 rounded-md">
                {messageErreur}
              </p>
            )}
          </form>

          <div className="pt-4 border-t border-[#e5e7eb] text-center text-sm text-[#4b5563]">
            Vous n'avez pas de compte ?{" "}
            <Link href="/auth/register" className="font-bold text-[#ff7a18] hover:underline">
              S'inscrire gratuitement
            </Link>
          </div>

        </section>
      </main>
    </>
  );
}
