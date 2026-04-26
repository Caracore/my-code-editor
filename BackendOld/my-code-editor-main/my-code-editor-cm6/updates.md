# MISE A JOUR:

- Chaque fichier a une instance maintenant.
- drag and drop fonctionnel
- -cursor animated "vscode expand" created is not perfect but work.
- Command palette ajouter.
- discord rich presence completed just change image for each language...
- LSP Toggle: Activer/Désactiver le LSP via Command Palette (Ctrl+Shift+P → "Toggle LSP")
- LSP Status: Vérifier si les serveurs LSP sont installés (Ctrl+Shift+P → "Check LSP Status")
- TodoList réduit: Le bloc-notes prend maintenant 280px au lieu de toute la largeur
- Focus automatique: L'éditeur CodeMirror reçoit le focus automatiquement quand un fichier est ouvert

# BUGS:

- Le terminal ne se mets pas à jour du thème il faut le toggle off & on pour le voir en changement. Mais pas grave pour le moment...
- Nouveau fichier pas du menuContext mais du bouton ou topbar envoie un nouveau fichier appeler ainsi texte à modifier pour pas avoir à changer le fichier à chaque fois ...
- Le rechargement du tree de la sidebar ne se fait pas après un drag and drop obliger de reselectionner le dossier en question pour le mettre à jour...
- Carré noir en haut à droite mais suite au drag and drop mais fonctionnel... (Disparu)
- Bug urgent copier coller
- bug urgent tabulation pris en compte au début mais pas derrière le cursor.

# Correction:

- Ajouter un menuContext à la tabsbar pour créer un fichier de 0 puis si sauvegarder avec ctrl+s alors "save as" et choisir sont nom et son emplacement sinon marquer comme undefined tant que pas enregistrer... (Facultatif)
- ajouter variable css de la searchbar dans le thème pour prendre en compte le colorie.

# IDEES:

- Ajouter Drag and Drop tabsbar et sidebar. Communication entre elles.
- Ajouter dans le code à l'installation un dossier my-code-editor dans le %appdata% pour pas laisser trainer les 2 fichiers json (settings.json & todolist), faire aussi un dossier theme pour aider à ranger ses themes.
  Mini-map optionnelle : une version ultra-light (juste un aperçu textuel réduit, pas un vrai canvas complexe) pour naviguer rapidement dans les gros fichiers.
  Auto-save discret : sauvegarde silencieuse toutes les 30s avec un petit indicateur visuel (point vert/rouge).
  Recherche incrémentale : un champ de recherche instantané dans l’explorateur de fichiers, basé sur fuse.js ou une lib ultra-light.

# OPTIMISATION:

Pour mon rasberry PI500+ faire du code propre et optimiser...
Virtualisation intelligente : pour l’explorateur de fichiers récursif, utilise une liste virtuelle (comme react-window) afin de gérer des milliers de fichiers sans lag.
Cache minimaliste : stocke les états fréquents (dernier fichier ouvert, position du terminal) dans localStorage ou une base légère type IndexedDB.

[Check]

# Ajouter ce code discord rich presence à chaque fois que:✅

tu ouvres un fichier
tu changes d’onglet
tu détectes un nouveau langage
tu sauvegardes
ou même à chaque modification (mais toutes les 2–3 secondes max)

code:
invoke("update_discord_presence", {
payload: {
file: currentFileName,
language: detectedLanguage,
project: projectName
}
});

🎮 Système de Modes (style Vim)

┌────────────┬────────────┬────────────────────────────┬──────────────────────────┐
│ Mode │ Indicateur │ Comment entrer │ Touches │
├────────────┼────────────┼────────────────────────────┼──────────────────────────┤
│ NORMAL │ 🟢 Vert │ Escape depuis tout mode │ f → Hint, i → Insert │
├────────────┼────────────┼────────────────────────────┼──────────────────────────┤
│ INSERT │ 🔵 Bleu │ i ou clic dans l'éditeur │ Édition normale │
├────────────┼────────────┼────────────────────────────┼──────────────────────────┤
│ HINT │ 🟡 Jaune │ f en mode Normal │ Lettres pour naviguer │
└────────────┴────────────┴────────────────────────────┴──────────────────────────┘

Raccourcis

- f (en Normal) : Active les Jump Labels
- i (en Normal) : Entre en mode Insert (focus éditeur)
- Escape : Retourne en mode Normal
- Alt+J : Fallback pour Jump Labels (fonctionne partout)

