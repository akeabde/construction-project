# 👷 FIKHI CONSTRUCTION - Full-Stack App

Ce projet est une solution complète de gestion pour les entreprises de construction, permettant de gérer le catalogue de produits, les commandes clients et les demandes de projets via une interface moderne et performante.

---

## 🌟 Concept & Services

L'application **FIKHI CONSTRUCTION** propose trois piliers de services :

1.  **Vente de Matériaux** : Un catalogue complet avec gestion des stocks en temps réel et panier d'achat.
2.  **Gestion de Commandes** : Un flux simplifié pour les clients et un tableau de bord complet pour l'administration.
3.  **Demandes de Projets** : Un module permettant aux clients de soumettre des demandes de devis ou de travaux personnalisés.

---

## 🏗️ Architecture du Projet (Docker & Nginx)

L'application utilise une architecture moderne avec des **Conteneurs Docker** et un **Reverse Proxy Nginx**.

1.  **Frontend (Next.js)** : Port `3000` (Interne). C'est l'interface visuelle.
2.  **Backend (Node/Express)** : Port `5000` (Interne). C'est l'API qui communique avec la base de données.
3.  **Base de données (MongoDB)** : Port `27017` (Interne). Stockage des données (Produits, Users).
4.  **Proxy (Nginx)** : Port **`80`** (Host). C'est la **porte d'entrée unique**. Elle redirige les requêtes vers le bon service.

---

## 🚀 Démarrage Rapide (Recommandé)

Grâce à Docker, vous n'avez pas besoin d'installer Node.js ou MongoDB localement. Une seule commande suffit :

1.  **Lancer tout le projet :**
    ```bash
    docker-compose up --build -d
    ```
2.  **Accéder à l'application :**
    - Ouvrez votre navigateur sur : [http://localhost](http://localhost) (le port 80 est automatique).

---

## 🌍 Partage en Ligne (Ngrok)

Pour montrer votre travail à un professeur ou un client via un lien public :

1.  Installez Ngrok et configurez votre jeton (auth token).
2.  Lancez le tunnel sur le port **80** (le port de Nginx) :
    ```bash
    ngrok http 80
    ```
3.  Partagez le lien `https://...` généré. Le frontend et le backend fonctionneront ensemble sur ce seul lien.

---

## 🔑 Accès Administrateur

Par sécurité, les identifiants ne sont pas écrits en clair ici. Vous pouvez les retrouver ou les modifier dans le fichier `docker-compose.yml` (sous la section `environment` du service `server`).

- **ADMIN_EMAIL** : Votre email admin.
- **ADMIN_PASSWORD** : Votre mot de passe admin.

---

## 📁 Structure des Dossiers

- `/client` : Tout le code de l'interface (Next.js).
- `/server` : Tout le code de l'API (Express + Mongoose).
- `docker-compose.yml` : Configuration de l'orchestration des services.
- `nginx.conf` : Configuration du routage (Proxy).

---

## 👨‍💻 Note pour le Développeur

Le code source est structuré de manière propre et **entièrement documenté en français** pour faciliter la maintenance et les évolutions futures.
