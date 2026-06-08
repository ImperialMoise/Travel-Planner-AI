# L'Atelier Mobile Web

Version mobile web séparée de l'app desktop. Elle est volontairement simple : HTML, CSS et JavaScript statique, sans Expo, sans tunnel, sans QR code.

## Voir l'app

Après déploiement Vercel, ouvrir :

```txt
https://votre-url-vercel/mobile/
```

Pour tester localement dans un environnement en ligne ou un serveur statique :

```bash
python3 -m http.server 4173
```

Puis ouvrir :

```txt
/mobile/
```

## Écrans intégrés

- Accueil mobile depuis Stitch.
- Création de voyage / Nouvelle Aventure depuis Stitch.

## Workflow

1. Modifier `mobile/index.html`, `mobile/styles.css` ou `mobile/app.js` dans GitHub.
2. Committer.
3. Attendre Vercel.
4. Refresh `/mobile/` sur téléphone ou PC.
