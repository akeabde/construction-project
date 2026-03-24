# 🖥️ FIKHI CONSTRUCTION - Interface Client

Ce répertoire contient le **Frontend** de l'application, développé avec **Next.js 14**. L'interface est optimisée pour être rapide, responsive et facile à maintenir.

---

## 🛠️ Développement Local

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration (`.env.local`)
Créez un fichier `.env.local` et ajoutez l'URL de l'API :
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Lancer le serveur de test
```bash
npm run dev
```
L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🚀 Scripts Disponibles

- `npm run dev` : Lance le projet en mode développement.
- `npm run build` : Compile le projet pour la production.
- `npm run start` : Lance la version compilée.
- `npm run lint` : Vérifie la qualité du code.

---

## 🎨 Technologies Utilisées
- **Framework** : Next.js 14 (App Router).
- **Styling** : Tailwind CSS (Vanilla).
- **Icons** : Lucide React.
- **State Management** : React Hooks (useState/useEffect).
