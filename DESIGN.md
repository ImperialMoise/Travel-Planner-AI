# Référence de design — La Fabrique à Voyages

## Référence obligatoire
Maquette A « espace de préparation ». Reprendre sa structure et ses proportions.
Ne pas réinterpréter A comme un habillage des anciens composants.
B peut inspirer les détails de réservation, jamais transformer la timeline en cartes.

## Espace connecté
- En-tête sur deux niveaux : marque, voyages et profil ; puis onglets et Préparer/Voyager.
- Bandeau du voyage : titre, dates, Partager et Gérer le voyage.
- Navigation et bandeau du voyage partagent le même fond et les mêmes alignements ; éviter trois barres de couleurs empilées.
- Nom du voyage affiché en titre ; sélection explicite « Changer de voyage » en haut, disponible aussi sur petit écran.
- Préparer/Voyager sont les deux états d’un même sélecteur ; paramètres, Focus et profil restent accessibles.
- Sur téléphone : marque et compte, puis Voyages et modes sur une ligne, puis onglets défilables.
- Itinéraire à trois colonnes : journées, programme, outils et informations.
- Programme sans cartes encadrées : heure, ligne verticale, catégorie, titre sans empattements, note et lieu.
- Actions Modifier, Carte, Document et Étape clé dans le détail dépliable de l’étape.
- Pas de bannière photo dans le programme. Photo et recadrage dans Options de la journée.
- Outils à droite : Idées & notes, Checklist, Imprimer/PDF, Tous les outils.
- Hébergement, repas et météo lisibles sans ouvrir une carte.
- Les réservations détaillées conservent leurs commandes existantes.

## Styles
- Les classes fv-* et web/workspace-a.css pilotent cette nouvelle interface.
- Ne pas ajouter de règles workspace-redesign ou rétablir les anciennes cartes.
- Blanc cassé / vert forêt, et charbon en thème sombre.
- Conserver les accents personnalisés des voyages.
- Titres de page à empattements ; commandes, étapes et texte courant sans empattements.
- Zones tactiles suffisantes, focus visible, contraste et mouvements réduits.
- Sur petit écran : sélection du jour, programme puis informations ; onglets accessibles.
- Conserver le mode Focus et le mode Voyager.

## Conservation fonctionnelle
Ne pas modifier les données, API, authentification, règles d’accès ou sauvegardes pour cette refonte.
Réutiliser les gestionnaires existants ; toute commande déplacée doit rester accessible.
La colonne de jours utilise l’organisateur existant pour notes et déplacements.
Les séjours restent calculés sur toutes leurs nuits, avec détails du départ.
APK séparée du web.

## Nettoyage
Supprimer les anciens blocs de rendu et leurs surcharges quand ils sont remplacés.
styles.css contient encore des bases et des règles de vues non migrées :
ne pas le supprimer globalement avant migration et vérification de leurs usages.
Ne pas empiler une nouvelle couche de correctifs sur les anciens composants.

## Reste à harmoniser
Bibliothèque de voyages, Carte, Budget, Documents, Bilan, Voyager et fenêtres secondaires.
Ne pas annoncer toute l’application refaite après le seul Itinéraire.

## Validation
Comparer à A à largeur et thème identiques.
Vérifier 360, 390, 430, 900 et 1440 px, en clair et sombre.
Journée remplie, vide, longue note, long titre, hébergements intermédiaires et départ.
Tester clavier, outils, éditeurs, déplacements, sauvegarde, partage, duplication et impression.
Une analyse syntaxique ou un rendu React hors navigateur ne remplace pas le test visuel et interactif.

## Réglages validés après l’audit de septembre 2026
- Grille commune au bandeau et à l’espace connecté : largeur fluide, plafond de confort 1 760 px pour l’ensemble des trois colonnes, pas un programme isolé au milieu d’une page étirée.
- Journées 220–250 px, informations 300–340 px ; programme dans l’espace restant avec 24–32 px de marge intérieure.
- Conserver DM Sans et DM Serif Display ; travailler l’échelle typographique avant d’ajouter des polices.
- Titre du voyage 30–36 px, titre de journée 28–32 px, étapes 17–18 px, texte courant 15–16 px, informations secondaires 13–14 px.
- Action principale Ajouter une étape clairement contrastée ; Ajout rapide adjacent et secondaire. Les deux parcours restent disponibles.
- Diagnostics discrets et actionnables ; ambre pour conflits ou enchaînements serrés, pas pour toute donnée manquante.
- Heure manquante : Horaire à préciser, jamais Libre par défaut.
- Nuit datée, compteur pour les séjours de plusieurs nuits seulement, détails internes sans flèche de lien externe.
- Pas de conseil météo mensuel générique présenté comme une prévision locale. Lieu, date et état d’indisponibilité explicites.
- Les contrôles de syntaxe et rendus hors navigateur ne constituent pas une validation visuelle.