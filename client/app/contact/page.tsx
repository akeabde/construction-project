"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { appelAPI } from "@/lib/api";
import { chargerSession } from "@/lib/session";
import type { ContactMessage, Session } from "@/lib/types";

// --- TYPES SIMPLIFIÉS ---

// Ce que contient le formulaire pour envoyer un message de projet.
type FormulaireProjet = {
  phone: string;
  subject: string;
  message: string;
};

// Valeurs vides au départ.
const FORMULAIRE_VIDE: FormulaireProjet = {
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  // --- VARIABLES D'ÉTAT (STATE) ---
  const [infosSession, setInfosSession] = useState<Session | null>(null);
  const [donneesFormulaire, setDonneesFormulaire] = useState<FormulaireProjet>(FORMULAIRE_VIDE);
  
  // Liste des demandes envoyées par l'utilisateur.
  const [mesDemandesEnvoyees, setMesDemandesEnvoyees] = useState<ContactMessage[]>([]);

  // États pour l'interface (UI).
  const [chargementEnCours, setChargementEnCours] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageRetour, setMessageRetour] = useState("");

  // --- 1) CHARGER LES MESSAGES DEPUIS LE SERVEUR ---
  const chargerMesMessages = async (jeton: string) => {
    setChargementEnCours(true);
    try {
      // On demande au serveur tous les messages liés à notre compte.
      const listeMessages = await appelAPI<ContactMessage[]>("/messages/mine", { 
        token: jeton 
      });
      setMesDemandesEnvoyees(listeMessages);
    } catch (erreur) {
      console.error("Erreur chargement messages:", erreur);
    } finally {
      setChargementEnCours(false);
    }
  };

  // --- 2) AU DÉMARRAGE DE LA PAGE ---
  useEffect(() => {
    const sessionActuelle = chargerSession();
    if (sessionActuelle && sessionActuelle.user.role === "user") {
      setInfosSession(sessionActuelle);
      // On charge l'historique tout de suite.
      chargerMesMessages(sessionActuelle.token);
    }
  }, []);

  // --- 3) ACTIONS DU FORMULAIRE ---

  // Quand on tape dans un champ (input ou textarea).
  const gererSaisieChamp = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDonneesFormulaire({ 
      ...donneesFormulaire, 
      [e.target.name]: e.target.value 
    });
  };

  // Quand on clique sur "Envoyer la demande".
  const envoyerLaDemande = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault(); // Bloque le rechargement de page.

    if (!infosSession) {
      setMessageRetour("Veuillez vous connecter pour envoyer une demande.");
      return;
    }

    setEnvoiEnCours(true);
    setMessageRetour("");

    try {
      // Appel API pour enregistrer le message.
      await appelAPI("/messages", {
        method: "POST",
        token: infosSession.token,
        body: donneesFormulaire,
      });

      // Si ça marche :
      setDonneesFormulaire(FORMULAIRE_VIDE); // Vider le formulaire.
      setMessageRetour("✅ Votre demande a été envoyée avec succès.");
      
      // Actualiser la liste en bas de page.
      chargerMesMessages(infosSession.token);

    } catch (erreur: any) {
      setMessageRetour(erreur.message || "L'envoi a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Supprimer une de ses propres demandes.
  const supprimerMaDemande = async (idMessage: string) => {
    if (!infosSession) return;
    if (!confirm("Voulez-vous vraiment supprimer cette demande ?")) return;

    try {
      await appelAPI(`/messages/${idMessage}`, {
        method: "DELETE",
        token: infosSession.token,
      });
      // On recharge la liste après suppression.
      chargerMesMessages(infosSession.token);
      setMessageRetour("🗑️ Demande supprimée.");
    } catch (erreur: any) {
      setMessageRetour("Erreur lors de la suppression.");
    }
  };

  return (
    <>
      <SiteHeader />
      
      <main className="shell py-10 space-y-10">
        
        {/* SECTION 1 : PRÉSENTATION */}
        <section className="panel bg-[#1e293b] text-white p-8 rounded-3xl">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-display text-5xl font-bold text-white">Contactez-nous</h1>
            <p className="text-lg text-slate-300">
              Vous avez un projet de construction ou de rénovation ? 
              Remplissez le formulaire et notre équipe vous répondra rapidement.
            </p>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* SECTION 2 : FORMULAIRE DE CONTACT */}
          <section className="panel bg-white p-8 rounded-2xl border border-slate-200 space-y-6">
            <h2 className="font-display text-3xl font-bold text-slate-900 border-b pb-4">
              Nouvelle Demande
            </h2>

            {!infosSession ? (
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 text-center space-y-4">
                <p className="font-bold text-orange-800">
                  Connectez-vous pour nous envoyer un message sécurisé.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/auth/login" className="btn btn-primary px-8">Connexion</Link>
                  <Link href="/auth/register" className="btn btn-ghost border-slate-300">S'Inscrire</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={envoyerLaDemande} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Votre Téléphone</label>
                    <input 
                      name="phone" 
                      placeholder="Ex: 06 12 34 56 78" 
                      value={donneesFormulaire.phone} 
                      onChange={gererSaisieChamp} 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Objet de la demande</label>
                    <input 
                      name="subject" 
                      placeholder="Ex: Construction Villa" 
                      value={donneesFormulaire.subject} 
                      onChange={gererSaisieChamp} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Détails de votre projet</label>
                  <textarea 
                    name="message" 
                    placeholder="Décrivez votre besoin (lieu, surface, budget...)" 
                    rows={6} 
                    value={donneesFormulaire.message} 
                    onChange={gererSaisieChamp} 
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-4 text-lg font-bold"
                  disabled={envoiEnCours}
                >
                  {envoiEnCours ? "Envoi en cours..." : "🚀 Envoyer mon Message"}
                </button>
              </form>
            )}

            {messageRetour && (
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-600">
                {messageRetour}
              </p>
            )}
          </section>

          {/* SECTION 3 : HISTORIQUE ET SUIVI */}
          <section className="space-y-6">
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Mes Demandes en Cours
            </h2>

            {!infosSession ? (
              <p className="text-slate-500 italic">Connectez-vous pour voir vos messages.</p>
            ) : chargementEnCours ? (
              <p className="text-slate-500">Chargement de vos demandes...</p>
            ) : mesDemandesEnvoyees.length === 0 ? (
              <p className="text-slate-500 bg-slate-100 p-8 rounded-2xl text-center italic">
                Vous n'avez pas encore envoyé de demande.
              </p>
            ) : (
              <div className="space-y-4">
                {mesDemandesEnvoyees.map((m) => (
                  <article key={m._id} className="panel bg-[#f8fafc] p-6 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{m.subject}</h3>
                        <p className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {m.status === 'replied' ? '✅ Répondu' : '⏳ Attente'}
                        </span>
                        <button 
                          onClick={() => supprimerMaDemande(m._id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 italic bg-white p-4 rounded-xl border border-slate-100 mb-4">
                      "{m.message}"
                    </p>

                    {m.adminReply && (
                      <div className="bg-white p-4 rounded-xl border-l-4 border-l-green-500 shadow-sm space-y-1">
                        <p className="text-xs font-bold text-green-600 uppercase">Réponse de FIKHI CONSTRUCTION :</p>
                        <p className="text-sm text-slate-800 font-medium">{m.adminReply}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

      </main>
    </>
  );
}
