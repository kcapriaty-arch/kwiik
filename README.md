# KWIIK

KWIIK est une marketplace de services avec reservation en ligne.
Le projet contient une API NestJS/Prisma et une application React/Vite.

## Structure

- `backend/` : API NestJS, Prisma, authentification, prestataires, prestations, creneaux, reservations, avis et upload.
- `frontend/` : application React + Vite + TypeScript + Tailwind CSS.
- `backend/prisma/migrations/` : historique des migrations de base de donnees.

## Demarrage local

Ouvrir deux terminaux.

Backend :

```powershell
cd backend
npm install
npx prisma generate
npm run start:dev
```

Frontend :

```powershell
cd frontend
npm install
npm run dev
```

URLs locales :

- API : `http://localhost:3000`
- Frontend : `http://localhost:5173`

## Variables d'environnement

Copier `backend/.env.example` vers `backend/.env`, puis renseigner les valeurs.
Ne jamais commiter le fichier `.env`.

## Fichiers a ne pas versionner

Les dossiers suivants restent locaux :

- `node_modules/`
- `dist/`
- `backend/generated/`
- `backend/uploads/`
- `backend/uploads-prives/`
- les captures temporaires `/*.png`

## Verification avant push

Backend :

```powershell
cd backend
npm run build
```

Frontend :

```powershell
cd frontend
npx tsc -p tsconfig.app.json --noEmit
```

## Workflow Git conseille

1. Faire une petite modification claire.
2. Verifier le backend ou le frontend concerne.
3. Commiter avec un message court et explicite.
4. Pousser sur GitHub.
