"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";
import type { Session } from "@/lib/types";
import { getErrorMessage } from "@/lib/ui";

// Reponse attendue de l API login.
type AuthResponse = Session;

export default function LoginPage() {
  // Router pour redirection apres login.
  const router = useRouter();

  // Champs formulaire login.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Etats UI.
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si deja connecte, on redirige directement.
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

  // Envoi du formulaire login.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Appel API login.
      const session = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // Sauvegarder session dans localStorage.
      saveSession(session);

      // Rediriger selon role.
      if (session.user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Connexion echouee"));
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
            <p className="chip inline-flex">Bon retour</p>
            <h1 className="font-display text-3xl font-bold text-[#0f172a]">Connexion</h1>
            <p className="text-sm text-[#5d5448]">Connectez-vous pour commander des produits.</p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          </form>

          <div className="text-sm text-[#5d5448]">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="font-semibold text-[#c46a00]">
              Creer un compte
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
