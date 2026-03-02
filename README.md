# FIKHI CONSTRUCTION

Projet full-stack simple pour l apprentissage:
- `client/`: frontend Next.js
- `server/`: API Express + MongoDB

## Dossiers principaux

- `client/`: tout le code frontend.
- `client/app/`: pages de l application.
- `client/components/`: composants reutilisables.
- `client/lib/`: fonctions utilitaires (API, session, types).
- `server/`: tout le code backend.
- `server/src/routes/`: endpoints API (`/auth`, `/products`, `/orders`, ...).
- `server/src/models/`: modeles MongoDB.
- `server/src/middleware/`: middlewares d authentification et roles.
- `server/src/config/`: connexion base de donnees et creation admin.

## Connexion frontend <-> backend

1. Le frontend appelle `apiRequest()` dans `client/lib/api.ts`.
2. `apiRequest()` envoie des requetes HTTP vers `NEXT_PUBLIC_API_URL`.
3. Le backend recoit les requetes dans `server/src/routes/`.
4. Les routes utilisent les modeles MongoDB pour lire/ecrire les donnees.
5. Le backend renvoie du JSON au frontend.
6. Pour les routes protegees, le token JWT est envoye dans `Authorization: Bearer <token>`.

## Demarrage rapide

1. Verifier que MongoDB tourne sur `mongodb://127.0.0.1:27017`.
2. Terminal 1:
```bash
npm run dev:server
```
3. Terminal 2:
```bash
npm run dev:client
```
4. Ouvrir `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev:server
npm run dev:client
npm run start:server
npm run lint:client
npm run build:client
```
