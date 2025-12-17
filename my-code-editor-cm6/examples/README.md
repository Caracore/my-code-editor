# CodeMirror 6 - Guide complet des thèmes

Ce dossier contient des exemples de thèmes pour l'éditeur CodeMirror 6. Chaque fichier JSON définit un thème complet avec toutes les variables CSS disponibles.

## 📋 Fichiers de thèmes

- **theme-complete-dark.json** - Thème Dark complet avec TOUTES les variables CSS
- **theme-complete-light.json** - Thème Light complet avec TOUTES les variables CSS
- **neon-purple.json** - Thème cyberpunk violet
- **pastel-dream.json** - Thème doux et pastel
- **midnight-ocean.json** - Thème océan nocturne
- **warm-sunrise.json** - Thème chaud levée de soleil

## 🎨 Variables CSS disponibles

### Base de l'IDE
```css
--primary-bg          /* Arrière-plan principal */
--primary-fg          /* Texte principal */
--secondary-bg        /* Arrière-plan secondaire */
--secondary-fg        /* Texte secondaire */
--accent-color        /* Couleur d'accent */
--border-color        /* Couleur des bordures */
```

### CodeMirror 6 - Base de l'éditeur
```css
--editor-bg                        /* Arrière-plan de l'éditeur */
--editor-fg                        /* Texte de l'éditeur */
--editor-selection-bg              /* Sélection */
--editor-selection-inactive-bg     /* Sélection inactive */
--editor-line-number-fg            /* Numéros de ligne */
--editor-line-number-active-fg     /* Numéro de ligne active */
--editor-cursor                    /* Curseur */
--editor-cursor-primary            /* Curseur principal */
--editor-cursor-secondary          /* Curseur secondaire */
--editor-active-line-bg            /* Ligne active */
--editor-active-line-gutter-bg     /* Gouttière ligne active */
```

### CodeMirror 6 - Gouttières
```css
--editor-gutter-bg               /* Arrière-plan gouttière */
--editor-gutter-fg               /* Texte gouttière */
--editor-gutter-border           /* Bordure gouttière */
--editor-gutter-hover-bg         /* Gouttière au survol */
--editor-fold-gutter-fg          /* Indicateur de pliage */
--editor-fold-gutter-hover-fg    /* Indicateur de pliage au survol */
```

### CodeMirror 6 - Correspondances
```css
--editor-matching-bracket-bg         /* Arrière-plan bracket correspondant */
--editor-matching-bracket-border     /* Bordure bracket correspondant */
--editor-nonmatching-bracket-bg      /* Arrière-plan bracket non-correspondant */
--editor-nonmatching-bracket-border  /* Bordure bracket non-correspondant */
--editor-search-match-bg             /* Résultat de recherche */
--editor-search-match-selected-bg    /* Résultat de recherche sélectionné */
```

### CodeMirror 6 - Coloration syntaxique
```css
--editor-comment              /* Commentaires */
--editor-keyword              /* Mots-clés (if, for, function, etc.) */
--editor-operator             /* Opérateurs (+, -, *, /, etc.) */
--editor-punctuation          /* Ponctuation (;, :, etc.) */
--editor-string               /* Chaînes de caractères */
--editor-string-special       /* Chaînes spéciales (template literals, etc.) */
--editor-number               /* Nombres */
--editor-boolean              /* Booléens (true, false) */
--editor-null                 /* Null, undefined */
--editor-variable             /* Variables */
--editor-variable-name        /* Nom de variable */
--editor-variable-definition  /* Définition de variable */
--editor-variable-special     /* Variables spéciales (this, self, etc.) */
--editor-property             /* Propriétés d'objet */
--editor-property-definition  /* Définition de propriété */
--editor-function             /* Fonctions */
--editor-function-call        /* Appel de fonction */
--editor-class                /* Classes */
--editor-class-name           /* Nom de classe */
--editor-type                 /* Types */
--editor-type-name            /* Nom de type */
--editor-tag                  /* Balises HTML */
--editor-tag-name             /* Nom de balise HTML */
--editor-attribute            /* Attributs HTML */
--editor-attribute-name       /* Nom d'attribut HTML */
--editor-attribute-value      /* Valeur d'attribut HTML */
--editor-constant             /* Constantes */
--editor-regexp               /* Expressions régulières */
--editor-escape               /* Caractères d'échappement */
--editor-meta                 /* Meta-information */
--editor-heading              /* Titres (Markdown) */
--editor-heading-1            /* Titre niveau 1 */
--editor-heading-2            /* Titre niveau 2 */
--editor-heading-3            /* Titre niveau 3 */
--editor-emphasis             /* Emphase (italique) */
--editor-strong               /* Fort (gras) */
--editor-link                 /* Liens */
--editor-link-url             /* URL de lien */
```

### CodeMirror 6 - Diagnostic / Lint
```css
--editor-error-fg           /* Texte d'erreur */
--editor-error-bg           /* Arrière-plan d'erreur */
--editor-error-border       /* Bordure d'erreur */
--editor-warning-fg         /* Texte d'avertissement */
--editor-warning-bg         /* Arrière-plan d'avertissement */
--editor-warning-border     /* Bordure d'avertissement */
--editor-info-fg            /* Texte d'information */
--editor-info-bg            /* Arrière-plan d'information */
--editor-info-border        /* Bordure d'information */
--editor-hint-fg            /* Texte d'indice */
--editor-hint-bg            /* Arrière-plan d'indice */
--editor-hint-border        /* Bordure d'indice */
```

### CodeMirror 6 - Autocomplétion
```css
--editor-autocomplete-bg              /* Arrière-plan popup autocomplétion */
--editor-autocomplete-fg              /* Texte autocomplétion */
--editor-autocomplete-selected-bg     /* Élément sélectionné */
--editor-autocomplete-selected-fg     /* Texte élément sélectionné */
--editor-autocomplete-border          /* Bordure popup */
--editor-autocomplete-match-fg        /* Texte correspondant */
--editor-autocomplete-icon-fg         /* Icônes */
```

### CodeMirror 6 - Tooltips
```css
--editor-tooltip-bg          /* Arrière-plan tooltip */
--editor-tooltip-fg          /* Texte tooltip */
--editor-tooltip-border      /* Bordure tooltip */
--editor-tooltip-code-bg     /* Arrière-plan code dans tooltip */
```

### CodeMirror 6 - Sélections multiples
```css
--editor-selection-main-bg         /* Sélection principale */
--editor-selection-secondary-bg    /* Sélections secondaires */
--editor-selection-match-bg        /* Correspondances de sélection */
```

### CodeMirror 6 - Pliage de code
```css
--editor-fold-placeholder-fg       /* Texte placeholder pliage */
--editor-fold-placeholder-bg       /* Arrière-plan placeholder pliage */
--editor-fold-marker-fg            /* Marqueur de pliage */
--editor-fold-marker-hover-fg      /* Marqueur de pliage au survol */
```

### CodeMirror 6 - Panneaux
```css
--editor-panel-bg        /* Arrière-plan panneau */
--editor-panel-fg        /* Texte panneau */
--editor-panel-border    /* Bordure panneau */
```

### CodeMirror 6 - Scrollbar
```css
--editor-scrollbar-bg          /* Scrollbar */
--editor-scrollbar-hover-bg    /* Scrollbar au survol */
--editor-scrollbar-active-bg   /* Scrollbar active */
```

### Terminal (Xterm.js)
```css
--terminal-bg               /* Arrière-plan terminal */
--terminal-fg               /* Texte terminal */
--terminal-selection-bg     /* Sélection terminal */

/* Palette de 16 couleurs ANSI */
--xterm-black               /* Noir */
--xterm-red                 /* Rouge */
--xterm-green               /* Vert */
--xterm-yellow              /* Jaune */
--xterm-blue                /* Bleu */
--xterm-magenta             /* Magenta */
--xterm-cyan                /* Cyan */
--xterm-white               /* Blanc */
--xterm-bright-black        /* Noir brillant */
--xterm-bright-red          /* Rouge brillant */
--xterm-bright-green        /* Vert brillant */
--xterm-bright-yellow       /* Jaune brillant */
--xterm-bright-blue         /* Bleu brillant */
--xterm-bright-magenta      /* Magenta brillant */
--xterm-bright-cyan         /* Cyan brillant */
--xterm-bright-white        /* Blanc brillant */
```

### Autres composants UI
```css
/* Sidebar */
--sidebar-bg, --sidebar-fg, --sidebar-button-bg, etc.

/* Toolbar */
--toolbar-bg, --toolbar-fg, --toolbar-button-bg, etc.

/* Tabs Bar */
--tabs-bg, --tabs-fg, --tab-active-bg, etc.

/* Context Menu */
--context-menu-bg, --context-menu-fg, etc.

/* Settings Panel */
--settings-bg, --settings-fg, etc.

/* TodoList */
--todo-bg, --todo-fg, etc.

/* Welcome Screen */
--welcome-bg, --welcome-fg, etc.

/* Top Menu */
--menu-bg, --menu-fg, etc.
```

## 📝 Structure d'un fichier de thème

```json
{
  "name": "nom-du-theme",
  "palette": {
    "--primary-bg": "#COULEUR",
    "--primary-fg": "#COULEUR",
    // ... toutes les variables CSS
  },
  "typography": {
    "fontFamily": "Consolas, 'Courier New', Monaco, monospace",
    "fontSize": 14,
    "lineHeight": 1.6,
    "letterSpacing": "0px"
  },
  "codemirror": {
    "dark": true,                        // true = dark, false = light
    "highlightActiveLine": true,
    "highlightActiveLineGutter": true,
    "highlightSpecialChars": true,
    "drawSelection": true,
    "dropCursor": true,
    "allowMultipleSelections": true,
    "indentOnInput": true,
    "bracketMatching": true,
    "closeBrackets": true,
    "autocompletion": true,
    "rectangularSelection": true,
    "crosshairCursor": true,
    "lineNumbers": true,
    "foldGutter": true,
    "lineWrapping": false,
    "tabSize": 2
  }
}
```

## 🚀 Comment utiliser un thème

1. Ouvrez votre IDE
2. Cliquez sur l'icône de réglages (⚙️)
3. Dans la section "Thèmes", cliquez sur "Import Theme"
4. Sélectionnez un fichier JSON de thème
5. Le thème sera appliqué immédiatement

## 🎯 Conseils pour créer un thème

### Cohérence des couleurs
- Utilisez une palette de couleurs cohérente
- Assurez un bon contraste entre le texte et l'arrière-plan
- Testez votre thème en mode dark et light

### Coloration syntaxique
Pour une coloration syntaxique efficace :
- **Commentaires** : Couleur atténuée (gris, vert foncé)
- **Mots-clés** : Couleur vive (bleu, violet)
- **Chaînes** : Couleur distincte (rouge, orange)
- **Fonctions** : Couleur unique (jaune, or)
- **Types/Classes** : Couleur spéciale (cyan, turquoise)
- **Variables** : Couleur neutre mais visible

### Accessibilité
- Ratio de contraste minimum : 4.5:1 pour le texte normal
- Ratio de contraste minimum : 3:1 pour le texte large
- Évitez les couleurs trop saturées
- Testez avec des daltonismes (protanopie, deutéranopie, tritanopie)

## 🛠️ Outils utiles

- [Coolors](https://coolors.co/) - Générateur de palette de couleurs
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Vérificateur de contraste
- [Color Blind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/) - Simulateur de daltonisme

## 📚 Référence CodeMirror 6

- [Documentation officielle](https://codemirror.net/docs/)
- [Lezer Highlight](https://lezer.codemirror.net/docs/ref/#highlight) - Système de coloration syntaxique
- [EditorView theming](https://codemirror.net/docs/ref/#view.EditorView^theme) - Système de thème

---

**Note** : Les fichiers `theme-complete-dark.json` et `theme-complete-light.json` contiennent **TOUTES** les variables CSS disponibles et servent de référence complète.
