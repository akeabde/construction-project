# Server (Express + MongoDB)

API backend de FIKHI CONSTRUCTION.

## Lancer en dev

```bash
npm run dev
```

## Lancer en mode normal

```bash
npm run start
```

## Variables d environnement

Copier `server/.env.example` vers `server/.env`, puis verifier:

```bash
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fikhi_construction
JWT_SECRET=change_me
ADMIN_EMAIL=admin@fikhi-construction.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Main Admin
CLIENT_URL=http://localhost:3000
```

## Test rapide

Health check:

`GET http://localhost:5000/api/health`
