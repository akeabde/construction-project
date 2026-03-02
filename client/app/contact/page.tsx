"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { loadSession } from "@/lib/session";
import type { ContactMessage, Session } from "@/lib/types";
import { getErrorMessage } from "@/lib/ui";

// Formulaire de demande projet.
type ContactForm = {
  phone: string;
  subject: string;
  message: string;
};

// Valeur initiale formulaire.
const EMPTY_FORM: ContactForm = {
  phone: "",
  subject: "",
  message: "",
};

// Labels lisibles des statuts conversation.
const MESSAGE_STATUS_LABELS: Record<string, string> = {
  new: "En attente",
  replied: "Admin a repondu",
  // Compatibilite ancienne valeur.
  read: "En attente",
};

// Styles badges selon statut conversation.
const MESSAGE_STATUS_STYLES: Record<string, string> = {
  new: "border-[#e8c387] bg-[#fff5e6] text-[#a15b00]",
  replied: "border-[#8bcf9d] bg-[#ebfff0] text-[#176534]",
  read: "border-[#e8c387] bg-[#fff5e6] text-[#a15b00]",
};

// Helpers simples.
const getMessageStatusLabel = (status: string) => MESSAGE_STATUS_LABELS[status] || status;
const getMessageStatusStyle = (status: string) =>
  MESSAGE_STATUS_STYLES[status] || "border-[#c9bfb0] bg-[#f7f2ea] text-[#695948]";

export default function ContactPage() {
  // Session utilisateur connecte.
  const [session, setSession] = useState<Session | null>(null);

  // Etat formulaire.
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);

  // Liste des demandes envoyees par cet utilisateur.
  const [myMessages, setMyMessages] = useState<ContactMessage[]>([]);

  // Etats UI.
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Charger l historique des demandes du client.
  const loadMyMessages = async (token: string) => {
    setIsLoadingMessages(true);

    try {
      const messageList = await apiRequest<ContactMessage[]>("/messages/mine", { token });
      setMyMessages(messageList);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Chargement des demandes echoue"));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Au demarrage: si user connecte, on charge son historique.
  useEffect(() => {
    const savedSession = loadSession();

    if (savedSession?.user.role === "user") {
      setSession(savedSession);
      void loadMyMessages(savedSession.token);
    }
  }, []);

  // Mettre a jour formulaire demande.
  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Envoyer une nouvelle demande projet.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      setFeedback("Pour envoyer un message, connectez-vous.");
      return;
    }

    setIsSending(true);
    setFeedback("");

    try {
      await apiRequest("/messages", {
        method: "POST",
        token: session.token,
        body: form,
      });

      // Reinitialiser le formulaire.
      setForm(EMPTY_FORM);
      setFeedback("Message envoye avec succes.");

      // Recharger historique client.
      await loadMyMessages(session.token);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Envoi echoue"));
    } finally {
      setIsSending(false);
    }
  };

  // Supprimer une conversation du client.
  const deleteMyMessage = async (messageId: string) => {
    if (!session) {
      return;
    }

    if (!window.confirm("Supprimer cette conversation ?")) {
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/messages/${messageId}`, {
        method: "DELETE",
        token: session.token,
      });

      await loadMyMessages(session.token);
      setFeedback("Demande supprimee.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Suppression echouee"));
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="shell space-y-4 py-6">
        {/* Hero simple */}
        <section className="panel hero-card p-6 md:p-8">
          <p className="chip inline-flex border-white/30 bg-white/10 text-white">Demande de projet</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-white">Construction & Realisation</h1>
          <p className="mt-3 text-sm text-white/85">
            Vous voulez construire une maison, une villa ou un autre projet ? Envoyez votre demande ici.
          </p>
        </section>

        {/* Formulaire + guide simple */}
        <section className="panel p-6 md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[#d9cfbf] bg-white p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#7f725e]">Formulaire projet</p>

              {!session ? (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-[#5d5448]">Vous devez avoir un compte pour envoyer une demande de projet.</p>
                  <div className="flex gap-2">
                    <Link href="/auth/login" className="btn btn-ghost text-sm">
                      Connexion
                    </Link>
                    <Link href="/auth/register" className="btn btn-primary text-sm">
                      Inscription
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
                  <div className="rounded-xl border border-[#e4dacb] bg-[#f9f4ea] p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7f725e]">Client connecte</p>
                    <p className="font-semibold text-[#1f2937]">{session.user.name}</p>
                    <p className="text-sm text-[#5d5448]">{session.user.email}</p>
                  </div>

                  <input name="phone" placeholder="Telephone" value={form.phone} onChange={handleInputChange} />
                  <input
                    name="subject"
                    placeholder="Type de projet (Maison, Villa, Immeuble...)"
                    value={form.subject}
                    onChange={handleInputChange}
                    required
                  />
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Decrivez votre projet: ville, superficie, style, budget approximatif, delai..."
                    value={form.message}
                    onChange={handleInputChange}
                    required
                  />

                  <button className="btn btn-primary w-full" type="submit" disabled={isSending}>
                    {isSending ? "Envoi..." : "Envoyer la demande"}
                  </button>
                </form>
              )}
            </div>

            <aside className="rounded-2xl border border-[#d9cfbf] bg-[#fbf7ef] p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#7f725e]">Comment ca marche</p>
              <div className="mt-3 space-y-3 text-sm text-[#4f463a]">
                <div className="rounded-xl border border-[#e4dacb] bg-white p-3">
                  <p className="font-semibold text-[#1f2937]">1. Envoyer votre besoin</p>
                  <p className="mt-1">Precisez le type de projet, la zone, et les details techniques.</p>
                </div>
                <div className="rounded-xl border border-[#e4dacb] bg-white p-3">
                  <p className="font-semibold text-[#1f2937]">2. Analyse par l equipe</p>
                  <p className="mt-1">Notre equipe etudie votre demande et prepare une reponse adaptee.</p>
                </div>
                <div className="rounded-xl border border-[#e4dacb] bg-white p-3">
                  <p className="font-semibold text-[#1f2937]">3. Reponse admin</p>
                  <p className="mt-1">Vous recevez le retour directement dans la section de suivi ci-dessous.</p>
                </div>
              </div>
            </aside>
          </div>

          {/* Feedback principal */}
          {feedback ? <p className="mt-4 rounded-xl bg-[#fff4e5] p-3 text-sm text-[#c46a00]">{feedback}</p> : null}
        </section>

        {/* Historique demandes du client */}
        {session ? (
          <section className="panel space-y-4 p-6 md:p-8">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold">Suivi de mes demandes</h2>
              <span className="chip">{myMessages.length} demandes</span>
            </div>

            {isLoadingMessages ? (
              <p className="text-sm text-[#5d5448]">Chargement...</p>
            ) : myMessages.length === 0 ? (
              <p className="text-sm text-[#5d5448]">Aucune demande envoyee pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {myMessages.map((message) => (
                  <article key={message._id} className="rounded-xl border border-[#d7cebf] bg-white p-4 shadow-[0_8px_18px_rgba(62,47,30,0.07)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1f2937]">{message.subject || "Demande de projet"}</p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getMessageStatusStyle(message.status)}`}>
                          {getMessageStatusLabel(message.status)}
                        </span>
                        <button className="btn btn-ghost text-sm" type="button" onClick={() => deleteMyMessage(message._id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-[#4c4338]">{message.message}</p>

                    {message.adminReply ? (
                      <div className="mt-3 rounded-xl border border-[#d9cdb9] bg-[#f9f4ea] p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#7c6e5a]">Reponse admin</p>
                        <p className="mt-1 text-sm text-[#3f372c]">{message.adminReply}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}
