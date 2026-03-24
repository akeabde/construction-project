"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { appelAPI } from "@/lib/api";
import { chargerSession } from "@/lib/session";
import type { Order, Product, Session } from "@/lib/types";
import { formatPriceMad } from "@/lib/ui";

// --- TYPES SIMPLIFIÉS ---

// Le panier est un objet qui associe un "ID de produit" à une "Quantité".
// Exemple : { "id123": 2, "id456": 1 }
type PanierType = { [idProduit: string]: number };

// Les infos nécessaires pour livrer une commande.
type FormulaireCommande = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
};

// Valeurs vides par défaut pour le formulaire.
const FORMULAIRE_VIDE: FormulaireCommande = {
  fullName: "",
  phone: "",
  city: "",
  address: "",
  notes: "",
};

export default function ProductsPage() {
  // --- VARIABLES D'ÉTAT (STATE) ---
  const [infosSession, setInfosSession] = useState<Session | null>(null);
  const [listeProduits, setListeProduits] = useState<Product[]>([]);
  const [mesCommandes, setMesCommandes] = useState<Order[]>([]);
  const [panier, setPanier] = useState<PanierType>({});
  const [donneesFormulaire, setDonneesFormulaire] = useState<FormulaireCommande>(FORMULAIRE_VIDE);

  const [chargementEnCours, setChargementEnCours] = useState(true);
  const [envoiCommandeEnCours, setEnvoiCommandeEnCours] = useState(false);
  const [messageRetour, setMessageRetour] = useState("");

  const [produitSelectionne, setProduitSelectionne] = useState<Product | null>(null);

  // --- 1) CHARGEMENT INITIAL ---
  useEffect(() => {
    const sessionActuelle = chargerSession();
    if (sessionActuelle) {
      setInfosSession(sessionActuelle);
      // On pré-remplit le nom complet pour aller plus vite.
      setDonneesFormulaire((prev) => ({ ...prev, fullName: sessionActuelle.user.name }));
    }

    // Fonction pour récupérer les données du serveur.
    const recupererDonnees = async () => {
      try {
        // A) On récupère tous les produits.
        const produitsRecus = await appelAPI<Product[]>("/products");
        setListeProduits(produitsRecus);

        // B) Si on est connecté, on télécharge l'historique de nos commandes.
        if (sessionActuelle) {
          const commandesRecues = await appelAPI<Order[]>("/orders/mine", {
            token: sessionActuelle.token
          });
          setMesCommandes(commandesRecues);
        }
      } catch (erreur) {
        console.error("Erreur de chargement:", erreur);
        setMessageRetour("Impossible de charger les produits.");
      } finally {
        setChargementEnCours(false);
      }
    };

    recupererDonnees();
  }, []);

  // --- 2) LOGIQUE DU PANIER ---

  // Ajouter un produit au panier (+1).
  const ajouterAuPanier = (idProduit: string) => {
    if (!infosSession) {
      setMessageRetour("Veuillez vous connecter pour commander.");
      return;
    }
    setPanier((actuel) => ({
      ...actuel,
      [idProduit]: (actuel[idProduit] || 0) + 1,
    }));
  };

  // Changer ou supprimer un produit du panier.
  const modifierQuantite = (idProduit: string, nouvelleQuantite: number) => {
    setPanier((actuel) => {
      const nouveauPanier = { ...actuel };
      if (nouvelleQuantite <= 0) {
        delete nouveauPanier[idProduit];
      } else {
        nouveauPanier[idProduit] = nouvelleQuantite;
      }
      return nouveauPanier;
    });
  };

  // Convertir le panier (objet) en liste lisible d'articles.
  const articlesDansLePanier = listeProduits
    .filter((p) => panier[p._id] > 0)
    .map((p) => ({
      produit: p,
      quantite: panier[p._id],
      totalLigne: p.price * panier[p._id]
    }));

  // Calculer le total global du panier.
  const totalGlobalPanier = articlesDansLePanier.reduce((somme, item) => somme + item.totalLigne, 0);

  // --- 3) LOGIQUE DU FORMULAIRE ---

  const miseAJourChamp = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDonneesFormulaire({ ...donneesFormulaire, [e.target.name]: e.target.value });
  };

  // Envoyer la commande finale au backend.
  const validerLaCommande = async (evenement: FormEvent) => {
    evenement.preventDefault();
    if (articlesDansLePanier.length === 0) return;

    setEnvoiCommandeEnCours(true);
    setMessageRetour("");

    try {
      // Préparation de la liste pour l'API.
      const articlesPourBackend = articlesDansLePanier.map((item) => ({
        productId: item.produit._id,
        quantity: item.quantite
      }));

      // Appel API de création de commande.
      await appelAPI("/orders", {
        method: "POST",
        token: infosSession?.token,
        body: {
          items: articlesPourBackend,
          ...donneesFormulaire
        }
      });

      // On vide le panier et on actualise les commandes.
      setPanier({});
      const nouvellesCommandes = await appelAPI<Order[]>("/orders/mine", {
        token: infosSession?.token
      });
      setMesCommandes(nouvellesCommandes);
      
      setMessageRetour("🎉 Votre commande a été enregistrée avec succès !");
    } catch (erreur: any) {
      setMessageRetour(erreur.message || "Erreur lors de la commande.");
    } finally {
      setEnvoiCommandeEnCours(false);
    }
  };

  return (
    <>
      <SiteHeader />
      
      <main className="shell py-10 space-y-10">
        
        {/* SECTION 1 : BANDEAU D'ACCUEIL */}
        <section className="panel bg-[#2f2b25] text-white p-8 rounded-3xl">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-display text-5xl font-bold">Catalogue Matériaux</h1>
            <p className="text-lg text-white/80">
              Commandez en quelques clics tout le nécessaire pour vos chantiers. 
              Livraison rapide garantie.
            </p>
            {!infosSession && (
              <div className="flex gap-4 pt-2">
                <Link href="/auth/login" className="btn bg-white text-[#2f2b25] hover:bg-white/90">Se Connecter</Link>
                <Link href="/auth/register" className="btn border-white text-white">S'Inscrire</Link>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2 : PRODUITS ET PANIER */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* A) COLONNE DE GAUCHE : LES PRODUITS */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-3xl font-bold text-[#1a1a1a]">Nos Articles Disponibles</h2>
            
            {chargementEnCours ? (
              <div className="p-20 text-center text-[#6b7280]">Chargement du catalogue...</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {listeProduits.map((p) => (
                  <article key={p._id} className="panel bg-white p-4 group transition-all hover:shadow-xl rounded-2xl border border-[#e5e7eb]">
                    <div 
                      className="aspect-video bg-[#f3f4f6] rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => setProduitSelectionne(p)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-[#111827]">{p.title}</h3>
                        <span className="text-[#ff7a18] font-bold">{formatPriceMad(p.price)}</span>
                      </div>
                      <p className="text-sm text-[#6b7280] line-clamp-2">{p.description}</p>
                      <div className="pt-2 flex gap-2">
                        <button 
                          className="btn btn-primary flex-1 py-2 text-sm"
                          onClick={() => ajouterAuPanier(p._id)}
                        >
                          Ajouter au Panier
                        </button>
                        <button 
                          className="btn btn-ghost py-2 text-sm"
                          onClick={() => setProduitSelectionne(p)}
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* B) COLONNE DE DROITE : PANIER ET COMMANDE */}
          <aside className="space-y-6">
            <section className="panel bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb] sticky top-8">
              <h2 className="font-display text-2xl font-bold mb-4">Votre Panier</h2>
              
              {!infosSession ? (
                <p className="text-sm text-[#6b7280]">Connectez-vous pour voir votre panier.</p>
              ) : articlesDansLePanier.length === 0 ? (
                <p className="text-sm text-[#6b7280]">Votre panier est vide pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {/* Liste des articles du panier */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {articlesDansLePanier.map((item) => (
                      <div key={item.produit._id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-[#f3f4f6]">
                        <div className="text-sm">
                          <p className="font-bold text-[#111827]">{item.produit.title}</p>
                          <p className="text-[#6b7280]">{item.quantite} x {formatPriceMad(item.produit.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => modifierQuantite(item.produit._id, item.quantite - 1)} className="btn btn-ghost p-1">-</button>
                          <span className="font-bold">{item.quantite}</span>
                          <button onClick={() => modifierQuantite(item.produit._id, item.quantite + 1)} className="btn btn-ghost p-1">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-[#e5e7eb] pt-4 flex justify-between items-center text-xl font-bold">
                    <span>Total à payer :</span>
                    <span className="text-[#ff7a18]">{formatPriceMad(totalGlobalPanier)}</span>
                  </div>

                  {/* Formulaire de livraison */}
                  <form onSubmit={validerLaCommande} className="space-y-3 pt-4 border-t border-[#e5e7eb]">
                    <p className="text-sm font-bold text-[#374151]">Infos de Livraison</p>
                    <input name="fullName" placeholder="Votre Nom complet" value={donneesFormulaire.fullName} onChange={miseAJourChamp} required />
                    <input name="phone" placeholder="Numéro de Téléphone" value={donneesFormulaire.phone} onChange={miseAJourChamp} required />
                    <input name="city" placeholder="Ville de livraison" value={donneesFormulaire.city} onChange={miseAJourChamp} required />
                    <textarea name="address" placeholder="Adresse précise" rows={2} value={donneesFormulaire.address} onChange={miseAJourChamp} required className="w-full" />
                    <textarea name="notes" placeholder="Notes (facultatif)" rows={2} value={donneesFormulaire.notes} onChange={miseAJourChamp} className="w-full" />
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary w-full py-4 text-lg font-bold"
                      disabled={envoiCommandeEnCours}
                    >
                      {envoiCommandeEnCours ? "Envoi en cours..." : "Confirmer la Commande"}
                    </button>
                  </form>
                </div>
              )}

              {/* Message de succès ou d'erreur */}
              {messageRetour && (
                <div className="mt-4 p-4 text-center rounded-xl bg-orange-50 text-orange-700 text-sm font-bold">
                  {messageRetour}
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* SECTION 3 : HISTORIQUE DES COMMANDES (En bas) */}
        {infosSession && mesCommandes.length > 0 && (
          <section className="panel bg-[#f8f9fa] p-8 rounded-3xl border border-[#e5e7eb]">
            <h2 className="font-display text-3xl font-bold mb-6">Mon Historique de Commandes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mesCommandes.map((cmd) => (
                <div key={cmd._id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#f3f4f6]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#9ca3af]">Commande #{cmd._id.slice(-6)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${cmd.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {cmd.status === 'in_progress' ? '⏳ En cours' : '✅ Validée'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#111827]">{formatPriceMad(cmd.totalAmount)}</p>
                  <p className="text-sm text-[#6b7280] mt-1">{new Date(cmd.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* POPUP : DÉTAILS DU PRODUIT (Modale) */}
      {produitSelectionne && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 h-10 w-10 bg-white shadow-md rounded-full flex items-center justify-center font-bold text-xl hover:bg-gray-100"
              onClick={() => setProduitSelectionne(null)}
            >
              ✕
            </button>
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={produitSelectionne.imageUrl} alt={produitSelectionne.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#ff7a18]">{produitSelectionne.category}</span>
                  <h2 className="text-4xl font-bold text-[#111827]">{produitSelectionne.title}</h2>
                  <p className="text-3xl font-bold text-[#111827]">{formatPriceMad(produitSelectionne.price)}</p>
                </div>
                <p className="text-[#4b5563] leading-relaxed">{produitSelectionne.description}</p>
                
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#111827]">Caractéristiques :</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {produitSelectionne.specs?.map((s) => (
                      <li key={s} className="text-sm text-[#6b7280] flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                        {s}
                      </li>
                    ))}
                    <li className="text-sm text-[#6b7280] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                      Stock : {produitSelectionne.stock} {produitSelectionne.unit}
                    </li>
                  </ul>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    className="btn btn-primary flex-1 py-4 text-lg"
                    onClick={() => {
                      ajouterAuPanier(produitSelectionne._id);
                      setProduitSelectionne(null);
                    }}
                  >
                    Ajouter au Panier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
