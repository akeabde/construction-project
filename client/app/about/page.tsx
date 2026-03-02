import SiteHeader from "@/components/site-header";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell space-y-4 py-6">
        <section className="panel hero-card p-6 md:p-8">
          <p className="chip inline-flex border-white/30 bg-white/10 text-white">A propos de notre entreprise</p>
          <h1 className="mt-4 font-display text-4xl font-bold text-white">A propos de FIKHI CONSTRUCTION</h1>

          <div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-white/90">
            <p>
              FIKHI CONSTRUCTION est une entreprise specialisee dans la vente de materiaux de construction de haute
              qualite a Casablanca.
            </p>
            <p>
              Depuis notre creation, nous nous engageons a fournir aux professionnels et aux particuliers des produits
              fiables, durables et adaptes a tous types de projets de construction.
            </p>
            <p>
              En plus de la vente de materiaux, nous prenons egalement en charge la realisation de vos projets de
              construction. Que vous souhaitiez construire une maison, un local commercial ou tout autre batiment,
              notre equipe vous accompagne de l etude jusqu a la realisation.
            </p>
            <p>
              Notre objectif est d accompagner nos clients avec des produits de qualite, des prix competitifs et un
              service professionnel base sur la confiance et la satisfaction.
            </p>
            <p>Adresse : 293 Boulevard Abdelmoumen, Casablanca</p>
            <p>Chez FIKHI CONSTRUCTION, nous batissons la confiance avant de batir vos projets.</p>
          </div>
        </section>
      </main>
    </>
  );
}
