"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import SiteHeader from "@/components/site-header";
import { apiRequest } from "@/lib/api";
import { loadSession } from "@/lib/session";
import type { Order, Product, Session } from "@/lib/types";
import { formatPriceMad, getErrorMessage } from "@/lib/ui";

// Panier stocke la quantite par id produit.
type CartMap = { [productId: string]: number };

// Formulaire de livraison/commande.
type OrderForm = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
};

// Valeur initiale du formulaire commande.
const EMPTY_ORDER_FORM: OrderForm = {
  fullName: "",
  phone: "",
  city: "",
  address: "",
  notes: "",
};

// Traduction simple des statuts commande.
const ORDER_STATUS_LABELS: Record<string, string> = {
  in_progress: "En cours",
  accepted: "Commande acceptee",
  refused: "Commande refusee",
  out_of_stock: "Rupture de stock",
};

// Helper simple pour afficher un statut lisible.
const getOrderStatusLabel = (status: string) => ORDER_STATUS_LABELS[status] || status;

export default function ProductsPage() {
  // Session utilisateur (null si non connecte).
  const [session, setSession] = useState<Session | null>(null);

  // Liste de tous les produits disponibles.
  const [products, setProducts] = useState<Product[]>([]);

  // Liste des commandes de l utilisateur connecte.
  const [orders, setOrders] = useState<Order[]>([]);

  // Etat du panier.
  const [cart, setCart] = useState<CartMap>({});

  // Etat du formulaire de commande.
  const [orderForm, setOrderForm] = useState<OrderForm>(EMPTY_ORDER_FORM);

  // Etats UI.
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");

  // Produit actuellement ouvert dans la fenetre details.
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Chargement initial (session + produits + commandes utilisateur).
  useEffect(() => {
    const savedSession = loadSession();

    // Si utilisateur connecte role user => on garde la session.
    if (savedSession && savedSession.user.role === "user") {
      setSession(savedSession);

      // On pre-remplit le nom.
      setOrderForm((current) => ({
        ...current,
        fullName: savedSession.user.name,
      }));
    }

    // Fonction locale de chargement.
    const loadData = async () => {
      try {
        // Charger produits.
        const productList = await apiRequest<Product[]>("/products");
        setProducts(productList);

        // Charger commandes personnelles si user connecte.
        if (savedSession && savedSession.user.role === "user") {
          const myOrders = await apiRequest<Order[]>("/orders/mine", {
            token: savedSession.token,
          });
          setOrders(myOrders);
        }
      } catch (error) {
        setMessage(getErrorMessage(error, "Impossible de charger les donnees"));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // Les produits mis en avant d abord.
  const displayProducts = [...products].sort((a, b) => Number(b.featured) - Number(a.featured));

  // Transformer "cart map" en liste exploitable.
  const cartItems: { product: Product; quantity: number }[] = [];
  for (const product of products) {
    const quantity = cart[product._id] || 0;
    if (quantity > 0) {
      cartItems.push({ product, quantity });
    }
  }

  // Compter total articles + total prix.
  let cartCount = 0;
  let cartTotal = 0;
  for (const item of cartItems) {
    cartCount += item.quantity;
    cartTotal += item.product.price * item.quantity;
  }

  // Ajouter 1 quantite d un produit au panier.
  const addToCart = (productId: string) => {
    if (!session) {
      setMessage("Connectez-vous d abord pour commander.");
      return;
    }

    setCart((current) => ({
      ...current,
      [productId]: (current[productId] || 0) + 1,
    }));
  };

  // Changer manuellement la quantite d un produit.
  const changeQuantity = (productId: string, nextQuantity: number) => {
    setCart((current) => {
      const nextCart = { ...current };

      // Quantite <= 0 => supprimer du panier.
      if (nextQuantity <= 0) {
        delete nextCart[productId];
      } else {
        nextCart[productId] = nextQuantity;
      }

      return nextCart;
    });
  };

  // Mettre a jour les champs du formulaire commande.
  const handleOrderInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    setOrderForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Ouvrir popup details produit.
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  // Fermer popup details produit.
  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  // Envoyer la commande.
  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      setMessage("Connectez-vous d abord.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Votre panier est vide.");
      return;
    }

    setPlacingOrder(true);
    setMessage("");

    try {
      // Construire items API depuis panier.
      const orderItems = cartItems.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      // Creation de commande.
      await apiRequest<Order>("/orders", {
        method: "POST",
        token: session.token,
        body: {
          items: orderItems,
          ...orderForm,
        },
      });

      // Recharger commandes utilisateur.
      const myOrders = await apiRequest<Order[]>("/orders/mine", {
        token: session.token,
      });
      setOrders(myOrders);

      // Vider panier et notes.
      setCart({});
      setOrderForm((current) => ({
        ...current,
        notes: "",
      }));

      setMessage("Commande envoyee avec succes.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Commande echouee"));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="shell space-y-6 py-6">
        {/* Bandeau principal */}
        <section className="panel hero-card p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="chip inline-flex border-white/30 bg-white/10 text-white">Catalogue FIKHI CONSTRUCTION</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">Produits</h1>
              <p className="mt-3 text-sm text-white/85">Choisissez vos produits, ajoutez-les au panier et passez votre commande rapidement.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-center text-white">
                <p className="text-xs text-white/70">Produits</p>
                <p className="font-display text-xl font-bold">{loading ? "..." : products.length}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-center text-white">
                <p className="text-xs text-white/70">Panier</p>
                <p className="font-display text-xl font-bold">{cartCount}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-center text-white">
                <p className="text-xs text-white/70">Total</p>
                <p className="font-display text-xl font-bold">{formatPriceMad(cartTotal)}</p>
              </div>
            </div>
          </div>

          {/* Boutons connexion/inscription pour visiteur */}
          {!session ? (
            <div className="mt-5 flex gap-2">
              <Link href="/auth/login" className="btn btn-ghost">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                Inscription
              </Link>
            </div>
          ) : null}
        </section>

        {/* Message de retour global */}
        {message ? <p className="panel rounded-xl bg-[#fff4e5] p-3 text-sm text-[#c46a00]">{message}</p> : null}

        <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
          {/* Liste produits */}
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold">Liste des produits</h2>
              <span className="chip">{loading ? "Chargement" : `${products.length} produits`}</span>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-[#5d5448]">Chargement...</p>
            ) : products.length === 0 ? (
              <p className="mt-4 text-sm text-[#5d5448]">Aucun produit trouve.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {displayProducts.map((product) => (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-2xl border border-[#d7cebf] bg-white shadow-[0_12px_24px_rgba(64,50,31,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(64,50,31,0.14)]"
                  >
                    <button className="block h-48 w-full bg-[#ece5d7]" type="button" onClick={() => openProductDetails(product)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    </button>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#0f172a]">{product.title}</p>
                          <p className="mt-1 text-xs text-[#7a6f60]">
                            {product.stock} {product.unit || "u"} en stock
                          </p>
                        </div>
                        <span className="chip">{product.category}</span>
                      </div>

                      <p className="min-h-10 text-sm text-[#5d5448]">{product.description}</p>

                      {product.specs?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {product.specs.slice(0, 2).map((spec) => (
                            <span key={`${product._id}-${spec}`} className="rounded-full border border-[#ddd2c0] bg-[#faf6ee] px-2 py-1 text-xs text-[#6c5e4a]">
                              {spec}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between pt-1">
                        <p className="font-bold text-[#c46a00]">{formatPriceMad(product.price)}</p>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost text-sm" type="button" onClick={() => openProductDetails(product)}>
                            Decouvrir
                          </button>
                          <button className="btn btn-primary text-sm" type="button" onClick={() => addToCart(product._id)}>
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Panier + formulaire commande */}
          <aside className="panel h-fit space-y-4 p-5 lg:sticky lg:top-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Panier</h2>
              <span className="chip">{cartCount} articles</span>
            </div>

            {!session ? (
              <p className="text-sm text-[#5d5448]">Connectez-vous pour utiliser le panier.</p>
            ) : cartItems.length === 0 ? (
              <p className="text-sm text-[#5d5448]">Le panier est vide.</p>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="rounded-xl border border-[#d7cebf] bg-[#f8f1e6] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{item.product.title}</p>
                      <button
                        type="button"
                        className="rounded-full border border-[#d9cdb9] bg-white px-2 py-0.5 text-xs font-bold text-[#6b5d49] hover:bg-[#f3eadc]"
                        onClick={() => changeQuantity(item.product._id, 0)}
                      >
                        X
                      </button>
                    </div>

                    <p className="text-xs text-[#5d5448]">{formatPriceMad(item.product.price)}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={() => changeQuantity(item.product._id, item.quantity - 1)}>
                        -
                      </button>
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={() => changeQuantity(item.product._id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-[#d7cebf] bg-[#f5edde] p-3">
              <p className="text-xs text-[#5d5448]">Montant total</p>
              <p className="font-display text-2xl font-bold text-[#c46a00]">{formatPriceMad(cartTotal)}</p>
            </div>

            <form className="space-y-2 border-t border-[#d8ccb6] pt-3" onSubmit={placeOrder}>
              <input name="fullName" placeholder="Nom complet" value={orderForm.fullName} onChange={handleOrderInputChange} required />
              <input name="phone" placeholder="Telephone" value={orderForm.phone} onChange={handleOrderInputChange} required />
              <input name="city" placeholder="Ville" value={orderForm.city} onChange={handleOrderInputChange} required />
              <input name="address" placeholder="Adresse" value={orderForm.address} onChange={handleOrderInputChange} required />
              <textarea name="notes" placeholder="Notes" rows={3} value={orderForm.notes} onChange={handleOrderInputChange} />
              <button className="btn btn-primary w-full" type="submit" disabled={placingOrder || !session}>
                {placingOrder ? "Envoi..." : "Passer la commande"}
              </button>
            </form>
          </aside>
        </div>

        {/* Fenetre details produit */}
        {selectedProduct ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="panel relative max-h-[92vh] w-full max-w-4xl overflow-y-auto p-5 md:p-6">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full border border-[#d8ccb6] bg-white px-3 py-1 text-sm font-semibold"
                onClick={closeProductDetails}
              >
                Fermer
              </button>

              <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-[#d7cebf] bg-[#ece5d7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="h-full w-full object-cover" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="chip">{selectedProduct.category}</span>
                    {selectedProduct.featured ? <span className="chip">Vedette</span> : null}
                  </div>
                  <h3 className="font-display text-3xl font-bold text-[#1a2433]">{selectedProduct.title}</h3>
                  <p className="text-sm text-[#5d5448]">{selectedProduct.description}</p>

                  <div className="rounded-xl border border-[#d7cebf] bg-[#f8f2e7] p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7f725e]">Prix</p>
                    <p className="font-display text-3xl font-bold text-[#c46a00]">{formatPriceMad(selectedProduct.price)}</p>
                  </div>

                  {selectedProduct.specs?.length ? (
                    <div className="rounded-xl border border-[#e2d8c8] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-[#7f725e]">Caracteristiques</p>
                      <ul className="mt-2 space-y-1 text-sm text-[#4f463a]">
                        {selectedProduct.specs.map((spec) => (
                          <li key={`${selectedProduct._id}-${spec}`}>- {spec}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="btn btn-primary" type="button" onClick={() => addToCart(selectedProduct._id)}>
                      Ajouter au panier
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={closeProductDetails}>
                      Retour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Historique commandes utilisateur */}
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Mes commandes</h2>
            <span className="chip">{orders.length} commandes</span>
          </div>

          {!session ? (
            <p className="mt-4 text-sm text-[#5d5448]">Connectez-vous pour voir vos commandes.</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-sm text-[#5d5448]">Aucune commande pour le moment.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {orders.map((order) => (
                <div key={order._id} className="rounded-xl border border-[#d7cebf] bg-white p-3">
                  <p className="text-sm text-[#5d5448]">Statut: {getOrderStatusLabel(order.status)}</p>
                  <p className="font-semibold text-[#0f172a]">Total: {formatPriceMad(order.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
