# 🎨 Plan de relooking — Style IntelliJ IDEA

> Objectif : transformer l'IDE pour qu'il ait l'allure professionnelle et soignée d'IntelliJ IDEA (palette Darcula / New UI), avec une cohérence visuelle, une typographie propre, des espacements rigoureux et une hiérarchie claire.

---

## 1. Direction artistique

| Élément | Avant | Après (IntelliJ-like) |
|---|---|---|
| Palette dark | Noir pur `#0D0D0D` + bleu MS `#007ACC` | Gris graphite `#1E1F22` / `#2B2D30` + bleu JetBrains `#3574F0` |
| Palette light | Blanc pur `#FFF` + bleu MS | Gris très clair `#F7F8FA` + bleu JetBrains `#3574F0` |
| Typographie | System UI + Consolas | **Inter** (UI) + **JetBrains Mono** (code/terminal) |
| Border-radius | Mélange 3/4/6/8 px | Échelle fixe : 4px (boutons), 6px (panneaux), 8px (modaux) |
| Spacing | 4 / 6 / 8 / 12 / 15 / 20 px (hétéroclite) | Grille **4 px** stricte |
| Icônes | Emojis 📄 📁 💾 🎨 | SVG cohérents (lucide-react ou Phosphor) |
| Scrollbars | Cachées partout | Fines (10 px), visibles, style IntelliJ |
| Shadows | Mix `rgba(0,0,0,0.3-0.5)` | Système d’ombres en 3 niveaux (sm/md/lg) |

---

## 2. Tokens à introduire dans `src/index.css`

```css
:root {
  /* === Spacing (4 px grid) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* === Radius === */
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 10px;

  /* === Elevation === */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.25);
  --shadow-md: 0 4px 12px rgba(0,0,0,.35);
  --shadow-lg: 0 12px 32px rgba(0,0,0,.45);

  /* === Couleurs sémantiques === */
  --color-success: #5FB865;
  --color-warning: #F2C55C;
  --color-error:   #DB5C5C;
  --color-info:    #3574F0;
}
```

---

## 3. Palette IntelliJ Darcula (dark) — à appliquer dans `index.css`

| Variable | Nouvelle valeur | Rôle |
|---|---|---|
| `--primary-bg` | `#1E1F22` | Fond de l’éditeur (New UI) |
| `--secondary-bg` | `#2B2D30` | Tool windows (sidebar / tabs / toolbar) |
| `--primary-fg` | `#DFE1E5` | Texte principal |
| `--secondary-fg` | `#9DA0A8` | Texte secondaire |
| `--accent-color` | `#3574F0` | Sélection / focus / actif |
| `--border-color` | `#393B40` | Séparateurs subtils |
| `--sidebar-bg` | `#2B2D30` | |
| `--toolbar-bg` | `#2B2D30` | |
| `--menu-bg` | `#2B2D30` | |
| `--tabs-bg` | `#2B2D30` | |
| `--tab-active-bg` | `#1E1F22` | Onglet actif = même fond que l’éditeur |
| `--tab-active-indicator` | `#3574F0` | **Nouveau** : barre supérieure 2 px |
| `--terminal-bg` | `#1E1F22` | |
| `--terminal-fg` | `#DFE1E5` | (plus de vert flashy 💚) |

---

## 4. Composants à restyler

### 4.1 `MainLayout.css` (vide aujourd’hui)
- Définir `.main-layout` (flex column, height 100vh, font-feature-settings)
- Ajouter une zone `.workbench` (flex row) pour Activity Bar + contenu

### 4.2 Sidebar (`Sidebar.css`)
- En-tête `EXPLORER` en majuscules 11 px, opacity .7, letter-spacing 0.6 px
- Padding compact `var(--space-2)` au lieu de 8 px aléatoires
- Boutons sans bordure, juste hover bg + radius 4 px
- Items de fichiers : padding 2px 6px, hauteur 22 px (compact)

### 4.3 TabsBar (`TabsBar.css`)
- Onglet actif : **barre supérieure 2 px** couleur accent (signature IntelliJ)
- Suppression du `border-right` entre tabs (séparateur trop lourd)
- Hauteur 34 px, padding 0 12 px
- Onglet dirty : remplacer le point orange par un `●` qui apparaît dans le bouton close

### 4.4 Toolbar (`Toolbar.css`)
- Boutons icon-only 28×28 px, sans bordure, hover `--secondary-bg`
- Séparateur vertical 1 px entre groupes d’actions
- Hauteur totale 36 px

### 4.5 TopMenu (`TopMenu.css`)
- Hauteur 32 px, padding 0 var(--space-3)
- Items menu : padding 4 px 10 px, radius 4 px au hover
- Dropdown : `--shadow-md`, séparateurs internes 1 px

### 4.6 Terminal (`Terminal.css` + `TerminalPanel.css`)
- Header de panneau 28 px avec onglets (Terminal / Problems / Output) — *futur*
- Texte avec `--terminal-fg` (gris clair, plus de vert)
- Police `JetBrains Mono`, ligature activée

### 4.7 SearchBar (`SearchBar.css`)
- Reposition : ne plus déborder sur l’éditeur — l’ancrer dans une barre
- Toggle buttons (Aa, .* , W) : style IntelliJ (carrés 24×24, bg actif `--accent-color`)

### 4.8 CommandPalette (`CommandPalette.css`)
- Largeur 640 px, top 12 vh
- Catégories visibles en sticky header
- Raccourcis kbd : style IntelliJ (gris foncé, font-mono, padding 1 px 6 px)

### 4.9 SettingsPanel (`SettingsPanel.css`)
- Layout 2 colonnes : navigation gauche 200 px (Apparence / Raccourcis / Opacité) + contenu
- Toggles repensés (style switch 32×18)
- Largeur 720 px (au lieu de 600)

### 4.10 ContextMenu (`ContextMenu.css`)
- Padding interne `var(--space-1) 0`
- Items : icône SVG + libellé + raccourci aligné à droite
- Séparateur 1 px entre groupes

### 4.11 TodoList (`TodoList.css`)
- Aligner avec sidebar (même header style)
- Boutons radius 4 px partout, supprimer les couleurs hardcodées (#4ec9b0, #e74856 → tokens sémantiques)

### 4.12 WelcomeScreen (`WelcomeScreen.css`)
- Réduire le logo (120→80 px)
- Garder l’animation float mais plus subtile (4 px au lieu de 10)
- Cards "Open File / New File / Open Folder / Recent" comme IntelliJ

---

## 5. Composants à **créer**

### 5.1 `ActivityBar` (gauche, 44 px)
Bande verticale d’icônes (Explorer / Search / Source Control / Run / Extensions). Indispensable pour le look IntelliJ + VSCode.

```
src/components/ActivityBar/
  ActivityBar.tsx
  ActivityBar.css
```

### 5.2 `StatusBar` (bas, 22 px)
Affiche : branche git, encoding, fin de ligne (LF/CRLF), langage, position curseur, indicateurs LSP.

```
src/components/StatusBar/
  StatusBar.tsx
  StatusBar.css
```

### 5.3 `Splitter` (poignée de redimensionnement visible)
Remplacer le drag invisible actuel (`useResize`) par une poignée 4 px avec hover bleu.

---

## 6. Typographie

Ajouter en haut de `index.css` :

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

Mettre à jour les variables :
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

Et globalement :
```css
body {
  font-feature-settings: 'cv02','cv03','cv04','cv11';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.01em;
}
```

---

## 7. Icônes

Installer **lucide-react** :
```bash
npm install lucide-react
```

Remplacer dans tous les composants :
| Emoji | Icône lucide |
|---|---|
| 📄 | `FileText` |
| 📁 | `Folder` / `FolderOpen` |
| 💾 | `Save` |
| 🔍 | `Search` |
| 🎨 | `Palette` |
| ⚙️ | `Settings` |
| ⌨️ | `Terminal` |
| ↶ ↷ | `Undo2` `Redo2` |
| 📋 | `Copy` `ClipboardPaste` |
| ✓ | `Check` |
| 🎮 | `Gamepad2` |
| 🔧 | `Wrench` |
| 📊 | `Activity` |

---

## 8. Scrollbars (à corriger d’urgence)

Le fichier `App.css` cache **toutes** les scrollbars. À remplacer par un style IntelliJ-like :

```css
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
* { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }
```

---

## 9. Animations

Remplacer les animations abruptes par des courbes IntelliJ :
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--duration-fast: 120ms;
--duration-base: 200ms;
```

Supprimer / atténuer :
- `animation: shrink-expand 1s` du curseur (trop voyant)
- `box-shadow: inset 0 0 20px` sur la TabsBar drop-zone (kitsch)
- `transform: translateX(5px)` sur shortcut hover (gadget)

---

## 10. Cohérence des couleurs hardcodées

Liste des couleurs **en dur** à remplacer par des variables :

| Fichier | Couleur | Remplacer par |
|---|---|---|
| `EditorZone.css` | `rgba(99, 102, 241, ...)` (indigo) | `var(--accent-color)` |
| `WelcomeScreen.css` | `rgb(99, 102, 241)` | `var(--accent-color)` |
| `TabsBar.css` (split) | `rgb(99, 102, 241)`, `rgb(239, 68, 68)` | tokens |
| `SettingsPanel.css` | `#4a90e2`, `#4ec9b0`, `#e74856` | `--accent-color`, `--color-success`, `--color-error` |
| `TodoList.css` | `#4ec9b0`, `#e74856`, `#1e1e1e`, `#424242` | tokens |
| `ContextMenu.css` | `#ff4d4d`, `rgba(255, 0, 0, 0.2)` | `--color-error` |

---

## 11. Roadmap suggérée

1. ✅ **Phase 1 — Visuel global** *(fait dans ce relooking)*
   - Nouvelle palette + typographie + scrollbars + tokens
   - Restyle Sidebar / Tabs / Toolbar / Menu / Terminal / Search / Palette / Settings / Todo / ContextMenu

2. ⏳ **Phase 2 — Structure**
   - Créer Activity Bar
   - Créer Status Bar
   - Splitter visible

3. ⏳ **Phase 3 — Iconographie**
   - Installer lucide-react
   - Remplacer tous les emojis

4. ⏳ **Phase 4 — Détails**
   - Animations harmonisées
   - États focus visibles partout
   - Mode "Compact" / "Confortable"

---

## 12. Test visuel rapide

Après les modifs Phase 1 :
- [ ] L’éditeur a un fond `#1E1F22` (graphite)
- [ ] Les onglets actifs ont une barre bleue en haut
- [ ] Les scrollbars sont visibles et fines
- [ ] Les boutons toolbar ont un hover subtil sans bordure
- [ ] La sidebar a un en-tête `EXPLORER` en petit et caps
- [ ] Le terminal n’est plus vert flash mais gris clair
- [ ] Aucune couleur indigo `#6366F1` ne traîne pour les états drag/split
