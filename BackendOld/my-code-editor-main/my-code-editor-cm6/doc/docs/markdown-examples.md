# Markdown Extension : documentation

This documentation is for understanding all project.

## IDE BASE Constructor:

This IDE is powered by [Caracore](https://github.com/Caracore), [Maxens](https://github.com/swtchcoder), [TrogLau](https://github.com/TrgLau).

**Input**

````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

**Output**

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

## Components React Features:

## CommandPalette

**How does it work**

:::tip
Use ctrl+Shift+P by default for using this components in your IDE.
:::

:::info
CommandPalette.tsx and CommandPalette.css (feature concerned). Pas de commandes pour le moment, à venir...
:::

:::details
Ajouter plus de détails sur le code
:::

## Editor

**Code Editor CM6**

:::danger
It's the core of code editor becarefull before changing something here without look this documentation !!! This file connect Code Mirror 6 to IDE.
:::
:::warning
Besoin de changer et héberger des LSP pour plus de performances et gestion des erreurs en temps réel comme vscode.
Le Language Server Protocol (LSP)
Permet de :
autocomplétion

erreurs en temps réel

hover info

rename symbol

go to definition

formatage

etc.
:::

## EditorZone

**EditorZone**.tsx gère le drag and drop dans l'IDE. Avec la bibliothèque [dndkit](https://dndkit.com/).

## Search Bar

**SearchBar**.tsx gère la barre de recherche et les occurences.

## SettingsPanel

**SettingsPanel**.tsx gère le menu de paramètre settings avec les raccourcis dont il intègre aussi le toggle frontend du rich presence discord avec commandPalette aussi. 

## Sidebar
**ContextMenu** gère le click droit sur l'arborescence (sidebar).

**Sidebar** gère l'affichage de l'arborescence des fichier/dossier.

**TreeNode** quant à lui gère la logique de l'arborescence mets elles sont transférer sur sidebar.

## TabsBar

**SplitTabBar** Gestion du split de la tabsbar nouvelle tabsbar.

**Tabsbar** gère la tabsbar donc les onglets des fichier et les instances fichiers par onglets.

## Terminal

**Terminal**.tsx gère le terminal avec Rust en backend et [Xterm](https://xtermjs.org/) librairie en frontend

:::warning
Ajouter un multi-onglets sur le terminal pour en gérer plusieur à la fois avec un ID et PID différent à chaque utilisation.
:::

:::info
implémenter un redémarrage du terminal au changement de thème. Sinon obliger de faire toggle le terminal pour le mettre à jour...
:::

## ThemeManager
:::info
:::warning
ThemeManager gère l'import et export du thème. export du theme actuelle sauf celui de base light et dark directement dans téléchargement pour le sauvegarder si vous l'avez perdu.
:::

**Schema theme**
à revoir car code deprecated à modifier. Marche mais mettre à jour.


## TodoList

**Remplace le MD pour aller étape par étape dans le code avec plusieurs fonctionnalité**.

Même si le MD et le fichier texte reste disponible évite de changer de fenêtre directement...

:::tip
A noter que l'IDE créer un dossier d'installation dans %appdata% avec ma signature a changé d'ailleurs. Puis un dossier my-code-editor dedans settings.json avec vos raccourcis et la todolist.json pour sauvegarder vos notes de code.
Voir pour le mettre dans le dossier projet actuel comme le .vscode et ajouter la todolist dedans par projet avec détection de todolist dans le projet sinon en créer une à la première note...
:::

## Toolbar
**là où vous gérer vos thèmes et autre**
Bar en dessous de la topBar.

## TopMenu
Barre configuré via menuConfig.ts
MenuDropdown le menu déroulant...
TopMenu la barre tout en haut.

## WelcomeScreen
Au lieu d'un page blanche de présentation affiche cette page quand pas de fichier ouvert comme vscode.
Inclus Drag and Drop pour Split directement (besoin d'activer le drag and drop ? alors bouge ta souris de 8 px au click pour devenir drag and drop (tips)).

## Context
Dans un projet React, le dossier context/ sert à regrouper tout ce qui concerne le React Context API — c’est‑à‑dire la logique qui permet de partager un état global dans ton application sans avoir à passer des props partout.


## Cursor

le curseur natif est désactiver dans les paramètre. Donc le cursorlayer.ts dessine un cursor qui permet de faire des animation contrairement au natif.

Mettre un toggle pour l'action d'animation du cursor a ajouté. COmme vscode déjà le smoth caret expand vertical activé directement.

## Extensions
Extension Language pour les mot-clef
Disponible Actuellement cpp/python/css/html/css/json/javascript/rust
Se rediriger sur LSP pour plus de fonctionnalité et améliorer l'IDE.
Si envie d'ajouter une extension le faire ainsi:
Editor/CodeEditorCM6 -> ajouter la condition du nouveau language mettre un parser si possible (le mieux pour la coloration syntaxique et autre comme indentation)
 
2/puis ajouter son provider (fournisseur) avec une fonction ajouter les mot clef et l'inclure dans codeEditorCM6 pareil. Le provider soit être créer par vous et mettre dans extensions/nom du language...

3/ dans treenode ajouter l'extension du fichier pour qu'il soit reconnu au lieu d'être html par défaut. Mettre un émojis ou plus tard mettre des images comme vscode plus pro.

4/Dans utilitaire (utils) mettre la detection du Language dans : detectLanguageFromFilename exemple:
if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
ce qui va retourner la detection de language...

5/ Tout est prêt si tout va bien vous avez accès un nouveau language.

6/ More: Si vous voulez faire le votre disponible d'abord passer par le parser de code mirror -> [lezer](https://lezer.codemirror.net/) mais des ressources officiel comme cpp existe déjà sinon je vous redirige sur le tuto pour concevoir le parser pour les plus courageux d'entre vous...

## layout
Pour le moment même si il est pas propre MainLayout gère tout les layout il faut l'alléger en découpant le fichier avec une revue du code... Nécessaire !

## Managers 
vient d'une ancienne  du terminal au début création du terminal non persistant puis passer la main sur pty de rust et xterm de js... N'est normalement plus nécessaire.

## state


## Theme


## utils

Utilitaire pour debug ou gestion de la détection de language.

# Index.css

CSS global pour permettre de faire des thèmes custom alors variables css...

# Apps.tsx

page principal react...

# Main.tsx
Point d'entré pour renvoyer et afficher Apps.tsx

## BackEnd

## src-tauri


**Exemple de bar utilisable:**

::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::

## More

Check out the documentation for the [full list of markdown extensions](https://vitepress.dev/guide/markdown).
