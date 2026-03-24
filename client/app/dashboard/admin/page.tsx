"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { appelAPI } from "@/lib/api";
import { supprimerSession, chargerSession } from "@/lib/session";
import type { ContactMessage, Order, Product, Session } from "@/lib/types";
import { formatPriceMad } from "@/lib/ui";

// ============================================================
// PAGE : TABLEAU DE BORD ADMINISTRATION
// Role : Permet à l'admin de gérer les produits, les commandes et les messages.
// ============================================================
export default function AdminDashboardPage() {
  const router = useRouter();

  // --- 1) VARIABLES D'ÉTAT (STATE) ---
  const [infosSession, setInfosSession] = useState<Session | null>(null);
  const [ongletActif, setOngletActif] = useState<"produits" | "commandes" | "messages">("produits");

  // Listes de données récupérées du serveur
  const [listeProduits, setListeProduits] = useState<Product[]>([]);
  const [listeCommandes, setListeCommandes] = useState<Order[]>([]);
  const [listeMessages, setListeMessages] = useState<ContactMessage[]>([]);

  // États pour le chargement et les messages d'erreur
  const [chargementEnCours, setChargementEnCours] = useState(true);
  const [messageRetour, setMessageRetour] = useState("");

  // État pour le formulaire produit (Ajout ou Modification)
  const [idProduitEnEdition, setIdProduitEnEdition] = useState<string | null>(null);
  const [formProduit, setFormProduit] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    stock: "0",
  });

  // Brouillon pour répondre aux messages
  const [brouillonReponse, setBrouillonReponse] = useState<{ [id: string]: string }>({});

  // --- 2) VÉRIFICATION DE L'ACCÈS ---
  useEffect(() => {
    const session = chargerSession();
    // Si pas connecté ou pas Admin -> on dégage vers la connexion.
    if (!session || session.user.role !== "admin") {
      router.push("/auth/login");
      return;
    }
    setInfosSession(session);
    chargerToutesLesDonnees(session.token);
  }, []);

  // --- 3) RÉCUPÉRATION DES DONNÉES ---
  const chargerToutesLesDonnees = async (token: string) => {
    setChargementEnCours(true);
    try {
      // On lance les 3 appels API en même temps.
      const [produits, commandes, messages] = await Promise.all([
        appelAPI<Product[]>("/products"),
        appelAPI<Order[]>("/orders", { token }),
        appelAPI<ContactMessage[]>("/messages", { token }),
      ]);

      setListeProduits(produits);
      setListeCommandes(commandes);
      setListeMessages(messages);
    } catch (erreur) {
      setMessageRetour("Erreur lors du chargement des données.");
    } finally {
      setChargementEnCours(false);
    }
  };

  // --- 4) GESTION DES PRODUITS ---

  const gererChangementForm = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormProduit({ ...formProduit, [e.target.name]: e.target.value });
  };

  const enregistrerProduit = async (e: FormEvent) => {
    e.preventDefault();
    if (!infosSession) return;

    try {
      const payload = {
        ...formProduit,
        price: Number(formProduit.price),
        stock: Number(formProduit.stock),
      };

      if (idProduitEnEdition) {
        // Mise à jour
        await appelAPI(`/products/${idProduitEnEdition}`, {
          method: "PUT",
          token: infosSession.token,
          body: payload,
        });
        setMessageRetour("Produit mis à jour ✅");
      } else {
        // Création
        await appelAPI("/products", {
          method: "POST",
          token: infosSession.token,
          body: payload,
        });
        setMessageRetour("Produit ajouté ✅");
      }

      // Reset et rechargement
      setFormProduit({ title: "", description: "", price: "", imageUrl: "", category: "", stock: "0" });
      setIdProduitEnEdition(null);
      chargerToutesLesDonnees(infosSession.token);
    } catch (erreur) {
      setMessageRetour("Erreur lors de l'enregistrement du produit.");
    }
  };

  const supprimerProduit = async (id: string) => {
    if (!infosSession || !confirm("Supprimer ce produit ?")) return;
    try {
      await appelAPI(`/products/${id}`, { 
        method: "DELETE", 
        token: infosSession.token 
      });
      chargerToutesLesDonnees(infosSession.token);
    } catch (erreur) {
      setMessageRetour("Erreur suppression.");
    }
  };

  const preparerModification = (p: Product) => {
    setIdProduitEnEdition(p._id);
    setFormProduit({
      title: p.title,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl,
      category: p.category,
      stock: String(p.stock),
    });
  };

  // --- 5) GESTION DES COMMANDES ---

  const changerStatutCommande = async (id: string, nouveauStatut: string) => {
    if (!infosSession) return;
    try {
      await appelAPI(`/orders/${id}/status`, {
        method: "PATCH",
        token: infosSession.token,
        body: { status: nouveauStatut },
      });
      chargerToutesLesDonnees(infosSession.token);
    } catch (erreur) {
      setMessageRetour("Erreur changement statut.");
    }
  };

  // --- 6) GESTION DES MESSAGES ---

  const envoyerReponseAdmin = async (id: string) => {
    if (!infosSession) return;
    const texte = brouillonReponse[id];
    if (!texte) return;

    try {
      await appelAPI(`/messages/${id}/reply`, {
        method: "PATCH",
        token: infosSession.token,
        body: { reply: texte },
      });
      setBrouillonReponse({ ...brouillonReponse, [id]: "" });
      chargerToutesLesDonnees(infosSession.token);
      setMessageRetour("Réponse envoyée ✅");
    } catch (erreur) {
      setMessageRetour("Erreur envoi réponse.");
    }
  };

  // --- RENDU (UI) ---

  if (!infosSession) return null;

  return (
    <div className="bg-[#f1f5f9] min-h-screen">
      {/* Barre du haut */}
      <header className="bg-[#1e293b] text-white p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Administration FIKHI</h1>
          <p className="text-slate-400 text-sm">Session de : {infosSession.user.name}</p>
        </div>
        <button 
          onClick={() => { supprimerSession(); router.push("/"); }}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm"
        >
          Déconnexion
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Menu de navigation Admin */}
        <nav className="flex gap-4 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setOngletActif("produits")}
            className={`flex-1 py-3 rounded-lg font-bold transition ${ongletActif === 'produits' ? 'bg-[#ff7a18] text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            📦 Produits
          </button>
          <button 
            onClick={() => setOngletActif("commandes")}
            className={`flex-1 py-3 rounded-lg font-bold transition ${ongletActif === 'commandes' ? 'bg-[#ff7a18] text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            🛒 Commandes
          </button>
          <button 
            onClick={() => setOngletActif("messages")}
            className={`flex-1 py-3 rounded-lg font-bold transition ${ongletActif === 'messages' ? 'bg-[#ff7a18] text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            💬 Demandes Client
          </button>
        </nav>

        {messageRetour && (
          <div className="bg-white p-4 text-center rounded-xl border-l-4 border-orange-500 shadow-sm font-bold text-slate-700">
            {messageRetour}
          </div>
        )}

        {chargementEnCours ? (
          <div className="p-20 text-center text-slate-500 text-xl font-medium italic">Chargement des données en cours...</div>
        ) : (
          <div className="space-y-6">
            
            {/* ONGLET : PRODUITS */}
            {ongletActif === "produits" && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Formulaire */}
                <form onSubmit={enregistrerProduit} className="panel bg-white p-6 rounded-2xl shadow-sm border border-slate-200 self-start space-y-4">
                  <h2 className="text-xl font-bold border-b pb-2">{idProduitEnEdition ? "✏️ Modifier" : "➕ Nouveau Produit"}</h2>
                  <input name="title" placeholder="Titre du produit" value={formProduit.title} onChange={gererChangementForm} required />
                  <textarea name="description" placeholder="Description courte" rows={3} value={formProduit.description} onChange={gererChangementForm} required className="w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="price" type="number" placeholder="Prix (DH)" value={formProduit.price} onChange={gererChangementForm} required />
                    <input name="stock" type="number" placeholder="Stock" value={formProduit.stock} onChange={gererChangementForm} required />
                  </div>
                  <input name="imageUrl" placeholder="Lien image (URL)" value={formProduit.imageUrl} onChange={gererChangementForm} required />
                  <input name="category" placeholder="Catégorie" value={formProduit.category} onChange={gererChangementForm} required />
                  <button type="submit" className="btn btn-primary w-full py-3 font-bold">
                    {idProduitEnEdition ? "Mettre à jour" : "Ajouter au Catalogue"}
                  </button>
                  {idProduitEnEdition && (
                    <button type="button" onClick={() => { setIdProduitEnEdition(null); setFormProduit({ title: "", description: "", price: "", imageUrl: "", category: "", stock: "0" }); }} className="btn btn-ghost w-full">Annuler</button>
                  )}
                </form>

                {/* Liste */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">Liste des Articles <span className="bg-slate-200 text-slate-700 text-sm px-2 py-1 rounded-lg">{listeProduits.length}</span></h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {listeProduits.map((p) => (
                      <div key={p._id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center">
                        <img src={p.imageUrl} alt={p.title} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{p.title}</p>
                          <p className="text-sm text-slate-500">{formatPriceMad(p.price)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => preparerModification(p)} className="text-blue-600 hover:bg-blue-50 p-1 rounded font-bold text-xs uppercase">Éditer</button>
                          <button onClick={() => supprimerProduit(p._id)} className="text-red-500 hover:bg-red-50 p-1 rounded font-bold text-xs uppercase">Suppr.</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ONGLET : COMMANDES */}
            {ongletActif === "commandes" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Ventes et Commandes <span className="bg-slate-200 px-2 py-1 rounded-lg text-sm">{listeCommandes.length}</span></h2>
                <div className="grid gap-4">
                  {listeCommandes.map((c) => (
                    <div key={c._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap lg:flex-nowrap justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2 items-center">
                          <p className="font-bold text-slate-900 text-lg">{c.fullName}</p>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${c.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">📞 {c.phone} | 📍 {c.city}</p>
                        <div className="flex gap-2 flex-wrap">
                          {c.items.map((it, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-medium">
                              {it.title} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right space-y-4 self-center min-w-[200px]">
                        <p className="text-2xl font-bold text-[#ff7a18]">{formatPriceMad(c.totalAmount)}</p>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => changerStatutCommande(c._id, 'accepted')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600">ACCEPTER</button>
                          <button onClick={() => changerStatutCommande(c._id, 'refused')} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600">REFUSER</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ONGLET : MESSAGES */}
            {ongletActif === "messages" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Demandes de Conseils / Projets <span className="bg-slate-200 px-2 py-1 rounded-lg text-sm">{listeMessages.length}</span></h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {listeMessages.map((m) => (
                    <div key={m._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">{m.subject}</p>
                          <p className="text-xs text-slate-500 italic">De: {m.email} (📞{m.phone})</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${m.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {m.status === 'replied' ? '✅ Répondu' : '⏳ Nouveau'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">"{m.message}"</p>
                      
                      {m.adminReply && (
                        <div className="bg-green-50 p-3 rounded-xl border-l-4 border-green-500">
                          <p className="text-xs font-bold text-green-700">Votre Réponse :</p>
                          <p className="text-sm text-slate-800 italic">{m.adminReply}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <textarea 
                          placeholder="Écrire votre réponse ici..." 
                          className="w-full text-sm p-3" 
                          rows={2} 
                          value={brouillonReponse[m._id] || ""} 
                          onChange={(e) => setBrouillonReponse({...brouillonReponse, [m._id]: e.target.value})}
                        />
                        <button 
                          onClick={() => envoyerReponseAdmin(m._id)}
                          className="btn btn-primary w-full py-2 text-xs font-bold"
                        >
                          Envoyer la Réponse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
