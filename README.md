# Travel Planner AI

Application de planification de voyages avec itinéraire, carte, budget, documents et partage entre voyageurs.

## Versions du projet

- `web/` : application web publiée sur Vercel.
- `mobile/` : version mobile, développée séparément.
- `supabase/` : fonctions serveur, migrations et configuration de la base de données.

## Technologies

- React côté navigateur, avec JSX compilé avant le déploiement
- Supabase pour l'authentification, la base de données, le stockage et les fonctions serveur
- Vercel pour le déploiement
- MapLibre pour la carte

## Structure

```txt
web/
  index.html        Chargement des scripts
  styles.css        Styles globaux
  app.js            Point d'entrée
  lib/              Données, authentification et état global
  ui/               Composants interface
  views/            Écrans de l'application

supabase/
  functions/        Edge Functions
  migrations/       Évolution versionnée du schéma de base de données
  config.toml       Configuration Supabase locale
```

## Développement web

La version web est compilée avant publication.

```bash
cd web
npm install
npm run build
```

Le résultat est créé dans `web/dist/`.

Pour tester exactement cette version localement :

```bash
npx serve dist
```

Ne modifie pas l'ordre des scripts dans `web/index.html` sans vérifier leurs dépendances.

## Base de données

Le schéma de référence actuel est :

```txt
supabase/migrations/20260727141854_initial_schema.sql
```

Pour toute future modification de la base :

1. Créer une migration avec `npx supabase migration new nom_de_la_modification`.
2. Ajouter le SQL dans le nouveau fichier.
3. Vérifier la migration localement.
4. Committer le fichier.
5. L'appliquer sur Supabase seulement après vérification.

Ne pas mettre de données de production, mots de passe ou clés secrètes dans GitHub.

## Déploiement

La branche `main` déclenche le déploiement de la version web sur Vercel.

Après chaque modification publiée, vérifier que le dernier déploiement Vercel est en état `READY`.

## Documentation interne

Les règles de collaboration avec Codex sont dans `AGENTS.md`.