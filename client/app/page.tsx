import Link from "next/link";

import SiteHeader from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="shell space-y-6 py-6">
        <section className="panel hero-card grid items-center gap-6 overflow-hidden p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <p className="chip inline-flex border-white/30 bg-white/10 text-white">Materiaux de construction</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              Construire plus vite.
              <br />
              Construire mieux.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/85 md:text-base">
              Interface moderne et logique simple. Consultez les produits, passez des commandes et gerez tout clairement.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/products" className="btn btn-primary">
                Explorer les produits
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Contacter l equipe
              </Link>
            </div>
          </div>

          <div className="float rounded-2xl border border-white/20 bg-white/10 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70">Infos rapides</p>
            <div className="mt-4 grid gap-3">
              <div>
                <p className="font-display text-3xl font-bold">200+</p>
                <p className="text-sm text-white/80">Produits disponibles</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold">24/7</p>
                <p className="text-sm text-white/80">Suivi des commandes</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold">1 Panel</p>
                <p className="text-sm text-white/80">Gestion admin</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="metric-card">
            <p className="chip inline-flex">01</p>
            <h2 className="mt-3 font-display text-xl font-bold">Catalogue clair</h2>
            <p className="mt-2 text-sm text-[#5d5448]">Cartes simples, prix lisibles et ajout rapide au panier.</p>
          </article>
          <article className="metric-card">
            <p className="chip inline-flex">02</p>
            <h2 className="mt-3 font-display text-xl font-bold">Commande directe</h2>
            <p className="mt-2 text-sm text-[#5d5448]">Sans complexite: un petit formulaire et la commande est envoyee.</p>
          </article>
          <article className="metric-card">
            <p className="chip inline-flex">03</p>
            <h2 className="mt-3 font-display text-xl font-bold">Projets cle en main</h2>
            <p className="mt-2 text-sm text-[#5d5448]">En plus des materiaux, nous realisons aussi vos projets de construction.</p>
          </article>
        </section>
      </main>
    </>
  );
}
