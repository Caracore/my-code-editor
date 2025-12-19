# MISE A JOUR:
- Chaque fichier a une instance maintenant.
- drag and drop fonctionnel
- -cursor animated "vscode expand" created is not perfect but work.
- 
# BUGS:
- Le terminal ne se mets pas à jour du thème il faut le toggle off & on pour le voir en changement. Mais pas grave pour le moment... 
- Nouveau fichier pas du menuContext mais du bouton ou topbar envoie un nouveau fichier appeler ainsi texte à modifier pour pas avoir à changer le fichier à chaque fois ...
- Le rechargement du tree de la sidebar ne se fait pas après un drag and drop obliger de reselectionner le dossier en question pour le mettre à jour...
- Carré noir en haut à droite mais suite au drag and drop mais fonctionnel...
# Correction:
- rendre modifiable la couleur de sélection de la sidebar pour éviter le bleu avec thème personnalisable sans être obligé de voir le bleu actif.
- Ajouter un menuContext à la tabsbar pour créer un fichier de 0 puis si sauvegarder avec ctrl+s alors "save as" et choisir sont nom et son emplacement sinon marquer comme undefined tant que pas enregistrer...

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