"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { clearSession, loadSession } from "@/lib/session";
import type { ContactMessage, Order, Product, Session } from "@/lib/types";
import { formatPriceMad, getErrorMessage } from "@/lib/ui";

// Onglets disponibles dans le tableau de bord admin.
type AdminTab = "products" | "orders" | "messages";

// Structure du formulaire de creation/modification de produit.
type ProductForm = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
};

// Valeur initiale vide pour le formulaire produit.
const EMPTY_PRODUCT_FORM: ProductForm = {
  title: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
};

// Les 3 decisions que l admin peut prendre sur une commande.
const ORDER_DECISIONS = [
  { value: "accepted", label: "Accepter" },
  { value: "refused", label: "Refuser" },
  { value: "out_of_stock", label: "Rupture de stock" },
] as const;

// Texte lisible pour chaque statut de commande.
const ORDER_LABELS: Record<string, string> = {
  in_progress: "En cours",
  accepted: "Acceptee",
  refused: "Refusee",
  out_of_stock: "Rupture de stock",
};

// Couleurs du badge selon statut de commande.
const ORDER_BADGE_STYLES: Record<string, string> = {
  in_progress: "border-[#e8c387] bg-[#fff5e6] text-[#a15b00]",
  accepted: "border-[#8bcf9d] bg-[#ebfff0] text-[#176534]",
  refused: "border-[#e5a4a0] bg-[#fff1f0] text-[#8f241c]",
  out_of_stock: "border-[#d5c9b7] bg-[#f7f2ea] text-[#665845]",
};

// Texte lisible pour statut de conversation projet.
const MESSAGE_LABELS: Record<string, string> = {
  new: "En attente",
  replied: "Repondu",
  read: "En attente",
};

// Fonction simple: transformer un code statut commande en texte.
const getOrderLabel = (status: string) => ORDER_LABELS[status] || status;

// Fonction simple: choisir le style du badge commande.
const getOrderBadgeStyle = (status: string) =>
  ORDER_BADGE_STYLES[status] || "border-[#d5c9b7] bg-[#f7f2ea] text-[#665845]";

// Fonction simple: transformer un statut message en texte.
const getMessageLabel = (status: string) => MESSAGE_LABELS[status] || status;

// Statistiques resume des commandes.
type OrderStats = {
  inProgress: number;
  accepted: number;
  refused: number;
  outOfStock: number;
};

// Calcul simple des stats commandes pour les petites cartes.
const calculateOrderStats = (orders: Order[]): OrderStats => {
  // Valeurs de depart.
  const stats: OrderStats = {
    inProgress: 0,
    accepted: 0,
    refused: 0,
    outOfStock: 0,
  };

  // On parcourt toutes les commandes une par une.
  for (const order of orders) {
    const status = order.status;

    if (status === "in_progress") {
      stats.inProgress += 1;
      continue;
    }

    if (status === "accepted") {
      stats.accepted += 1;
      continue;
    }

    if (status === "refused") {
      stats.refused += 1;
      continue;
    }

    if (status === "out_of_stock") {
      stats.outOfStock += 1;
    }
  }

  return stats;
};

export default function AdminDashboardPage() {
  // Router Next.js pour redirections.
  const router = useRouter();

  // Session de l utilisateur connecte.
  const [session, setSession] = useState<Session | null>(null);

  // Etat visuel: verification de session au demarrage.
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Etat visuel: chargement des donnees.
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Onglet actif dans le dashboard.
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  // Message global de retour (succes/erreur).
  const [feedback, setFeedback] = useState("");

  // Donnees principales.
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Edition produit.
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Brouillons de reponse admin (cle = id message).
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Statistiques commandes.
  const orderStats = calculateOrderStats(orders);

  // Au premier rendu: verifier la session et verifier role admin.
  useEffect(() => {
    const savedSession = loadSession();

    // Pas de session => pas d acces.
    if (!savedSession) {
      setIsCheckingAccess(false);
      return;
    }

    // Session existe mais role non admin => redirection login.
    if (savedSession.user.role !== "admin") {
      router.replace("/auth/login");
      return;
    }

    // Session admin valide.
    setSession(savedSession);
    setIsCheckingAccess(false);
  }, [router]);

  // Charger la liste des produits.
  const loadProducts = async () => {
    const productList = await apiRequest<Product[]>("/products");
    setProducts(productList);
  };

  // Charger la liste des commandes (admin).
  const loadOrders = async (token: string) => {
    const orderList = await apiRequest<Order[]>("/orders", { token });
    setOrders(orderList);
  };

  // Charger la liste des demandes projet (admin).
  const loadMessages = async (token: string) => {
    const messageList = await apiRequest<ContactMessage[]>("/messages", { token });
    setMessages(messageList);
  };

  // Quand la session admin est prete: charger toutes les donnees.
  useEffect(() => {
    if (!session) {
      setIsLoadingData(false);
      return;
    }

    const loadAllData = async () => {
      setIsLoadingData(true);
      setFeedback("");

      try {
        await loadProducts();
        await loadOrders(session.token);
        await loadMessages(session.token);
      } catch (error) {
        setFeedback(getErrorMessage(error, "Echec du chargement des donnees admin"));
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadAllData();
  }, [session]);

  // Revenir au formulaire produit vide.
  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
  };

  // Gérer changements des champs du formulaire produit.
  const handleProductInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    // Securite: on ignore tout champ inconnu.
    if (!["title", "description", "price", "imageUrl", "category"].includes(name)) {
      return;
    }

    const key = name as keyof ProductForm;
    setProductForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // Creer ou mettre a jour un produit.
  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      return;
    }

    setIsSavingProduct(true);
    setFeedback("");

    try {
      // Construction du payload envoye a l API.
      const payload = {
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        imageUrl: productForm.imageUrl.trim(),
        category: productForm.category.trim() || "General",
      };

      // Mode edition.
      if (editingProductId) {
        await apiRequest<Product>(`/products/${editingProductId}`, {
          method: "PUT",
          token: session.token,
          body: payload,
        });
        setFeedback("Produit mis a jour.");
      } else {
        // Mode creation.
        await apiRequest<Product>("/products", {
          method: "POST",
          token: session.token,
          body: payload,
        });
        setFeedback("Produit ajoute.");
      }

      // Recharge la liste et reset formulaire.
      await loadProducts();
      resetProductForm();
    } catch (error) {
      setFeedback(getErrorMessage(error, "Action produit echouee"));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Mettre un produit dans le formulaire pour edition.
  const editProduct = (product: Product) => {
    setEditingProductId(product._id);
    setProductForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
    });
    setActiveTab("products");
  };

  // Supprimer un produit.
  const deleteProduct = async (productId: string) => {
    if (!session) {
      return;
    }

    if (!window.confirm("Supprimer ce produit ?")) {
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/products/${productId}`, {
        method: "DELETE",
        token: session.token,
      });

      await loadProducts();
      setFeedback("Produit supprime.");

      // Si le produit supprime etait en edition, reset form.
      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch (error) {
      setFeedback(getErrorMessage(error, "Suppression echouee"));
    }
  };

  // Mettre a jour statut d une commande.
  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    if (!session) {
      return;
    }

    try {
      await apiRequest<Order>(`/orders/${orderId}/status`, {
        method: "PATCH",
        token: session.token,
        body: { status: nextStatus },
      });

      await loadOrders(session.token);
      setFeedback("Statut de commande mis a jour.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Mise a jour du statut echouee"));
    }
  };

  // Supprimer une commande.
  const deleteOrder = async (orderId: string) => {
    if (!session) {
      return;
    }

    if (!window.confirm("Supprimer cette commande ?")) {
      return;
    }

    try {
      await apiRequest<{ message: string }>(`/orders/${orderId}`, {
        method: "DELETE",
        token: session.token,
      });

      await loadOrders(session.token);
      setFeedback("Commande supprimee.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Suppression de commande echouee"));
    }
  };

  // Envoyer une reponse admin sur une demande projet.
  const sendReply = async (messageId: string) => {
    if (!session) {
      return;
    }

    const replyText = (replyDrafts[messageId] || "").trim();
    if (!replyText) {
      setFeedback("Ecrivez une reponse avant d envoyer.");
      return;
    }

    try {
      await apiRequest<ContactMessage>(`/messages/${messageId}/reply`, {
        method: "PATCH",
        token: session.token,
        body: { reply: replyText },
      });

      // Nettoyer le champ local du message traite.
      setReplyDrafts((current) => ({ ...current, [messageId]: "" }));

      await loadMessages(session.token);
      setFeedback("Reponse envoyee.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Reponse echouee"));
    }
  };

  // Supprimer une conversation projet.
  const deleteMessage = async (messageId: string) => {
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

      await loadMessages(session.token);
      setFeedback("Conversation supprimee.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Suppression echouee"));
    }
  };

  // Deconnexion admin.
  const logout = () => {
    clearSession();
    router.push("/auth/login");
  };

  // Ecran simple pendant verification session.
  if (isCheckingAccess) {
    return <main className="shell py-8 text-sm text-[#6b6257]">Verification de la session...</main>;
  }

  // Ecran simple si pas de session admin.
  if (!session) {
    return (
      <main className="shell py-10">
        <section className="panel space-y-4 p-8">
          <h1 className="font-display text-2xl font-bold">Tableau de bord admin</h1>
          <p className="text-sm text-[#6b6257]">Connectez-vous en tant qu administrateur.</p>
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn btn-primary">
              Connexion
            </Link>
            <Link href="/" className="btn btn-ghost">
              Accueil
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell space-y-6 py-6">
      {/* En-tete principal admin */}
      <header className="panel hero-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">Tableau de bord admin</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Bienvenue, {session.user.name}</h1>
        </div>
        <button className="btn border border-white/35 bg-white/10 text-sm text-white hover:bg-white/20" onClick={logout}>
          Deconnexion
        </button>
      </header>

      {/* Navigation des onglets */}
      <nav className="panel flex flex-wrap gap-2 p-3">
        <button className={`btn text-sm ${activeTab === "products" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("products")}>
          Produits
        </button>
        <button className={`btn text-sm ${activeTab === "orders" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("orders")}>
          Commandes
        </button>
        <button className={`btn text-sm ${activeTab === "messages" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("messages")}>
          Demandes projet
        </button>
      </nav>

      {/* Message global de feedback */}
      {feedback ? <p className="rounded-xl bg-[#fff4e5] p-3 text-sm text-[#c46a00]">{feedback}</p> : null}

      {/* Etat de chargement */}
      {isLoadingData ? <section className="panel p-6 text-sm text-[#5d5448]">Chargement des donnees...</section> : null}

      {/* Section Produits */}
      {activeTab === "products" && !isLoadingData ? (
        <section className="grid items-start gap-5 lg:grid-cols-[1fr_1.4fr]">
          {/* Formulaire produit */}
          <form className="panel space-y-3 p-5" onSubmit={saveProduct}>
            <h2 className="font-display text-2xl font-bold">{editingProductId ? "Modifier le produit" : "Ajouter un produit"}</h2>

            <input name="title" placeholder="Titre" value={productForm.title} onChange={handleProductInputChange} required />
            <textarea
              name="description"
              rows={3}
              placeholder="Description"
              value={productForm.description}
              onChange={handleProductInputChange}
              required
            />
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Prix"
              value={productForm.price}
              onChange={handleProductInputChange}
              required
            />
            <input name="imageUrl" placeholder="URL image" value={productForm.imageUrl} onChange={handleProductInputChange} required />
            <input name="category" placeholder="Categorie" value={productForm.category} onChange={handleProductInputChange} required />

            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" type="submit" disabled={isSavingProduct}>
                {isSavingProduct ? "Enregistrement..." : editingProductId ? "Mettre a jour" : "Creer"}
              </button>
              {editingProductId ? (
                <button className="btn btn-ghost" type="button" onClick={resetProductForm}>
                  Annuler
                </button>
              ) : null}
            </div>
          </form>

          {/* Liste produits */}
          <div className="panel p-5">
            <h2 className="font-display text-2xl font-bold">Liste des produits</h2>
            {products.length === 0 ? (
              <p className="mt-3 text-sm text-[#5d5448]">Aucun produit pour le moment.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {products.map((product) => (
                  <article key={product._id} className="rounded-xl border border-[#d7cebf] bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-[#ece5d7]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.title}</h3>
                          <p className="text-xs text-[#5d5448]">{product.description}</p>
                          <p className="text-xs text-[#c46a00]">{formatPriceMad(product.price)}</p>
                          <p className="text-xs text-[#5d5448]">Categorie: {product.category}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="btn btn-ghost text-sm" type="button" onClick={() => editProduct(product)}>
                          Modifier
                        </button>
                        <button className="btn btn-primary text-sm" type="button" onClick={() => deleteProduct(product._id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Section Commandes */}
      {activeTab === "orders" && !isLoadingData ? (
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Commandes</h2>
            <span className="chip">{orders.length} commandes</span>
          </div>

          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-[#5d5448]">Aucune commande pour le moment.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Cartes statistiques */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#e8c387] bg-[#fff5e6] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#a15b00]">En cours</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[#7f4700]">{orderStats.inProgress}</p>
                </div>
                <div className="rounded-xl border border-[#8bcf9d] bg-[#ebfff0] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#176534]">Acceptees</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[#176534]">{orderStats.accepted}</p>
                </div>
                <div className="rounded-xl border border-[#e5a4a0] bg-[#fff1f0] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8f241c]">Refusees</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[#8f241c]">{orderStats.refused}</p>
                </div>
                <div className="rounded-xl border border-[#d5c9b7] bg-[#f7f2ea] p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#665845]">Rupture stock</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[#665845]">{orderStats.outOfStock}</p>
                </div>
              </div>

              {/* Liste des commandes */}
              <div className="space-y-4">
                {orders.map((order) => (
                  <article key={order._id} className="overflow-hidden rounded-2xl border border-[#d7cebf] bg-white shadow-[0_10px_22px_rgba(66,52,33,0.09)]">
                    <div className="border-b border-[#e2d8c8] bg-[#fcf8f2] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8b7e6b]">Commande</p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getOrderBadgeStyle(order.status)}`}>
                            {getOrderLabel(order.status)}
                          </span>
                          <select
                            value={ORDER_DECISIONS.some((option) => option.value === order.status) ? order.status : ""}
                            onChange={(event) => {
                              const nextStatus = event.target.value;
                              if (nextStatus) {
                                void updateOrderStatus(order._id, nextStatus);
                              }
                            }}
                            className="w-52 bg-white text-sm"
                          >
                            <option value="" disabled>
                              Choisir une decision
                            </option>
                            {ORDER_DECISIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button className="btn btn-ghost text-sm" type="button" onClick={() => deleteOrder(order._id)}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.2fr]">
                      <div className="space-y-2 text-sm text-[#4f463a]">
                        <p>
                          <span className="font-semibold text-[#2e2619]">Client:</span>{" "}
                          {typeof order.user === "string" ? "Utilisateur inconnu" : `${order.user.name} (${order.user.email})`}
                        </p>
                        <p>
                          <span className="font-semibold text-[#2e2619]">Telephone:</span> {order.phone}
                        </p>
                        <p>
                          <span className="font-semibold text-[#2e2619]">Adresse:</span> {order.city}, {order.address}
                        </p>
                        <p className="rounded-lg border border-[#e2d8c8] bg-[#f7f1e8] px-3 py-2 font-semibold text-[#7f4700]">
                          Total: {formatPriceMad(order.totalAmount)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#e2d8c8] bg-[#fffdfa] p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8b7e6b]">Produits commandes</p>
                        <ul className="mt-2 space-y-2">
                          {order.items.map((item) => (
                            <li
                              key={`${order._id}-${item.product}`}
                              className="flex items-start justify-between gap-3 border-b border-[#efe7db] pb-2 text-sm last:border-0 last:pb-0"
                            >
                              <span className="text-[#4f463a]">
                                {item.title} <span className="font-semibold text-[#2e2619]">x{item.quantity}</span>
                              </span>
                              <span className="font-semibold text-[#7f4700]">{formatPriceMad(item.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {/* Section Demandes Projet */}
      {activeTab === "messages" && !isLoadingData ? (
        <section className="panel p-5">
          <h2 className="font-display text-2xl font-bold">Demandes de projet</h2>
          {messages.length === 0 ? (
            <p className="mt-3 text-sm text-[#5d5448]">Aucune demande de projet pour le moment.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {messages.map((message) => (
                <article key={message._id} className="rounded-xl border border-[#d7cebf] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{message.name}</p>
                      <p className="text-sm text-[#5d5448]">{message.email}</p>
                      {message.phone ? <p className="text-sm text-[#5d5448]">{message.phone}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="chip">{getMessageLabel(message.status)}</span>
                      <button className="btn btn-ghost text-sm" type="button" onClick={() => deleteMessage(message._id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {message.subject ? <p className="mt-2 text-sm font-semibold">{message.subject}</p> : null}
                  <p className="mt-1 text-sm text-[#4c4338]">{message.message}</p>

                  {message.adminReply ? (
                    <div className="mt-3 rounded-xl border border-[#d9cdb9] bg-[#f9f4ea] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#7c6e5a]">Reponse admin</p>
                      <p className="mt-1 text-sm text-[#3f372c]">{message.adminReply}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Ecrire une reponse au client..."
                      value={replyDrafts[message._id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [message._id]: event.target.value,
                        }))
                      }
                    />
                    <button className="btn btn-primary text-sm" type="button" onClick={() => sendReply(message._id)}>
                      Envoyer reponse
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
