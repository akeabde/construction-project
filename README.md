# 🏗️ FIKHI CONSTRUCTION - Système de Gestion Intégré

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%26%20Nginx-0db7ed?style=for-the-badge&logo=docker)](https://www.docker.com/)

Bienvenue sur **FIKHI CONSTRUCTION**, une application Full-Stack complète pour la gestion de matériaux et de chantiers. Ce projet a été conçu pour allier **esthétique premium** et **simplicité de code extrême (Niveau 3/10)**.

---

## 🌟 Concept & Services

L'application offre une solution numérique aux défis de la construction moderne au Maroc :

- **📦 Catalogue Matériaux** : Consultation rapide des prix (Ciment, Acier, Outillage) avec calcul de panier.
- **🛒 Commande Directe** : Flux simplifié de l'ajout au panier jusqu'à la validation par le client.
- **🏗️ Demandes de Projets** : Module de soumission pour les grands travaux (Villas, Immeubles, Rénovations).
- **🛡️ Panel Administration** : Gestion centralisée des stocks, des factures et réponses aux clients.

---

## 🚀 Démarrage Instantané (Docker)

Grâce à Docker, l'environnement est prêt en 2 minutes sans aucune installation manuelle de base de données.

### 1. Lancer tout le projet
```bash
docker-compose up --build -d
```

### 2. Accès aux Services
- **Site Web (Client & Admin)** : [http://localhost](http://localhost)
- **API du Serveur** : `http://localhost:5000/api`

---

## 🔑 Identifiants de Test

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | *Défini dans docker-compose.yml* | *Défini dans docker-compose.yml* |
| **Client** | *À créer via Inscription* | *Libre* |

---

## 📁 Architecture du Projet

```text
├── client/          # Frontend Next.js (React + Tailwind)
├── server/          # Backend Node.js (Express + Mongoose)
├── nginx.conf       # Proxy Inverse (Routage automatique)
└── docker-compose.yml # Orchestration des conteneurs
```

---

## 👨‍💻 Pour le Développeur Junior

Ce projet est une excellente base d'apprentissage. Nous avons volontairement :
- Utilisé une **logique linéaire** (Lecture de haut en bas).
- Évité les abstractions trop complexes pour favoriser la compréhension.
- Ajouté des **commentaires détaillés en français** sur chaque fonction clé.

---

## 🛠️ Tech Stack
- **Frontend** : Next.js 14 (App Router), Tailwind CSS.
- **Backend** : Node.js, Express, JWT (Sécurité).
- **Base de données** : MongoDB via Mongoose.
- **Infrastructure** : Docker, Docker-compose, Nginx.

---

<p align="center">Réalisé avec ❤️ pour la communauté des développeurs marocains.</p>
