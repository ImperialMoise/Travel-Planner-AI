# L'Atelier Mobile

Application mobile Expo / React Native séparée de la version web.

## Écran intégré

- `src/screens/HomeScreen.js` convertit l'écran Stitch **Accueil** fourni en HTML/Tailwind.
- Les composants sont découpés dans `src/components/` pour pouvoir brancher ensuite les données Supabase.

## Tester avec Expo Go

Depuis un environnement en ligne comme GitHub Codespaces :

```bash
cd mobile
npm install
npm run start:tunnel
```

Ensuite, scanner le QR code avec Expo Go sur le téléphone. Le mode `tunnel` est recommandé depuis GitHub Codespaces, car le téléphone n'est généralement pas sur le même réseau local que le serveur Expo lancé dans le cloud.

Si Expo Go garde une ancienne erreur en cache, relancer avec :

```bash
npm run start:clear
```

## Dépannage Expo Go

### Erreur `"main" has not been registered`

L'application utilise `registerRootComponent(App)` dans `App.js` pour enregistrer explicitement le composant racine quand Expo lance le projet depuis Codespaces. Après une mise à jour de ce fichier, relancer Expo avec le cache vidé :

```bash
npx expo start --tunnel --clear
```

### Erreur React Native DevTools `libatk-1.0.so.0`

Cette erreur vient d'une bibliothèque graphique absente dans Codespaces. Elle concerne l'installation des DevTools, pas le rendu de l'app dans Expo Go. Le QR code peut quand même fonctionner.

## Notes de conversion Stitch → React Native

- Les classes Tailwind ont été converties en `StyleSheet` React Native.
- Les couleurs, espacements, rayons et ombres du design Stitch sont centralisés dans `src/theme/tokens.js`.
- Les images Google temporaires de Stitch ont été remplacées par des URLs Unsplash stables pour éviter les liens générés difficiles à maintenir.
