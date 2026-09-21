# Référence de design — La Fabrique à Voyages

## Direction validée
Maquette A « espace de préparation » comme référence structurelle.
Maquette B uniquement pour les cartes et la présentation des réservations.
Ne pas revenir à une navigation générale verticale sur ordinateur.

## Structure obligatoire
- Pages du voyage dans la navigation du haut.
- Journées dans une colonne de gauche sur ordinateur.
- Programme central de largeur maîtrisée.
- Outils nommés et directement accessibles à droite, avec les informations du jour.
- Couverture de journée facultative et compacte.
- Sur petit écran, replier les panneaux sans perdre leurs fonctions.
- Préserver le mode Focus et le mode Voyager.

## Apparence
- Blanc cassé et vert forêt par défaut ; accents personnalisés conservés.
- Thème sombre charbon, textes clairs et contrastes adaptés.
- Titres à empattements, commandes et texte courant sans empattements.
- Boutons tactiles de 44 px minimum, hiérarchie simple et cartes sobres.
- Les règles de la structure A sont centralisées dans web/workspace-a.css.
- L’ancienne classe workspace-redesign ne doit plus piloter cette structure.

## Fonctionnement
- Réutiliser les composants, états, gestionnaires et API existants.
- Ne pas réécrire l’authentification, les sauvegardes ou les règles métier.
- Chaque commande déplacée doit rester accessible.
- Aucun changement de données ni nouvelle fonctionnalité pour cette refonte.
- APK séparée du site web.

## Lots
1. Structure A, cartes de B, raccourcis des outils et thèmes clair/sombre.
2. Harmonisation des voyages, carte, budget, documents, bilan et profil.
3. Validation visuelle et fonctionnelle, puis nettoyage des anciens styles inactifs.

## Validation
Ordinateur et mobiles 360, 390 et 430 px ; thèmes clair et sombre.
Voyage rempli, journée vide, titre long, couverture présente ou absente.
Navigation clavier, fenêtres, outils, organisation des jours et étapes.
Connexion, chargement, sauvegarde, partage, duplication et impression.
Ne jamais confondre syntaxe valide, build réussi et parcours réellement vérifié.