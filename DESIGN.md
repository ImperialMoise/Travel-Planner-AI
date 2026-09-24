# Référence de design — La Fabrique à Voyages

## Direction validée
Refonte moderne autorisée en septembre 2026 : garder les fonctions, repenser leurs composants visuels.
La maquette A n’est plus une contrainte à reproduire littéralement : sa structure reste utile, mais doit fonctionner avec les données réelles.
Distinguer une vitrine expressive d’un espace de préparation calme et précis.
Les références Airbnb, Apple et Nike inspirent la hiérarchie, pas une copie de leurs pages commerciales dans l’éditeur.

## Système commun
- web/workspace-a.css est la source des styles du cadre connecté, de l’itinéraire et de Mes voyages.
- Ne pas réinjecter un thème indépendant dans TripLibrary.js.
- DM Sans pour les titres d’écrans, journées, étapes, commandes et formulaires ; DM Serif Display pour la marque et les éventuels éléments éditoriaux.
- Surfaces blanches, fond gris légèrement chaud, texte anthracite ; vert forêt pour les actions principales.
- Thème sombre dédié : fond, surfaces, contours et texte secondaire distincts.
- Les accents personnalisés restent sur la sélection du jour et les repères de timeline. Les commandes et le focus gardent un contraste stable.
- Boutons d’au moins 44 px de haut ; rayons 10–12 px, panneaux 16 px.
- Pas de cartes encadrées autour de chaque étape. Le programme est une surface cohérente avec des lignes interactives.

## Navigation
- Un même en-tête pour Mes voyages et l’espace de préparation.
- Avec un voyage ouvert : onglets et modes Préparer/Voyager disponibles.
- Sans voyage : ne pas afficher des onglets ou un mode Focus sans objet.
- Changement de voyage disponible à toutes les largeurs ; nom complet accessible.
- Titre du voyage, dates, Partager, Gérer et Outils réutilisent les commandes existantes.
- En petit écran, navigation et modes se réorganisent sans masquer les fonctions.

## Itinéraire
- Ensemble fluide, plafond de confort 1 560 px ; ne pas étirer une étape sur toute la largeur d’un grand écran.
- Journées 190–216 px ; informations 260–288 px ; programme dans l’espace restant.
- Liste des jours compacte, numéro identifiable et titre non tronqué.
- Panneau central de hauteur liée au contenu, dans une zone défilable ; ne pas remplir un écran vide par du faux contenu.
- Titres de journée sans empattements, texte de 15–16 px, métadonnées 12–14 px.
- Chaque étape est une ligne ouvrable au clavier et au toucher ; le mot Détails apparaît sur bureau.
- Actions Modifier, Carte, Document et Étape clé dans le détail existant.
- Numéro du jour, date et ville puis titre ; section Programme séparée des commandes de la journée.
- Journée vide : état dessiné avec une explication et les actions de création existantes.
- Pas de grande bannière photo : photo et recadrage restent dans les options de la journée.
- Favoris dans le bandeau du voyage ; à droite, séjour mis en évidence, repas et météo secondaires.
- Nuit datée, compteur si plusieurs nuits ; aucun faux conseil météo présenté comme prévision.
- En petit écran : sélecteur de jour, programme, outils et informations dans un défilement naturel.
- Conserver Focus et les modes de réorganisation existants.

## Mes voyages
- Recherche et filtre clairement associés à la bibliothèque.
- En cours, À venir, Dates à définir, Terminés et Archivés conservés.
- Couvertures existantes ouvrables ; initiale de remplacement lorsqu’il n’y a pas de photo.
- Aucun visuel aléatoire présenté comme une destination réelle.
- Voyages à préparer en grille ; terminés/archivés en lignes compactes.
- Nom et dates toujours lisibles ; gestion, duplication et archivage disponibles.
- État vide et absence de résultat distincts ; réinitialisation des filtres disponible.
- Même palette, composants, thème sombre et focus que l’itinéraire.

## Conservation fonctionnelle
Ne pas modifier API, authentification, droits, données ni sauvegardes pour cette refonte.
Réutiliser les gestionnaires existants, y compris classement des jours et étapes, création, édition, duplication, archivage, partage, réservations, export et impression.
Ne jamais supprimer une commande sous prétexte de simplifier son affichage.
Ne pas inventer des statistiques pour remplir un écran.
APK séparée du web.

## Nettoyage
Remplacer les styles et rendus concernés, pas ajouter une nouvelle couche de correctifs.
Retirer les anciens composants locaux inutilisés quand leur absence d’usage est établie.
styles.css reste nécessaire pour les vues et composants pas encore migrés : ne pas le supprimer globalement sans inventorier leurs usages.
Ne pas annoncer toutes les pages refaites après le seul cadre connecté.

## Outils
- Les favoris sont dans une barre sous le titre du voyage, sur toutes ses pages.
- La colonne droite contient uniquement les informations du jour : nuit, repas et météo.
- Personnaliser ouvre un menu compact pour épingler, désépingler et ordonner les raccourcis.
- Aucun écran Tous les outils : chaque widget s’ouvre directement.
- Conserver les préférences locales et tous les contenus des widgets.
- Sur ordinateur, une seule fenêtre flottante non modale ; son ouverture ne change aucune colonne.
- Fenêtre déplaçable au pointeur, au clavier et par boutons de placement.
- Réduire conserve le widget monté ; fermer revient au déclencheur.
- Garder la fenêtre dans la zone visible après redimensionnement.
- Sur téléphone, panneau flottant adapté à la zone visible et au clavier virtuel.
- Afficher le voyage et le contexte du jour ou de l’étape.
- Clair/sombre, focus visible et commandes d’au moins 44 px.

## Suite
1. Valider barre d’outils et fenêtre flottante avec les données réelles.
2. Harmoniser Carte, Budget, Documents et Bilan.
3. Harmoniser Voyager, formulaires, fenêtres secondaires et paramètres.
4. Vérifier les parcours, le responsive, les deux thèmes et l’accessibilité.
La vitrine publique et l’APK restent des lots distincts.
La publication Play Store reste reportée.

## Validation
Contrôler journées remplie, légère et vide ; séjours intermédiaires/départs ; longs titres et notes.
Contrôler bibliothèque vide, filtrée, archivage, couverture absente ou en erreur.
Comparer 360, 390, 430, 900 et 1440 px en clair/sombre ; vérifier aussi zoom 200 % et fenêtre peu haute.
Tester clavier, focus, fenêtres, commandes et sauvegardes, partage, duplication et impression.
Une analyse syntaxique et un rendu React hors navigateur ne remplacent pas les tests visuels et interactifs.

