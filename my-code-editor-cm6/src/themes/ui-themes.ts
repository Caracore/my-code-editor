// ui-themes.ts — palette IntelliJ-inspired (synchronisée avec src/index.css)
export const UI_THEMES = {
  "dark": {
    // Typographie
    "--font-family": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    "--font-family-mono": "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
    "--font-size": "13px",
    "--font-size-small": "12px",
    "--font-size-large": "15px",

    // Couleurs de base (Darcula New UI)
    "--primary-bg": "#1E1F22",
    "--primary-fg": "#DFE1E5",
    "--secondary-bg": "#2B2D30",
    "--secondary-fg": "#9DA0A8",
    "--accent-color": "#3574F0",
    "--accent-hover": "#4685F4",
    "--border-color": "#393B40",
    "--border-subtle": "#2B2D30",

    // Sidebar
    "--sidebar-bg": "#2B2D30",
    "--sidebar-fg": "#DFE1E5",
    "--sidebar-header-fg": "#9DA0A8",
    "--sidebar-button-bg": "transparent",
    "--sidebar-button-fg": "#DFE1E5",
    "--sidebar-button-hover": "rgba(255, 255, 255, 0.06)",
    "--sidebar-button-border": "transparent",
    "--sidebar-input-bg": "#1E1F22",
    "--sidebar-input-fg": "#DFE1E5",
    "--sidebar-input-border": "#393B40",
    "--sidebar-item-selected-bg": "rgba(53, 116, 240, 0.20)",
    "--sidebar-item-selected-border": "#3574F0",
    "--sidebar-item-drag-over-bg": "rgba(95, 184, 101, 0.18)",

    // Toolbar
    "--toolbar-bg": "#2B2D30",
    "--toolbar-fg": "#DFE1E5",
    "--toolbar-button-bg": "transparent",
    "--toolbar-button-fg": "#DFE1E5",
    "--toolbar-button-hover": "rgba(255, 255, 255, 0.08)",
    "--toolbar-button-border": "transparent",

    // Tabs
    "--tabs-bg": "#2B2D30",
    "--tabs-fg": "#9DA0A8",
    "--tabs-border": "#1E1F22",
    "--tab-active-bg": "#1E1F22",
    "--tab-active-fg": "#DFE1E5",
    "--tab-active-indicator": "#3574F0",
    "--tab-hover-bg": "rgba(255, 255, 255, 0.04)",
    "--tab-close-fg": "#6F737A",
    "--tab-close-hover-fg": "#DFE1E5",
    "--tab-dirty-indicator": "#F2C55C",

    // CodeMirror 6 - Base
    "--editor-bg": "#1E1F22",
    "--editor-fg": "#DFE1E5",
    "--editor-selection-bg": "#214283",
    "--editor-selection-inactive-bg": "#2F3239",
    "--editor-line-number-fg": "#5A5D63",
    "--editor-line-number-active-fg": "#A1A3AB",
    "--editor-cursor": "#DFE1E5",
    "--editor-cursor-primary": "#DFE1E5",
    "--editor-cursor-secondary": "#6F737A",
    "--editor-active-line-bg": "rgba(255, 255, 255, 0.03)",
    "--editor-active-line-gutter-bg": "rgba(255, 255, 255, 0.04)",

    // CodeMirror 6 - Gutters
    "--editor-gutter-bg": "#1E1F22",
    "--editor-gutter-fg": "#5A5D63",
    "--editor-gutter-border": "transparent",
    "--editor-gutter-hover-bg": "rgba(255, 255, 255, 0.04)",
    "--editor-fold-gutter-fg": "#6F737A",
    "--editor-fold-gutter-hover-fg": "#DFE1E5",

    // CodeMirror 6 - Matching
    "--editor-matching-bracket-bg": "rgba(95, 184, 101, 0.20)",
    "--editor-matching-bracket-border": "#5FB865",
    "--editor-nonmatching-bracket-bg": "rgba(219, 92, 92, 0.20)",
    "--editor-nonmatching-bracket-border": "#DB5C5C",
    "--editor-search-match-bg": "#3D4A65",
    "--editor-search-match-selected-bg": "#214283",

    // CodeMirror 6 - Syntax (Darcula)
    "--editor-comment": "#7A7E85",
    "--editor-keyword": "#CF8E6D",
    "--editor-operator": "#DFE1E5",
    "--editor-punctuation": "#DFE1E5",
    "--editor-string": "#6AAB73",
    "--editor-string-special": "#C7916C",
    "--editor-number": "#2AACB8",
    "--editor-boolean": "#CF8E6D",
    "--editor-null": "#CF8E6D",
    "--editor-variable": "#DFE1E5",
    "--editor-variable-name": "#DFE1E5",
    "--editor-variable-definition": "#C77DBB",
    "--editor-variable-special": "#C77DBB",
    "--editor-property": "#C77DBB",
    "--editor-property-definition": "#C77DBB",
    "--editor-function": "#56A8F5",
    "--editor-function-call": "#56A8F5",
    "--editor-class": "#BCBEC4",
    "--editor-class-name": "#BCBEC4",
    "--editor-type": "#BCBEC4",
    "--editor-type-name": "#BCBEC4",
    "--editor-tag": "#E8BF6A",
    "--editor-tag-name": "#E8BF6A",
    "--editor-attribute": "#BABABA",
    "--editor-attribute-name": "#BABABA",
    "--editor-attribute-value": "#6AAB73",
    "--editor-constant": "#C77DBB",
    "--editor-regexp": "#C7916C",
    "--editor-escape": "#2AACB8",
    "--editor-meta": "#BBB529",
    "--editor-heading": "#56A8F5",
    "--editor-heading-1": "#56A8F5",
    "--editor-heading-2": "#56A8F5",
    "--editor-heading-3": "#56A8F5",
    "--editor-emphasis": "#DFE1E5",
    "--editor-strong": "#DFE1E5",
    "--editor-link": "#56A8F5",
    "--editor-link-url": "#6AAB73",

    // Lint
    "--editor-error-fg": "#DB5C5C",
    "--editor-error-bg": "rgba(219, 92, 92, 0.10)",
    "--editor-error-border": "#DB5C5C",
    "--editor-warning-fg": "#F2C55C",
    "--editor-warning-bg": "rgba(242, 197, 92, 0.10)",
    "--editor-warning-border": "#F2C55C",
    "--editor-info-fg": "#3574F0",
    "--editor-info-bg": "rgba(53, 116, 240, 0.10)",
    "--editor-info-border": "#3574F0",
    "--editor-hint-fg": "#9DA0A8",
    "--editor-hint-bg": "rgba(157, 160, 168, 0.08)",
    "--editor-hint-border": "#9DA0A8",

    // Autocomplete
    "--editor-autocomplete-bg": "#2B2D30",
    "--editor-autocomplete-fg": "#DFE1E5",
    "--editor-autocomplete-selected-bg": "rgba(53, 116, 240, 0.30)",
    "--editor-autocomplete-selected-fg": "#FFFFFF",
    "--editor-autocomplete-border": "#393B40",
    "--editor-autocomplete-match-fg": "#56A8F5",
    "--editor-autocomplete-icon-fg": "#9DA0A8",

    // Tooltip
    "--editor-tooltip-bg": "#2B2D30",
    "--editor-tooltip-fg": "#DFE1E5",
    "--editor-tooltip-border": "#393B40",
    "--editor-tooltip-code-bg": "#1E1F22",

    // Selection
    "--editor-selection-main-bg": "#214283",
    "--editor-selection-secondary-bg": "#2F3239",
    "--editor-selection-match-bg": "#3D4A65",

    // Folding
    "--editor-fold-placeholder-fg": "#9DA0A8",
    "--editor-fold-placeholder-bg": "rgba(157, 160, 168, 0.10)",
    "--editor-fold-marker-fg": "#6F737A",
    "--editor-fold-marker-hover-fg": "#DFE1E5",

    // Panels
    "--editor-panel-bg": "#2B2D30",
    "--editor-panel-fg": "#DFE1E5",
    "--editor-panel-border": "#393B40",

    // Scrollbar éditeur
    "--editor-scrollbar-bg": "rgba(143, 143, 143, 0.35)",
    "--editor-scrollbar-hover-bg": "rgba(143, 143, 143, 0.55)",
    "--editor-scrollbar-active-bg": "rgba(191, 191, 191, 0.55)",

    // Terminal
    "--terminal-banner": "#2B2D30",
    "--terminal-bg": "#1E1F22",
    "--terminal-fg": "#DFE1E5",
    "--terminal-input-bg": "#1E1F22",
    "--terminal-input-fg": "#DFE1E5",
    "--terminal-prompt-fg": "#56A8F5",
    "--terminal-button-bg": "transparent",
    "--terminal-button-hover-bg": "rgba(255, 255, 255, 0.08)",
    "--terminal-button-fg": "#DFE1E5",
    "--terminal-button-border": "transparent",
    "--terminal-border": "#393B40",
    "--terminal-selection-bg": "#214283",

    // Xterm
    "--xterm-black": "#1E1F22",
    "--xterm-red": "#DB5C5C",
    "--xterm-green": "#5FB865",
    "--xterm-yellow": "#F2C55C",
    "--xterm-blue": "#3574F0",
    "--xterm-magenta": "#C77DBB",
    "--xterm-cyan": "#2AACB8",
    "--xterm-white": "#DFE1E5",
    "--xterm-bright-black": "#6F737A",
    "--xterm-bright-red": "#FF6B6B",
    "--xterm-bright-green": "#7AD17F",
    "--xterm-bright-yellow": "#FFD66B",
    "--xterm-bright-blue": "#4685F4",
    "--xterm-bright-magenta": "#D88FCC",
    "--xterm-bright-cyan": "#3CC0CC",
    "--xterm-bright-white": "#FFFFFF",

    // Panel
    "--panel-bg": "#1E1F22",
    "--panel-fg": "#DFE1E5",
    "--panel-border": "#393B40",

    // Context Menu
    "--context-menu-bg": "#2B2D30",
    "--context-menu-fg": "#DFE1E5",
    "--context-menu-hover-bg": "rgba(53, 116, 240, 0.20)",
    "--context-menu-border": "#393B40",

    // Settings
    "--settings-bg": "#2B2D30",
    "--settings-fg": "#DFE1E5",
    "--settings-input-bg": "#1E1F22",
    "--settings-input-fg": "#DFE1E5",
    "--settings-input-border": "#393B40",

    // TodoList
    "--todo-bg": "#2B2D30",
    "--todo-fg": "#DFE1E5",
    "--todo-item-bg": "#1E1F22",
    "--todo-item-hover-bg": "#2F3137",
    "--todo-checkbox-border": "#6F737A",
    "--todo-checkbox-checked-bg": "#3574F0",

    // Welcome
    "--welcome-bg": "#1E1F22",
    "--welcome-fg": "#DFE1E5",
    "--welcome-accent": "#3574F0",

    // Top Menu
    "--menu-bg": "#2B2D30",
    "--menu-fg": "#DFE1E5",
    "--menu-hover-bg": "rgba(255, 255, 255, 0.06)",
    "--menu-active-bg": "rgba(53, 116, 240, 0.25)",
    "--menu-border": "#393B40",

    // Search Bar
    "--searchbar-bg": "#2B2D30",
    "--searchbar-fg": "#DFE1E5",
    "--searchbar-border": "#393B40",
    "--searchbar-input-bg": "#1E1F22",
    "--searchbar-input-fg": "#DFE1E5",
    "--searchbar-input-border": "#393B40",
    "--searchbar-placeholder": "#6F737A",
    "--searchbar-match-bg": "rgba(242, 197, 92, 0.30)",
    "--searchbar-match-current-bg": "rgba(242, 140, 60, 0.55)",
    "--searchbar-match-current-border": "rgba(242, 140, 60, 0.90)",

    // Command Palette
    "--palette-overlay-bg": "rgba(0, 0, 0, 0.55)",
    "--palette-bg": "#2B2D30",
    "--palette-fg": "#DFE1E5",
    "--palette-border": "#393B40",
    "--palette-input-bg": "#1E1F22",
    "--palette-input-border": "#393B40",
    "--palette-item-hover-bg": "rgba(255, 255, 255, 0.05)",
    "--palette-item-selected-bg": "rgba(53, 116, 240, 0.25)",
    "--palette-item-selected-fg": "#FFFFFF",
    "--palette-shortcut-bg": "#1E1F22",
    "--palette-shortcut-border": "#393B40",
    "--palette-text-secondary": "#9DA0A8",

    // Scrollbar
    "--scrollbar-thumb": "rgba(143, 143, 143, 0.35)",
    "--scrollbar-thumb-hover": "rgba(143, 143, 143, 0.55)",
  },

  "light": {
    // Typographie
    "--font-family": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    "--font-family-mono": "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
    "--font-size": "13px",
    "--font-size-small": "12px",
    "--font-size-large": "15px",

    // Couleurs de base (IntelliJ Light)
    "--primary-bg": "#FFFFFF",
    "--primary-fg": "#000000",
    "--secondary-bg": "#F7F8FA",
    "--secondary-fg": "#6C707E",
    "--accent-color": "#3574F0",
    "--accent-hover": "#4685F4",
    "--border-color": "#EBECF0",
    "--border-subtle": "#F0F1F4",

    // Sidebar
    "--sidebar-bg": "#F7F8FA",
    "--sidebar-fg": "#000000",
    "--sidebar-header-fg": "#6C707E",
    "--sidebar-button-bg": "transparent",
    "--sidebar-button-fg": "#000000",
    "--sidebar-button-hover": "rgba(0, 0, 0, 0.06)",
    "--sidebar-button-border": "transparent",
    "--sidebar-input-bg": "#FFFFFF",
    "--sidebar-input-fg": "#000000",
    "--sidebar-input-border": "#D3D5DB",
    "--sidebar-item-selected-bg": "rgba(53, 116, 240, 0.15)",
    "--sidebar-item-selected-border": "#3574F0",
    "--sidebar-item-drag-over-bg": "rgba(95, 184, 101, 0.18)",

    // Toolbar
    "--toolbar-bg": "#F7F8FA",
    "--toolbar-fg": "#000000",
    "--toolbar-button-bg": "transparent",
    "--toolbar-button-fg": "#000000",
    "--toolbar-button-hover": "rgba(0, 0, 0, 0.06)",
    "--toolbar-button-border": "transparent",

    // Tabs
    "--tabs-bg": "#F7F8FA",
    "--tabs-fg": "#6C707E",
    "--tabs-border": "#EBECF0",
    "--tab-active-bg": "#FFFFFF",
    "--tab-active-fg": "#000000",
    "--tab-active-indicator": "#3574F0",
    "--tab-hover-bg": "rgba(0, 0, 0, 0.04)",
    "--tab-close-fg": "#818594",
    "--tab-close-hover-fg": "#000000",
    "--tab-dirty-indicator": "#F2A93A",

    // Editor
    "--editor-bg": "#FFFFFF",
    "--editor-fg": "#000000",
    "--editor-selection-bg": "#C7DFFC",
    "--editor-selection-inactive-bg": "#E5E7EB",
    "--editor-line-number-fg": "#999CA3",
    "--editor-line-number-active-fg": "#000000",
    "--editor-cursor": "#000000",
    "--editor-cursor-primary": "#000000",
    "--editor-cursor-secondary": "#888888",
    "--editor-active-line-bg": "rgba(0, 0, 0, 0.03)",
    "--editor-active-line-gutter-bg": "rgba(0, 0, 0, 0.04)",

    // Gutter
    "--editor-gutter-bg": "#FFFFFF",
    "--editor-gutter-fg": "#999CA3",
    "--editor-gutter-border": "transparent",
    "--editor-gutter-hover-bg": "rgba(0, 0, 0, 0.05)",
    "--editor-fold-gutter-fg": "#999CA3",
    "--editor-fold-gutter-hover-fg": "#000000",

    // Matching
    "--editor-matching-bracket-bg": "rgba(0, 200, 0, 0.18)",
    "--editor-matching-bracket-border": "#00A800",
    "--editor-nonmatching-bracket-bg": "rgba(255, 0, 0, 0.18)",
    "--editor-nonmatching-bracket-border": "#FF0000",
    "--editor-search-match-bg": "#FFE066",
    "--editor-search-match-selected-bg": "#FFB84D",

    // Syntax (IntelliJ Light)
    "--editor-comment": "#8C8C8C",
    "--editor-keyword": "#0033B3",
    "--editor-operator": "#000000",
    "--editor-punctuation": "#000000",
    "--editor-string": "#067D17",
    "--editor-string-special": "#A30E97",
    "--editor-number": "#1750EB",
    "--editor-boolean": "#0033B3",
    "--editor-null": "#0033B3",
    "--editor-variable": "#000000",
    "--editor-variable-name": "#000000",
    "--editor-variable-definition": "#871094",
    "--editor-variable-special": "#871094",
    "--editor-property": "#871094",
    "--editor-property-definition": "#871094",
    "--editor-function": "#00627A",
    "--editor-function-call": "#00627A",
    "--editor-class": "#000000",
    "--editor-class-name": "#000000",
    "--editor-type": "#000000",
    "--editor-type-name": "#000000",
    "--editor-tag": "#0033B3",
    "--editor-tag-name": "#0033B3",
    "--editor-attribute": "#871094",
    "--editor-attribute-name": "#871094",
    "--editor-attribute-value": "#067D17",
    "--editor-constant": "#871094",
    "--editor-regexp": "#264EFF",
    "--editor-escape": "#0037A6",
    "--editor-meta": "#871094",
    "--editor-heading": "#0033B3",
    "--editor-heading-1": "#0033B3",
    "--editor-heading-2": "#0033B3",
    "--editor-heading-3": "#0033B3",
    "--editor-emphasis": "#000000",
    "--editor-strong": "#000000",
    "--editor-link": "#0033B3",
    "--editor-link-url": "#067D17",

    // Lint
    "--editor-error-fg": "#DB5C5C",
    "--editor-error-bg": "rgba(219, 92, 92, 0.10)",
    "--editor-error-border": "#DB5C5C",
    "--editor-warning-fg": "#BF8803",
    "--editor-warning-bg": "rgba(191, 136, 3, 0.10)",
    "--editor-warning-border": "#BF8803",
    "--editor-info-fg": "#3574F0",
    "--editor-info-bg": "rgba(53, 116, 240, 0.10)",
    "--editor-info-border": "#3574F0",
    "--editor-hint-fg": "#6C707E",
    "--editor-hint-bg": "rgba(108, 112, 126, 0.08)",
    "--editor-hint-border": "#6C707E",

    // Autocomplete
    "--editor-autocomplete-bg": "#FFFFFF",
    "--editor-autocomplete-fg": "#000000",
    "--editor-autocomplete-selected-bg": "rgba(53, 116, 240, 0.15)",
    "--editor-autocomplete-selected-fg": "#000000",
    "--editor-autocomplete-border": "#D3D5DB",
    "--editor-autocomplete-match-fg": "#3574F0",
    "--editor-autocomplete-icon-fg": "#6C707E",

    // Tooltip
    "--editor-tooltip-bg": "#FFFFFF",
    "--editor-tooltip-fg": "#000000",
    "--editor-tooltip-border": "#D3D5DB",
    "--editor-tooltip-code-bg": "#F7F8FA",

    // Selection
    "--editor-selection-main-bg": "#C7DFFC",
    "--editor-selection-secondary-bg": "#E5E7EB",
    "--editor-selection-match-bg": "#FFE066",

    // Folding
    "--editor-fold-placeholder-fg": "#6C707E",
    "--editor-fold-placeholder-bg": "rgba(108, 112, 126, 0.10)",
    "--editor-fold-marker-fg": "#6C707E",
    "--editor-fold-marker-hover-fg": "#000000",

    // Panels
    "--editor-panel-bg": "#F7F8FA",
    "--editor-panel-fg": "#000000",
    "--editor-panel-border": "#EBECF0",

    // Scrollbar éditeur
    "--editor-scrollbar-bg": "rgba(0, 0, 0, 0.20)",
    "--editor-scrollbar-hover-bg": "rgba(0, 0, 0, 0.35)",
    "--editor-scrollbar-active-bg": "rgba(0, 0, 0, 0.50)",

    // Terminal (light)
    "--terminal-banner": "#F7F8FA",
    "--terminal-bg": "#FFFFFF",
    "--terminal-fg": "#1F2328",
    "--terminal-input-bg": "#FFFFFF",
    "--terminal-input-fg": "#1F2328",
    "--terminal-prompt-fg": "#1750EB",
    "--terminal-button-bg": "transparent",
    "--terminal-button-hover-bg": "rgba(0, 0, 0, 0.06)",
    "--terminal-button-fg": "#1F2328",
    "--terminal-button-border": "transparent",
    "--terminal-border": "#EBECF0",
    "--terminal-selection-bg": "#C7DFFC",

    // Xterm (light)
    "--xterm-black": "#000000",
    "--xterm-red": "#C7222F",
    "--xterm-green": "#067D17",
    "--xterm-yellow": "#BF8803",
    "--xterm-blue": "#1750EB",
    "--xterm-magenta": "#A30E97",
    "--xterm-cyan": "#0598BC",
    "--xterm-white": "#5A5D63",
    "--xterm-bright-black": "#6C707E",
    "--xterm-bright-red": "#DB5C5C",
    "--xterm-bright-green": "#5FB865",
    "--xterm-bright-yellow": "#F2C55C",
    "--xterm-bright-blue": "#3574F0",
    "--xterm-bright-magenta": "#C77DBB",
    "--xterm-bright-cyan": "#2AACB8",
    "--xterm-bright-white": "#000000",

    // Panel
    "--panel-bg": "#FFFFFF",
    "--panel-fg": "#000000",
    "--panel-border": "#EBECF0",

    // Context Menu
    "--context-menu-bg": "#FFFFFF",
    "--context-menu-fg": "#000000",
    "--context-menu-hover-bg": "rgba(53, 116, 240, 0.15)",
    "--context-menu-border": "#D3D5DB",

    // Settings
    "--settings-bg": "#F7F8FA",
    "--settings-fg": "#000000",
    "--settings-input-bg": "#FFFFFF",
    "--settings-input-fg": "#000000",
    "--settings-input-border": "#D3D5DB",

    // TodoList
    "--todo-bg": "#F7F8FA",
    "--todo-fg": "#000000",
    "--todo-item-bg": "#FFFFFF",
    "--todo-item-hover-bg": "#F0F1F4",
    "--todo-checkbox-border": "#B0B3BC",
    "--todo-checkbox-checked-bg": "#3574F0",

    // Welcome
    "--welcome-bg": "#FFFFFF",
    "--welcome-fg": "#000000",
    "--welcome-accent": "#3574F0",

    // Top Menu
    "--menu-bg": "#F7F8FA",
    "--menu-fg": "#000000",
    "--menu-hover-bg": "rgba(0, 0, 0, 0.06)",
    "--menu-active-bg": "rgba(53, 116, 240, 0.15)",
    "--menu-border": "#EBECF0",

    // Search Bar
    "--searchbar-bg": "#F7F8FA",
    "--searchbar-fg": "#000000",
    "--searchbar-border": "#D3D5DB",
    "--searchbar-input-bg": "#FFFFFF",
    "--searchbar-input-fg": "#000000",
    "--searchbar-input-border": "#D3D5DB",
    "--searchbar-placeholder": "#818594",
    "--searchbar-match-bg": "rgba(255, 215, 0, 0.40)",
    "--searchbar-match-current-bg": "rgba(255, 140, 0, 0.55)",
    "--searchbar-match-current-border": "rgba(255, 140, 0, 0.90)",

    // Command Palette
    "--palette-overlay-bg": "rgba(0, 0, 0, 0.25)",
    "--palette-bg": "#FFFFFF",
    "--palette-fg": "#000000",
    "--palette-border": "#D3D5DB",
    "--palette-input-bg": "#F7F8FA",
    "--palette-input-border": "#D3D5DB",
    "--palette-item-hover-bg": "rgba(0, 0, 0, 0.04)",
    "--palette-item-selected-bg": "rgba(53, 116, 240, 0.15)",
    "--palette-item-selected-fg": "#000000",
    "--palette-shortcut-bg": "#F7F8FA",
    "--palette-shortcut-border": "#D3D5DB",
    "--palette-text-secondary": "#6C707E",

    // Scrollbar
    "--scrollbar-thumb": "rgba(0, 0, 0, 0.20)",
    "--scrollbar-thumb-hover": "rgba(0, 0, 0, 0.35)",
  },
} as const;
