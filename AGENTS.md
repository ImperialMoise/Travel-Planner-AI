# Instructions permanentes pour Codex

## Règle prioritaire : ne jamais modifier les fichiers

Codex ne doit jamais modifier directement les fichiers du projet.

Pour chaque changement demandé, Codex doit toujours fournir :

1. Le chemin exact du fichier.
2. Le texte exact à chercher avec Ctrl + F.
3. Le bloc exact à remplacer.
4. Le nouveau bloc complet à coller.
5. Une explication simple du résultat.
6. Les étapes de test et de publication si nécessaires.

Cette règle s'applique aussi aux fichiers SQL, à la configuration Vercel et aux fonctions Supabase.

## Structure du projet

```txt
Travel-Planner-AI/
├── web/                         Application web publiée sur Vercel
│   ├── index.html               Charge les scripts dans leur ordre
│   ├── styles.css               Styles globaux
│   ├── app.js                   Point d'entrée
│   ├── lib/
│   │   ├── supabase.js          Authentification et accès aux données
│   │   └── state.js             Store React global
│   ├── ui/                      Composants interface
│   └── views/                   Vues de l'application
├── mobile/                      Version mobile, à traiter séparément
├── supabase/
│   ├── functions/               Edge Functions
│   ├── migrations/              Migrations SQL versionnées
│   └── config.toml              Configuration Supabase locale
└── AGENTS.md
```

## Application web

- La version web est dans `web/`.
- La production Vercel est déclenchée depuis la branche `main`.
- L'application utilise React chargé dans le navigateur.
- Les scripts dans `web/index.html` doivent rester dans le bon ordre.
- Avant de déplacer, supprimer ou renommer un fichier JavaScript ou JSX, vérifier ses balises `<script>` dans `web/index.html`.
- Ne pas modifier `mobile/` lors d'une demande concernant le web, sauf demande explicite.

## Supabase

- Projet Supabase : `kxxxwijywumqehjchjae`.
- Le schéma de référence est dans `supabase/migrations/20260727141854_initial_schema.sql`.
- Toute future modification de base de données doit être ajoutée dans une nouvelle migration SQL.
- Ne pas modifier la production directement dans SQL Editor, sauf correction urgente explicitement demandée.
- Ne jamais exposer de clé `service_role`, de clé secrète ou de mot de passe.
- Toujours conserver RLS activé sur les tables publiques.
- Toujours vérifier les règles RLS et tester les parcours concernés après une migration.

## Format obligatoire pour une modification

### Modification X

**Fichier :**

```txt
chemin/du/fichier.js
```

**Cherche avec Ctrl + F :**

```txt
texte exact existant
```

**Remplace ce bloc :**

```js
ancien code
```

**Par ce bloc :**

```js
nouveau code
```

**Explication :**

Explication simple, destinée à une personne qui apprend.

**Vérification :**

Étapes précises pour tester la modification.

## Workflow GitHub et Vercel

1. Faire une modification ciblée.
2. Tester localement ou sur Vercel.
3. Committer avec un message clair.
4. Pousser sur `main` seulement après vérification.
5. Vérifier que le déploiement Vercel est en état `READY`.

## Règles de qualité

- Préserver les fonctionnalités existantes.
- Éviter les refontes globales sans demande explicite.
- Préférer une modification petite, lisible et testable.
- Expliquer les impacts sur Supabase, Vercel ou les utilisateurs.
- Ne jamais supprimer de données, tables, fichiers ou règles sans avertissement clair et procédure de retour arrière.