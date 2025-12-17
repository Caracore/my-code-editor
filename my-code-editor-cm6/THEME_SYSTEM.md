# 🎨 Système de Thèmes avec Variables CSS

## Vue d'ensemble

Le système de thèmes utilise des **variables CSS** pour permettre une customisation complète de l'IDE, incluant :
- L'interface utilisateur (sidebar, toolbar, tabs, menus)
- L'éditeur CodeMirror 6
- Le terminal (xterm.js)

## 🌓 Thèmes par défaut

### Dark Theme (défaut)
Thème sombre avec terminal en vert Matrix style.

### Light Theme
Thème clair avec couleurs inversées pour une meilleure lisibilité en plein jour.

## 📁 Structure des fichiers

```
src/
├── index.css              # Définit toutes les variables CSS pour dark et light
├── themes/
│   └── ui-themes.ts      # Export les valeurs des thèmes pour JavaScript
├── context/
│   └── ThemeContext.tsx  # Gère l'application des thèmes
└── components/
    └── Terminal/
        └── Terminal.tsx   # Configure xterm avec les variables CSS
```

## 🎯 Variables CSS disponibles

### Couleurs de base
- `--primary-bg` / `--primary-fg`
- `--secondary-bg` / `--secondary-fg`
- `--accent-color`
- `--border-color`

### Sidebar
- `--sidebar-bg` / `--sidebar-fg`
- `--sidebar-button-bg` / `--sidebar-button-fg` / `--sidebar-button-hover`
- `--sidebar-input-bg` / `--sidebar-input-fg`

### Toolbar
- `--toolbar-bg` / `--toolbar-fg`
- `--toolbar-button-bg` / `--toolbar-button-fg` / `--toolbar-button-hover`

### Tabs Bar
- `--tabs-bg` / `--tabs-fg`
- `--tab-active-bg` / `--tab-active-fg`
- `--tab-hover-bg`
- `--tab-dirty-indicator`

### Editor (CodeMirror 6)
- `--editor-bg` / `--editor-fg` : Fond et texte de l'éditeur
- `--editor-selection-bg` : Couleur de sélection de texte
- `--editor-cursor` : Couleur du curseur
- `--editor-line-number-fg` : Couleur des numéros de ligne
- `--editor-active-line-bg` : Fond de la ligne active
- `--editor-gutter-bg` : Fond de la gouttière (zone des numéros de ligne)

### Terminal
- `--terminal-bg` / `--terminal-fg`
- `--terminal-input-bg` / `--terminal-input-fg`
- `--terminal-prompt-fg`
- `--terminal-button-bg` / `--terminal-button-hover-bg`
- `--terminal-selection-bg`

### Couleurs Xterm (16 couleurs ANSI)
- `--xterm-black`, `--xterm-red`, `--xterm-green`, etc.
- `--xterm-bright-black`, `--xterm-bright-red`, etc.

### Autres composants
- Context Menu : `--context-menu-bg`, `--context-menu-hover-bg`
- Settings Panel : `--settings-bg`, `--settings-input-bg`
- TodoList : `--todo-bg`, `--todo-item-bg`
- Welcome Screen : `--welcome-bg`, `--welcome-accent`
- Top Menu : `--menu-bg`, `--menu-hover-bg`

## 🔧 Comment utiliser

### Changer de thème
```tsx
import { useTheme } from './context/ThemeContext';

const { themeName, setThemeName } = useTheme();

// Passer au thème light
setThemeName('light');

// Passer au thème dark
setThemeName('dark');
```

### Créer un thème personnalisé
Les thèmes personnalisés peuvent surcharger n'importe quelle variable CSS :

```tsx
const customTheme = {
  name: "midnight-blue",
  palette: {
    "--primary-bg": "#001133",
    "--accent-color": "#00aaff",
    "--terminal-fg": "#00ffff",
    "--editor-bg": "#001133",
    "--editor-fg": "#e0f0ff",
    // ... autres variables CSS
  },
  typography: { 
    fontFamily: "JetBrains Mono", 
    fontSize: 14 
  },
  codemirror: {
    dark: true,
    highlightActiveLine: true,
    highlightActiveLineGutter: true
  }
};

loadCustomTheme(customTheme);
```

### Utiliser les variables dans vos composants CSS
```css
.my-component {
  background: var(--primary-bg);
  color: var(--primary-fg);
  border: 1px solid var(--border-color);
}

.my-component:hover {
  background: var(--secondary-bg);
}
```

## 🎨 Activation du thème Light

Le thème light est activé via l'attribut `data-theme="light"` sur le `<html>` :

```css
/* Défaut = Dark */
:root {
  --primary-bg: #0D0D0D;
}

/* Surcharge pour Light */
:root[data-theme="light"] {
  --primary-bg: #FFFFFF;
}
```

## 🔄 Synchronisation Terminal/IDE

Le terminal xterm.js lit les variables CSS au moment de sa création :

```tsx
const getComputedColor = (varName: string) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

const xterm = new XTerm({
  theme: {
    background: getComputedColor("--terminal-bg"),
    foreground: getComputedColor("--terminal-fg"),
    // ... autres couleurs
  }
});
```

## 💾 Persistance

Les thèmes sont sauvegardés dans `localStorage` :
- `themeName` : "dark" | "light" | nom du thème custom
- `customTheme` : objet JSON du thème personnalisé

## 🚀 Prochaines étapes

1. ✅ Thèmes Dark et Light fonctionnels
2. ✅ Variables CSS pour tous les composants
3. ✅ Terminal xterm synchronisé avec les thèmes
4. 🔲 Import/Export de thèmes JSON
5. 🔲 Éditeur visuel de thèmes
6. 🔲 Bibliothèque de thèmes communautaires

---

**Note** : Pour rafraîchir le terminal après un changement de thème, il faut actuellement recharger l'application. Une amélioration future permettra de mettre à jour le thème du terminal dynamiquement.
