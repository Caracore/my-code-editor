# MISE A JOUR:
- Chaque fichier a une instance maintenant.

# BUGS:
- Le terminal ne se mets pas à jour du thème il faut le toggle off & on pour le voir en changement. Mais pas grave pour le moment... 
- Nouveau fichier pas du menuContext mais du bouton ou topbar envoie un nouveau fichier appeler ainsi texte à modifier pour pas avoir à changer le fichier à chaque fois ...
- Le rechargement du tree de la sidebar ne se fait pas après un drag and drop obliger de reselectionner le dossier en question pour le mettre à jour...

# Correction:
- rendre modifiable la couleur de sélection de la sidebar pour éviter le bleu avec thème personnalisable sans être obligé de voir le bleu actif.
- Ajouter un menuContext à la tabsbar pour créer un fichier de 0 puis si sauvegarder avec ctrl+s alors "save as" et choisir sont nom et son emplacement sinon marquer comme undefined tant que pas enregistrer...

# IDEES:
- Ajouter Drag and Drop tabsbar et sidebar. Communication entre elles.
- Ajouter dans le code à l'installation un dossier my-code-editor dans le %appdata% pour pas laisser trainer les 2 fichiers json (settings.json & todolist), faire aussi un dossier theme pour aider à ranger ses themes.

# OPTIMISATION:
Pour mon rasberry PI500+ faire du code propre et optimiser...