# CarbCycle — Guide de déploiement

## Stack
- React 18 (Create React App)
- Supabase (auth + base de données)
- Vercel (hébergement)

---

## Étape 1 — Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un nouveau projet
2. Dans l'onglet **SQL Editor**, colle et exécute le contenu de `supabase-schema.sql`
3. Dans **Project Settings → API**, copie :
   - `Project URL` → c'est ta `REACT_APP_SUPABASE_URL`
   - `anon public` key → c'est ta `REACT_APP_SUPABASE_ANON_KEY`
4. Dans **Authentication → Providers**, vérifie que **Email** est activé

---

## Étape 2 — Variables d'environnement

Copie `.env.example` en `.env.local` et remplis tes vraies valeurs :

```bash
cp .env.example .env.local
```

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
```

> **Important** : ne commite jamais `.env.local` sur GitHub (déjà dans `.gitignore`)

---

## Étape 3 — Tester en local

```bash
npm install
npm start
```

L'app tourne sur http://localhost:3000

---

## Étape 4 — Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit — CarbCycle app"
git remote add origin https://github.com/TON_USERNAME/carb-cycling-app.git
git push -u origin main
```

---

## Étape 5 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) et clique **New Project**
2. Importe ton dépôt GitHub `carb-cycling-app`
3. Dans **Environment Variables**, ajoute :
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Clique **Deploy** — c'est en ligne en ~2 minutes !

---

## Structure du projet

```
carb-cycling-app/
├── public/
│   └── index.html
├── src/
│   ├── hooks/
│   │   ├── useAuth.js       # Contexte d'authentification
│   │   └── useEntries.js    # CRUD des entrées Supabase
│   ├── lib/
│   │   └── supabase.js      # Client Supabase
│   ├── pages/
│   │   ├── Auth.js          # Page login / inscription
│   │   ├── Auth.css
│   │   ├── Dashboard.js     # App principale
│   │   └── Dashboard.css
│   ├── App.js               # Routing
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
├── supabase-schema.sql      # Schema à exécuter sur Supabase
├── vercel.json
└── package.json
```
