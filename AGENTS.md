# Instructions permanentes pour l'agent

## Règle prioritaire : ne pas modifier les fichiers sans autorisation explicite

Par défaut, l'agent ne doit PAS modifier directement les fichiers du projet.

L'agent doit d'abord fournir les instructions sous forme de navigation chirurgicale :

1. Indiquer le nom exact du fichier à modifier.
2. Donner le texte exact à chercher avec Ctrl + F.
3. Donner le bloc de code à sélectionner/remplacer.
4. Donner le bloc de code de remplacement à coller.
5. Expliquer simplement ce que fait la modification, comme à un débutant.

L'agent ne peut appliquer les modifications lui-même que si l'utilisateur écrit explicitement une phrase du type :

- "Applique les modifications"
- "Vas-y, modifie les fichiers"
- "Fais-le toi-même"
- "Tu peux modifier le code"

Sans cette autorisation explicite, l'agent doit uniquement donner les instructions et ne pas éditer les fichiers.

## Format obligatoire pour chaque proposition de modification

Pour chaque changement, répondre dans ce format :

### Modification X

**Fichier :**

```txt
chemin/du/fichier.js
