# Thèmes & Plugins

Ce guide explique comment **utiliser**, **créer** et **importer** des thèmes
et des plugins dans `my-code-editor`. Tout est local : pas de marketplace,
pas de réseau, juste un dossier sur votre machine.

---

## 1. Où ça se passe

Les extensions utilisateur vivent dans votre dossier personnel :

| OS | Chemin |
| --- | --- |
| Windows | `%USERPROFILE%\.my-code-editor\` |
| macOS / Linux | `~/.my-code-editor/` |

Structure :

```
.my-code-editor/
├── themes/      ← fichiers *.json
└── plugins/     ← fichiers *.js ou *.mjs
```

Les deux dossiers sont créés automatiquement au premier lancement. Vous
pouvez aussi les ouvrir depuis l'app : **Réglages → Extensions → Ouvrir le
dossier des thèmes / des plugins**.

---

## 2. Utiliser un thème ou un plugin

1. Déposez le fichier dans le bon sous-dossier.
2. Dans l'éditeur, ouvrez la barre d'activité → icône **puzzle** (Extensions),
   ou **Réglages → Extensions**.
3. Cliquez sur **Recharger depuis le disque**.
4. **Thème** : cliquez sur sa carte pour l'activer.
   **Plugin** : basculez le commutateur à droite de son nom.

Le thème actif et la liste des plugins activés sont **persistés** dans vos
réglages utilisateur, donc tout est restauré au prochain démarrage.

---

## 3. Créer un thème

Un thème = un JSON plat qui surcharge des variables CSS sur `:root`. Tout
ce que vous ne définissez pas tombe sur la valeur par défaut de
`src/styles/theme.css`.

### 3.1 Exemple minimal

`~/.my-code-editor/themes/coucher-de-soleil.json`

```json
{
  "id": "sunset",
  "name": "Coucher de soleil",
  "type": "dark",
  "description": "Tons chauds, orangés.",
  "author": "vous",
  "variables": {
    "--bg-1": "#1a1213",
    "--bg-2": "#211618",
    "--bg-3": "#291b1d",
    "--accent": "#ff8a4c",
    "--accent-2": "#ffd166",
    "--accent-soft": "rgba(255, 138, 76, 0.18)",
    "--on-accent": "#1a1213",
    "--syn-kw": "#ff8a4c",
    "--syn-str": "#ffd166"
  }
}
```

### 3.2 Champs du manifest

| Champ | Requis | Description |
| --- | --- | --- |
| `id` | oui | Identifiant unique. |
| `name` | oui | Nom affiché dans la grille. |
| `type` | oui | `"dark"` ou `"light"`. Influe sur quelques détails UI. |
| `description` | non | Sous-titre court de la carte. |
| `author` | non | Libre. |
| `variables` | oui | Dictionnaire `--var` → valeur CSS. Les clés inconnues sont ignorées. |

> Alias accepté : `colors` au lieu de `variables`.

### 3.3 Variables disponibles

La liste blanche complète est dans `src/themes/types.ts` (`THEMEABLE_VARS`).
Catégories :

**Surfaces**
`--bg-0` à `--bg-5` (du plus profond au plus en relief),
`--border-1`, `--border-2`,
`--text-1` à `--text-4` (principal → atténué),
`--scrollbar-thumb`, `--scrollbar-thumb-hover`,
`--overlay-bg` (fond des modales),
`--titlebar-bg-from` / `--titlebar-bg-to`,
`--statusbar-bg-from` / `--statusbar-bg-to`.

**Accents**
`--accent`, `--accent-2`,
`--accent-soft` (≈18 % alpha — sélection, hover),
`--accent-glow-soft`, `--accent-glow-strong`,
`--accent-2-soft`,
`--shadow-accent` (valeur `box-shadow` complète),
`--on-accent` (texte sur surface accent — **doit contraster** avec
`--accent`),
`--on-accent-soft` (variante ≈65 % alpha de `--on-accent`).

**Sémantiques** `--success`, `--warn`, `--danger`, `--danger-strong`,
`--info`.

**Syntaxe globale** (chrome de l'app, badges, etc.) : `--syn-kw`,
`--syn-fn`, `--syn-str`, `--syn-num`, `--syn-com`, `--syn-type`,
`--syn-prop`, `--syn-tag`, `--syn-punct`.

**Divers** : `--code-on-light` (texte sur badges chauds).

### 3.4 Variables de l'éditeur (CodeMirror 6)

L'éditeur de code est entièrement personnalisable via des variables
dédiées. Toutes ont une **valeur par défaut dérivée** des tokens
ci-dessus (par ex. `--editor-bg: var(--bg-3)`, `--editor-keyword:
var(--syn-kw)`) — vous n'êtes donc pas obligé de les redéfinir : un
thème qui ne touche qu'aux couleurs de base aura un éditeur cohérent
automatiquement. Surchargez-les pour un contrôle pixel-perfect.

**Surfaces & curseur**
`--editor-bg`, `--editor-fg`, `--editor-cursor`,
`--editor-selection-bg`, `--editor-selection-main-bg`,
`--editor-selection-match-bg`, `--editor-active-line-bg`.

**Gouttière (numéros de ligne)**
`--editor-gutter-bg`, `--editor-gutter-border`, `--editor-gutter-hover-bg`,
`--editor-line-number-fg`, `--editor-line-number-active-fg`,
`--editor-active-line-gutter-bg`.

**Pliage de code**
`--editor-fold-placeholder-bg`, `--editor-fold-placeholder-fg`,
`--editor-fold-gutter-fg`, `--editor-fold-gutter-hover-fg`.

**Crochets correspondants**
`--editor-matching-bracket-bg`, `--editor-matching-bracket-border`,
`--editor-nonmatching-bracket-bg`, `--editor-nonmatching-bracket-border`.

**Recherche dans l'éditeur**
`--editor-search-match-bg`, `--editor-search-match-selected-bg`.

**Panneaux & diagnostics (LSP / lint)**
`--editor-panel-bg`, `--editor-panel-fg`, `--editor-panel-border`,
`--editor-error-border` / `--editor-error-bg`,
`--editor-warning-border` / `--editor-warning-bg`,
`--editor-info-border` / `--editor-info-bg`,
`--editor-hint-border` / `--editor-hint-bg`.

**Tooltips & autocomplétion**
`--editor-tooltip-bg`, `--editor-tooltip-fg`,
`--editor-tooltip-border`, `--editor-tooltip-code-bg`,
`--editor-autocomplete-bg`, `--editor-autocomplete-border`,
`--editor-autocomplete-fg`,
`--editor-autocomplete-selected-bg`, `--editor-autocomplete-selected-fg`,
`--editor-autocomplete-match-fg`, `--editor-autocomplete-icon-fg`.

**Scrollbar de l'éditeur**
`--editor-scrollbar-bg`, `--editor-scrollbar-hover-bg`,
`--editor-scrollbar-active-bg`.

**Coloration syntaxique** (mappage Lezer → couleur, par tag) :
`--editor-comment`, `--editor-keyword`,
`--editor-operator`, `--editor-punctuation`,
`--editor-string`, `--editor-string-special`,
`--editor-number`, `--editor-boolean`, `--editor-null`,
`--editor-variable`, `--editor-variable-definition`,
`--editor-variable-special`,
`--editor-property`, `--editor-property-definition`,
`--editor-function`,
`--editor-class`, `--editor-class-name`,
`--editor-type`, `--editor-type-name`,
`--editor-tag`,
`--editor-attribute`, `--editor-attribute-value`,
`--editor-constant`, `--editor-regexp`, `--editor-escape`,
`--editor-meta`,
`--editor-heading`, `--editor-heading-1`, `--editor-heading-2`,
`--editor-heading-3`,
`--editor-emphasis`, `--editor-strong`,
`--editor-link`, `--editor-link-url`.

> Les changements sont **réactifs** : modifier un thème actualise
> instantanément l'éditeur — pas besoin de recharger.

#### Exemple : redéfinir uniquement les keywords en rose

```json
{
  "id": "pinky",
  "name": "Pinky",
  "type": "dark",
  "variables": {
    "--editor-keyword": "#ff5dbf",
    "--editor-function": "#ffd166",
    "--editor-string":   "#a0e7a0"
  }
}
```

### 3.5 Conseils

- Définissez toujours `--on-accent` cohérent avec `--accent` :
  `#ffffff` pour un thème clair, presque-noir pour un thème sombre.
- Pour un thème **clair**, surchargez aussi `--overlay-bg`, les gradients
  titlebar/statusbar et les couleurs de scrollbar — sinon les modales et
  barres deviennent trop sombres.
- Vous n'êtes pas obligé de tout définir, les défauts comblent le reste.

---

## 4. Créer un plugin

Un plugin = un fichier JS qui exporte
`{ manifest, activate, deactivate? }`. La fonction `activate` reçoit une
`PluginAPI` étroite et typée pour brancher des éléments d'UI. Les plugins
**n'accèdent pas** au système de fichiers, au réseau ni au presse-papiers
directement — ils étendent uniquement l'interface.

### 4.1 Exemple minimal

`~/.my-code-editor/plugins/bonjour.js`

```js
module.exports = {
  manifest: {
    id: "bonjour",
    name: "Bonjour",
    version: "1.0.0",
    description: "Dit bonjour.",
    author: "vous",
  },

  activate(api) {
    api.log("plugin bonjour chargé");

    api.registerCommand({
      id: "direBonjour",
      title: "Bonjour : dire bonjour",
      group: "Bonjour",
      run: () => window.alert("Bonjour !"),
    });
  },
};
```

### 4.2 Manifest

| Champ | Requis | Description |
| --- | --- | --- |
| `id` | oui | Identifiant unique. Sert de préfixe de namespace. |
| `name` | oui | Nom affiché. |
| `version` | oui | Chaîne libre, semver recommandé. |
| `description` | non | Une ligne. |
| `author` | non | Libre. |

### 4.3 La `PluginAPI`

Toutes les méthodes `register*` retournent un `Disposable`
(`{ dispose(): void }`). Le manager les libère automatiquement quand le
plugin est désactivé.

```ts
interface PluginAPI {
  registerCommand(cmd: PluginCommand): Disposable;
  registerStatusBarItem(item: PluginStatusBarItem): Disposable;
  registerActivityBarItem(item: PluginActivityBarItem): Disposable;
  registerEditorExtension(ext: Extension | (() => Extension)): Disposable;
  onDeactivate(fn: () => void): void;
  log(...args: unknown[]): void;
}
```

#### `registerCommand`

```js
api.registerCommand({
  id: "faireQuelqueChose",       // namespacé en "<pluginId>::faireQuelqueChose"
  title: "Mon plugin : faire qch",
  group: "Mon plugin",            // section dans la palette (optionnel)
  shortcut: "Ctrl+Shift+H",       // affichage seulement
  run: async () => { /* ... */ },
});
```

Les commandes apparaissent dans **Ctrl+K** (palette de commandes),
fusionnées avec les commandes intégrées.

#### `registerStatusBarItem`

```js
api.registerStatusBarItem({
  id: "compteurMots",
  align: "right",      // ou "left"
  order: 50,           // plus bas = plus proche du centre
  tooltip: "Mots dans le fichier courant",
  onClick: () => api.log("clic"),
  render: () => "42 mots",  // string ou nœud React
});
```

> `render()` est appelé à chaque rendu de la barre. Pour un rafraîchissement
> périodique, dispatchez un `CustomEvent` depuis un `setInterval` —
> la barre écoute déjà `plugins:status-tick`. Voir le plugin intégré
> `Status Clock` dans `src/plugins/builtin.ts`.

#### `registerActivityBarItem`

```js
api.registerActivityBarItem({
  id: "maVue",
  label: "Ma vue",
  icon: () => "🌟",
  onClick: () => { /* ouvrir quelque chose */ },
});
```

#### `registerEditorExtension`

Injecte une extension CodeMirror 6 dans chaque éditeur. Valeur ou factory :

```js
api.registerEditorExtension(
  // disponible via le bundle hôte
  EditorView.theme({
    ".cm-content": { caretColor: "hotpink" },
  }),
);
```

> Les modules `@codemirror/*` ne sont pas exposés explicitement aux plugins
> pour l'instant — privilégiez des extensions purement style ou attendez la
> future API qui injectera l'SDK éditeur.

#### `onDeactivate(fn)`

Hook de démontage (timers, listeners, etc.) :

```js
const id = setInterval(tick, 1000);
api.onDeactivate(() => clearInterval(id));
```

#### `log(...args)`

Log dans la console avec un préfixe `[plugin:<id>]`.

### 4.4 Cycle de vie

1. L'IDE scanne `~/.my-code-editor/plugins/` au démarrage.
2. Chaque `*.js` / `*.mjs` est emballé dans un mini-shim CommonJS :
   ```js
   "use strict";
   const exports = {};
   const module = { exports };
   /* votre fichier */
   ```
3. Le `{ manifest, activate }` exporté est inscrit au catalogue.
4. Si l'`id` du plugin est dans `enabledPlugins` (réglages utilisateur),
   le manager appelle `activate(api)`.
5. Le désactiver dans **Réglages → Extensions** exécute tous les hooks
   `onDeactivate` puis libère chaque enregistrement.

### 4.5 Plugins intégrés (exemples)

Dans `src/plugins/builtin.ts` :

- **Hello World** — enregistre une commande dans la palette.
- **Status Clock** — affiche une horloge à droite de la barre de statut, avec
  un tick qui survit à la désactivation.

### 4.6 Sécurité

Les plugins sont évalués via `new Function(...)` — ils ont **les mêmes
privilèges que l'IDE**. C'est volontaire :

- vous déposez vous-même le fichier dans votre dossier ;
- la surface exposée par `PluginAPI` reste étroite et typée ;
- l'IDE a déjà un accès local complet.

**Ne déposez pas un plugin auquel vous ne faites pas confiance.**

---

## 5. Importer / partager

Pour distribuer un thème ou un plugin :

1. Donnez le fichier `.json` ou `.js` à votre destinataire.
2. Il le dépose dans `themes/` ou `plugins/`.
3. **Recharger depuis le disque** dans Réglages → Extensions.

Pas de packaging, pas de manifest racine : un fichier = une extension.

---

## 6. Référence rapide

| Action | Où |
| --- | --- |
| Changer de thème | Réglages → Extensions → carte du thème |
| Activer/désactiver un plugin | Réglages → Extensions → interrupteur |
| Ouvrir le dossier d'extensions | Réglages → Extensions → "Ouvrir le dossier…" |
| Recharger depuis le disque | Réglages → Extensions → "Recharger" |
| Vue Extensions | Barre d'activité → icône puzzle |
| Lancer une commande de plugin | Ctrl+K |

---

## 7. Pour les contributeurs

| Fichier | Rôle |
| --- | --- |
| `src/themes/types.ts` | `ThemeManifest` + whitelist `THEMEABLE_VARS` |
| `src/themes/builtin.ts` | Thèmes intégrés |
| `src/themes/ThemeManager.ts` | `applyTheme()` + `parseThemeJson()` |
| `src/plugins/types.ts` | `Plugin`, `PluginAPI`, types d'items |
| `src/plugins/PluginManager.ts` | Registre, activate/deactivate, observable |
| `src/plugins/PluginsContext.tsx` | Provider React, persistance des activations |
| `src/plugins/loader.ts` | Chargement disque (shim `new Function`) |
| `src/plugins/builtin.ts` | Plugins intégrés |
| `src-tauri/src/extensions.rs` | Commandes Tauri `extensions_dir` / `list_extensions` / `read_extension` |
