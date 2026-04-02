# PomoFriends Fullstack (React + Node + Firebase)
npx plugins add vercel/vercel-plugin
A special web site for my friends to study together heh.

Projet complet from scratch:
- Frontend React (Vite)
- Backend Node.js (Express)
- Base de donnees Firebase Firestore (realtime)

## Fonctionnalites

- Page 1: setup + nom utilisateur + cles Firebase
- Creation automatique de room ou join via lien
- Page 2: Pomodoro en room
- Presence des amis en temps reel dans la room
- Etat d'avancement (phase, timer, tache active)
- 1 cycle focus termine = +1 point

## Structure

- client: app React
- server: API Node + serveur static pour build frontend

## Installation

```bash
npm install
```

## Lancer en dev

```bash
npm run dev
```

- React: http://localhost:5173
- Node: http://localhost:8787

## Setup Firebase

1. Creer un projet Firebase.
2. Activer Firestore Database.
3. Copier les valeurs config web Firebase:
- apiKey
- authDomain
- projectId
- appId
4. Appliquer les regles Firestore de `firebase.rules`.

Regles rapides de dev (ouvertes) deja fournies dans `firebase.rules`.

## Utilisation

1. Ouvrir `/`.
2. Entrer nom + cles Firebase.
3. Sans room dans URL: une room est creee.
4. Avec `?room=room-xxxxxx`: join de la room existante.
5. Une fois dans la room, partager le lien.

## Build et production

```bash
npm run build
npm run start
```

Le serveur Node servira `client/dist`.

## Notes

- Presence online detectee par `updatedAt` (heartbeat ~5s).
- Membre considere en ligne si update recemment (<45s).
- Pour un environnement prod, securiser les regles Firestore.
