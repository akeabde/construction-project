"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";
import type { Session } from "@/lib/types";
import { getErrorMessage } from "@/lib/ui";

// Reponse attendue de l API register.
type AuthResponse = Session;

export default function RegisterPage() {
  // Router pour redirection apres inscription.
  const router = useRouter();

  // Champs formulaire inscription.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Etats UI.
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si deja connecte, on ne reste pas sur la page register.
  useEffect(() => {
    const savedSession = loadSession();
    if (!savedSession) {
      return;
    }

    if (savedSession.user.role === "admin") {
      router.replace("/dashboard/admin");
      return;
    }

    router.replace("/");
  }, [router]);

  // Envoi du formulaire inscription.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Appel API register.
      const session = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });

      // Sauvegarder la session.
      saveSession(session);

      // Redirection home apres inscription.
      router.push("/");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Inscription echouee"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <section className="panel w-full max-w-md space-y-5 p-7">
          <div className="space-y-1">
            <p className="chip inline-flex">Nouvel utilisateur</p>
            <h1 className="font-display text-3xl font-bold text-[#0f172a]">Inscription</h1>
            <p className="text-sm text-[#5d5448]">Creez votre compte pour passer des commandes.</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <input type="text" placeholder="Nom complet" value={name} onChange={(event) => setName(event.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input
              type="password"
              placeholder="Mot de passe (min 6 caracteres)"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creation..." : "Creer un compte"}
            </button>
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          </form>

          <div className="text-sm text-[#5d5448]">
            Vous avez deja un compte ?{" "}
            <Link href="/auth/login" className="font-semibold text-[#c46a00]">
              Connexion
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
