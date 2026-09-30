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
- Photo discrète à côté du titre : photo existante de la journée en priorité, sinon photo du voyage explicitement légendée. Jamais de grande bannière ni de texte sur l’image.
- Crédit du photographe conservé ; image absente/en erreur masquée ; réglage et recadrage dans la fenêtre existante.
- Favoris dans le bandeau du voyage ; à droite, séjour mis en évidence, repas et météo secondaires.
- Nuit datée, compteur si plusieurs nuits ; aucun faux conseil météo présenté comme prévision.
- Météo : recherche de ville avec choix du pays/région, état de recherche explicite. Villes communes à tous les jours du voyage, avec flèches et date du jour sélectionné ; liste mémorisée dans l’onglet sans modifier l’itinéraire. Limites des prévisions et échecs réseau visibles.
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
- Budget : Dépenses par défaut, Soldes (qui rembourse qui), Analyse puis Voyageurs. Total compact ; largeur de lecture maîtrisée ; liste recherchable, payeur et montant visibles.
- Calculs et données conservés. Les remboursements affichés sont des propositions, pas des virements effectués.
- Documents : Résumé par défaut, Détail ensuite ; catégories personnalisées saisies sous Autres, conservées avec les nouveaux fichiers dans le champ category existant.
- Tous les groupes, y compris personnalisés, restent visibles dans le résumé et les filtres. Aucun reclassement automatique des anciens documents.
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

## Fenêtres et formulaires
- Cadre commun dans workspace-a.css pour les portails : palette claire/sombre, titres DM Sans, labels lisibles, champs de 48 px.
- Connexion : largeur 520 px ; création de voyage et éditeur d’étape : jusqu’à 760 px.
- Titre/fermeture et actions de l’éditeur restent visibles ; seul le corps défile.
- Téléphone : feuille adaptée à la hauteur disponible, marges système et champs sur une colonne dans l’éditeur.
- Focus clavier conservé pendant la saisie ; Échap ne ferme que la fenêtre concernée ; pas de fermeture pendant une soumission.
- Sauvegarde, suppression, déplacement d’étape et validation restent inchangés.
- Les paramètres et le profil gardent leur lot spécifique ; ne pas annoncer leur refonte sur cette base.

## Lot carnet mobile — septembre 2026
- Activités en carrousel tactile, commandes précédent/suivant et compteur ; repas séparés en dessous, nuits calculées sur tous les jours du séjour.
- Appui sur nom, heure, durée, lieu, note et informations du séjour : édition sur place avec Enregistrer/Annuler ; aucune navigation vers un autre écran pour ces champs.
- Ne pas remplacer une étape par un objet partiel : conserver son id, son jour source, ses références, dates, coordonnées et montants non modifiés.
- Une adresse modifiée manuellement n’est pas automatiquement géocodée : retirer les anciennes coordonnées pour éviter un faux point.
- Ajouter un hébergement/repas directement dans son bloc. Ne pas recopier un séjour sur ses nuits intermédiaires.
- Carte, billets et budget restent accessibles par la navigation basse ; retirer les gros raccourcis redondants du carnet.
- Titres blancs sur couverture verte en clair comme en sombre.
- Android : appliquer les marges réelles des barres système, découpes et clavier au conteneur natif ; ne pas cumuler ces marges avec celles de la WebView.
- Menu de voyages défilable, en-tête accessible, palette verte ; ne pas présenter cette correction comme une refonte de toutes les pages personnelles.
- Météo PC : villes communes au voyage, ajout/retrait et flèches ; date liée au jour sélectionné. Préférences limitées à l’onglet, pas de synchronisation entre appareils.

## Roadmap consolidée — décisions du 29 septembre 2026
Les nouveautés ci-dessous ne sont pas toutes implémentées. Le PC reste le planificateur ; l’APK devient un compagnon de voyage, pas un éditeur PC miniaturisé.

### 1. Gestes et carrousels — livré, validation APK en cours
- Swipe sur le bandeau de journée : vers la gauche = jour suivant, vers la droite = précédent ; pas de boucle entre premier et dernier jour.
- Sélecteur de journée et chevrons cliquables conservés comme alternatives accessibles.
- Complément à valider : compteur au-dessus du sélecteur, champ et flèches alignés ; chevrons intégrés au bandeau du jour.
- Changement de journée animé dans le sens de navigation, sans animation si réduction des mouvements activée.
- Distribution APK : lien anti-cache commun au bandeau mobile, à l’accueil et au QR code ; vérifier la version installée après téléchargement. Ne pas confondre téléchargement, installation et mise à jour du site.
- Swipe dans le carrousel d’activités indépendant : il ne change jamais le jour et ne bloque pas le défilement vertical.
- Retirer la rangée de flèches au-dessus des activités et les phrases « Glisse pour voir la suite » / « Touche un texte pour le modifier ».
- Chevrons cliquables superposés aux cartes, aperçu de la suivante et compteur discret ; aucun défilement automatique.
- Ne pas capter les gestes Android de bord d’écran ; privilégier le défilement vertical lorsqu’un geste est vertical.
- Protéger les saisies en cours avant de changer de jour. Tester tactile réel, clavier, lecteur d’écran, paysage et réduction des animations.

### 2. Édition verrouillable et adresses — en cours
- Édition crayon puis ✓/× livrée ; conserver le dessin des cartes et les séparateurs de champs, sans texte Lecture/Annulé/Enregistré ni bordure latérale en édition. Erreurs utiles et labels accessibles conservés.
- Lot adresses proposé : suggestions dans le carnet à l’ajout d’un hébergement/repas et à l’édition du lieu de chaque carte. Adresse + coordonnées seulement après sélection ; saisie manuelle conservée, résultats obsolètes ignorés. À valider sur APK.
- Prochaine étape après validation : espace Organiser adapté au mobile, puis pages personnelles et harmonisation des autres vues.
- Audit du lot précédent : transition actuelle = glissement d’entrée, pas suivi du doigt ; anti-cache = précaution, pas preuve de la cause d’une ancienne APK.
Cette décision remplace l’édition champ par champ décrite dans le lot précédent.
- Une carte est verrouillée par défaut. Un crayon active le mode édition.
- Toucher nom, heure, durée, lieu ou note permet l’édition au même endroit ; toucher ailleurs ferme le champ sans enregistrer le brouillon sur le serveur.
- Un seul ✓ en haut de la carte enregistre l’ensemble ; × annule tout le brouillon. Aucun Enregistrer/Annuler sous chaque champ.
- Relocker après succès ou annulation ; conserver la saisie et une erreur explicite en cas d’échec.
- Prévenir les pertes de brouillon en changeant de carte, de jour, de page ou en revenant en arrière.
- Même fonctionnement pour activités, hébergements et repas ; préserver les identifiants, champs non modifiés et jour source des séjours intermédiaires.
- Autocomplétion à l’ajout et à l’édition des adresses d’hébergement, restaurant et activité. Suggestions ville/pays ; sélection = adresse + coordonnées.
- Saisie manuelle toujours possible ; pas d’anciennes coordonnées après changement d’adresse non géocodé.

### 3. Préparation Android simplifiée — premier lot proposé
- Organiser : programme compact dépliable, édition crayon/✓/×, ajout activité/transport et ajout direct repas/hébergement ; réordonnancement réutilisé, séjours intermédiaires rattachés au jour source.
- L’ancienne préparation reste accessible via Préparation avancée. Les formulaires complets et les pages personnelles restent à harmoniser ; recette APK réelle requise.
- Remplacer l’accès à la préparation complexe par un espace « Organiser » propre au mobile.
- Ajouter et modifier les étapes, réordonner le programme, gérer journées, nuits et repas dans des parcours courts.
- Planification avancée privilégiée sur ordinateur, accès à la version PC conservé.
- Ne pas supprimer les fonctions de préparation avant qu’un remplacement utilisable soit prêt ; conserver les préférences de mode existantes.

### 4. Pages personnelles et DA verte — à réaliser
- Refaire accueil, liste Mes voyages, gestion des voyages, partage, compte et paramètres.
- Garder En cours / À venir / Dates à définir / Terminés / Archivés, recherche, couvertures, duplication et archivage.
- Préserver invitations, rôles et gestion des membres ; conserver les paramètres, rappels et journaux.
- Même DA forêt, clair/sombre, champs lisibles et commandes tactiles ; la correction du menu n’est pas une refonte de toutes ces pages.

### 5. Pages du voyage sur APK — à réaliser
- Harmoniser carte, budget, documents et bilan avec cette DA et des compositions mobiles dédiées.
- Conserver navigation basse, recherche et réglages de carte ; budget partagé, payeurs, soldes/remboursements ; résumé des documents et catégories libres.
- Garder les outils utiles accessibles sans encombrer le carnet ni multiplier les pages.

### 6. Identité visuelle — à réaliser
- Valider le logo « V / chemin », puis décliner SVG, favicon, icônes et ressources Android adaptatives. Proposition existante, pas encore intégrée.

### 7. Recette complète — obligatoire
- PC : vérifier navigation, outils épinglés/déplaçables, fenêtres simultanées/redimensionnables, carte, photos, météo multi-villes, budget, documents, bilan, export/impression.
- APK : contrôler carnet, première/dernière journée, activités sans heure, nuits intermédiaires, repas, clavier, marges Android, petits/grands écrans, paysage, clair/sombre.
- Vérifier sauvegarde, droits lecture seule, synchronisation PC/APK, duplication, partage, reprise de voyage, réseau interrompu et hors ligne.
- Tester interface vide/remplie, longs textes, focus, lecteur d’écran et zoom.
- Vérifier les builds web ET Android. Le cache web respecte le format la-fabrique-static-v suivi uniquement de chiffres.
- Tests simulés ≠ validation d’une APK réelle. Une APK installée ne se met pas à jour avec Vercel : installer la nouvelle version signée sans effacer les données.

### 8. Publication
- Vitrine publique : chantier distinct, à vérifier avant publication.
- Play Store : chantier distinct, reporté jusqu’à validation des parcours essentiels.

## Validation
Contrôler journées remplie, légère et vide ; séjours intermédiaires/départs ; longs titres et notes.
Contrôler bibliothèque vide, filtrée, archivage, couverture absente ou en erreur.
Comparer 360, 390, 430, 900 et 1440 px en clair/sombre ; vérifier aussi zoom 200 % et fenêtre peu haute.
Tester clavier, focus, fenêtres, commandes et sauvegardes, partage, duplication et impression.
Une analyse syntaxique et un rendu React hors navigateur ne remplacent pas les tests visuels et interactifs.

