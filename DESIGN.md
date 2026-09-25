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
- Première rangée : marque, accès à la bibliothèque, sélecteur portant le nom du voyage actif, modes Préparer/Voyager, compte.
- Distinguer Mes voyages (bibliothèque) de Changer de voyage (sélecteur), sans masquer la bibliothèque sur tablette.
- Modes en commande segmentée contrastée ; pages du voyage dans une rangée séparée, onglet actif souligné.
- Sans voyage : pas de modes ni d’onglets sans objet.
- Titre du voyage, dates, Partager et Gérer réutilisent les commandes existantes.
- Sur téléphone, réorganiser les rangées et faire défiler les onglets, sans supprimer de fonction.

## Itinéraire
- Ensemble fluide, plafond de confort 2 040 px ; ne pas étirer une étape sur toute la largeur d’un grand écran.
- Journées 190–280 px ; informations 260–360 px ; programme dans l’espace restant.
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
- Barre sous le titre du voyage, indépendante des informations nuit, repas et météo.
- « + Outils » à gauche : sélection multiple ; petit + après les raccourcis.
- Raccourcis surélevés au survol/focus, déplaçables par poignée ou flèches clavier ; croix pour désépingler sans effacer le contenu.
- Garder la clé locale fabrique_tool_shortcuts_v1 et l’ordre des favoris existants.
- Plusieurs fenêtres non modales simultanées, une par outil ; cliquer à nouveau ramène au premier plan.
- Idées & notes ouvre ses trois carnets dans leurs fenêtres respectives, sans éditeurs dupliqués.
- Aucune ouverture ne réduit, déplace ou masque la colonne des journées.
- Déplacement au pointeur et au clavier ; taille ajustable par les quatre coins et les quatre côtés.
- Commandes alternatives de position/taille ; rester dans la zone visible, y compris après changement de taille ou clavier virtuel.
- Réduire conserve le widget monté ; barre inférieure pour retrouver les fenêtres ; fermer retourne à un déclencheur.
- Changer de page garde les fenêtres ; changer de voyage ou de compte les ferme.
- Voyage et contexte du jour/de l’étape visibles, thèmes clair/sombre et focus conservés.
- Boutons de 44 px ; poignées de redimensionnement complétées par des commandes de taille accessibles.

## Carte
- Recherche et choix du jour dans une barre au-dessus du plan.
- Réglages cartographiques distincts des outils du voyage.
- Fiche du jour compacte : points localisés, notes réelles et accès à l’itinéraire.
- Aucun encart météo fictif ni date de démonstration pour un voyage non daté.
- Contrôles tactiles de 44 px, clair/sombre et défilement des petits écrans.
- Une seule définition de styles de carte ; pas de surcharges contradictoires dans styles.css.

## Budget, Documents et Bilan
- Même palette, typographie et commandes que l’itinéraire ; styles dans workspace-a.css.
- Budget : totaux prioritaires, dépenses modifiables et soldes conservés ; voyageurs dans une section dédiée.
- Documents : recherche/catégorie, liste et aperçu distincts ; les actions ne recouvrent pas le fichier. Résumé par groupes, pas de fausse chronologie.
- Bilan : quatre indicateurs majeurs, autres chiffres conservés en détail ; progression de dates explicitement distincte des activités réalisées.
- Ne pas modifier les calculs, opérations de stockage ni autorisations pendant ce lot.

## Voyager — web et APK
- Le web privilégie la préparation ; le carnet Voyager reste accessible.
- L’APK a un carnet dédié (mobile/journey.css), pas une réduction de l’éditeur.
- Au premier usage natif, ouvrir les voyages en Voyager ; conserver un choix Préparer déjà enregistré.
- Priorités : repère horaire, carte, billets, programme complet et nuit en cours.
- Aucun horaire ne vaut confirmation qu’une activité est réalisée. Mentionner l’heure de l’appareil.
- Étapes sans heure toujours visibles, nuits intermédiaires accessibles ; aucune mutation des données pour l’affichage.
- Préparer reste accessible sur téléphone ; mêmes gestionnaires de carte, documents et détails.
- Tester téléphone 320–430 px, tablette, paysage, clavier et zones système sur APK réelle.

## Suite
1. Valider navigation, outils multi-fenêtres et carte avec les données réelles.
2. Valider Budget, Documents et Bilan refondus.
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
