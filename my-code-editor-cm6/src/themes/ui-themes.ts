// ui-themes.ts
export const UI_THEMES = {
  "dark": {
    // Couleurs de base
    "--primary-bg": "#0D0D0D",
    "--primary-fg": "#E0E0E0",
    "--secondary-bg": "#1A1A1A",
    "--secondary-fg": "#CCCCCC",
    "--accent-color": "#007ACC",
    "--border-color": "#333333",
    
    // Sidebar
    "--sidebar-bg": "#1e1e1e",
    "--sidebar-fg": "#cccccc",
    "--sidebar-button-bg": "#2a2a2a",
    "--sidebar-button-fg": "#eeeeee",
    "--sidebar-button-hover": "#333333",
    "--sidebar-button-border": "#444444",
    "--sidebar-input-bg": "#333333",
    "--sidebar-input-fg": "#ffffff",
    "--sidebar-input-border": "#555555",
    
    // Toolbar
    "--toolbar-bg": "#1A1A1A",
    "--toolbar-fg": "#E0E0E0",
    "--toolbar-button-bg": "#2a2a2a",
    "--toolbar-button-fg": "#dddddd",
    "--toolbar-button-hover": "#333333",
    "--toolbar-button-border": "#444444",
    
    // Tabs
    "--tabs-bg": "#1e1e1e",
    "--tabs-fg": "#cccccc",
    "--tabs-border": "#333333",
    "--tab-active-bg": "#252525",
    "--tab-active-fg": "#ffffff",
    "--tab-hover-bg": "#2a2a2a",
    "--tab-close-fg": "#888888",
    "--tab-close-hover-fg": "#ffffff",
    "--tab-dirty-indicator": "#f59e0b",
    
    // CodeMirror 6 - Base
    "--editor-bg": "#0D0D0D",
    "--editor-fg": "#D4D4D4",
    "--editor-selection-bg": "#264F78",
    "--editor-selection-inactive-bg": "#3A3D41",
    "--editor-line-number-fg": "#858585",
    "--editor-line-number-active-fg": "#C6C6C6",
    "--editor-cursor": "#AEAFAD",
    "--editor-cursor-primary": "#AEAFAD",
    "--editor-cursor-secondary": "#858585",
    "--editor-active-line-bg": "rgba(255, 255, 255, 0.05)",
    "--editor-active-line-gutter-bg": "rgba(255, 255, 255, 0.05)",
    
    // CodeMirror 6 - Gutters
    "--editor-gutter-bg": "#0D0D0D",
    "--editor-gutter-fg": "#858585",
    "--editor-gutter-border": "#333333",
    "--editor-gutter-hover-bg": "rgba(255, 255, 255, 0.03)",
    "--editor-fold-gutter-fg": "#858585",
    "--editor-fold-gutter-hover-fg": "#C6C6C6",
    
    // CodeMirror 6 - Matching
    "--editor-matching-bracket-bg": "rgba(0, 100, 0, 0.3)",
    "--editor-matching-bracket-border": "#0F0",
    "--editor-nonmatching-bracket-bg": "rgba(255, 0, 0, 0.3)",
    "--editor-nonmatching-bracket-border": "#F00",
    "--editor-search-match-bg": "#515C6A",
    "--editor-search-match-selected-bg": "#6A9955",
    
    // CodeMirror 6 - Syntax Highlighting
    "--editor-comment": "#6A9955",
    "--editor-keyword": "#569CD6",
    "--editor-operator": "#D4D4D4",
    "--editor-punctuation": "#D4D4D4",
    "--editor-string": "#CE9178",
    "--editor-string-special": "#D7BA7D",
    "--editor-number": "#B5CEA8",
    "--editor-boolean": "#569CD6",
    "--editor-null": "#569CD6",
    "--editor-variable": "#9CDCFE",
    "--editor-variable-name": "#9CDCFE",
    "--editor-variable-definition": "#9CDCFE",
    "--editor-variable-special": "#4FC1FF",
    "--editor-property": "#9CDCFE",
    "--editor-property-definition": "#9CDCFE",
    "--editor-function": "#DCDCAA",
    "--editor-function-call": "#DCDCAA",
    "--editor-class": "#4EC9B0",
    "--editor-class-name": "#4EC9B0",
    "--editor-type": "#4EC9B0",
    "--editor-type-name": "#4EC9B0",
    "--editor-tag": "#569CD6",
    "--editor-tag-name": "#569CD6",
    "--editor-attribute": "#9CDCFE",
    "--editor-attribute-name": "#9CDCFE",
    "--editor-attribute-value": "#CE9178",
    "--editor-constant": "#4FC1FF",
    "--editor-regexp": "#D16969",
    "--editor-escape": "#D7BA7D",
    "--editor-meta": "#569CD6",
    "--editor-heading": "#569CD6",
    "--editor-heading-1": "#569CD6",
    "--editor-heading-2": "#569CD6",
    "--editor-heading-3": "#569CD6",
    "--editor-emphasis": "#D4D4D4",
    "--editor-strong": "#D4D4D4",
    "--editor-link": "#4EC9B0",
    "--editor-link-url": "#CE9178",
    
    // CodeMirror 6 - Lint/Diagnostic
    "--editor-error-fg": "#F48771",
    "--editor-error-bg": "rgba(244, 135, 113, 0.1)",
    "--editor-error-border": "#F48771",
    "--editor-warning-fg": "#CCA700",
    "--editor-warning-bg": "rgba(204, 167, 0, 0.1)",
    "--editor-warning-border": "#CCA700",
    "--editor-info-fg": "#4FC1FF",
    "--editor-info-bg": "rgba(79, 193, 255, 0.1)",
    "--editor-info-border": "#4FC1FF",
    "--editor-hint-fg": "#858585",
    "--editor-hint-bg": "rgba(133, 133, 133, 0.1)",
    "--editor-hint-border": "#858585",
    
    // CodeMirror 6 - Autocomplete
    "--editor-autocomplete-bg": "#252526",
    "--editor-autocomplete-fg": "#CCCCCC",
    "--editor-autocomplete-selected-bg": "#094771",
    "--editor-autocomplete-selected-fg": "#FFFFFF",
    "--editor-autocomplete-border": "#454545",
    "--editor-autocomplete-match-fg": "#4EC9B0",
    "--editor-autocomplete-icon-fg": "#C5C5C5",
    
    // CodeMirror 6 - Tooltip
    "--editor-tooltip-bg": "#252526",
    "--editor-tooltip-fg": "#CCCCCC",
    "--editor-tooltip-border": "#454545",
    "--editor-tooltip-code-bg": "#1E1E1E",
    
    // CodeMirror 6 - Selection
    "--editor-selection-main-bg": "#264F78",
    "--editor-selection-secondary-bg": "#3A3D41",
    "--editor-selection-match-bg": "#515C6A",
    
    // CodeMirror 6 - Folding
    "--editor-fold-placeholder-fg": "#858585",
    "--editor-fold-placeholder-bg": "rgba(133, 133, 133, 0.1)",
    "--editor-fold-marker-fg": "#858585",
    "--editor-fold-marker-hover-fg": "#C6C6C6",
    
    // CodeMirror 6 - Panels
    "--editor-panel-bg": "#1E1E1E",
    "--editor-panel-fg": "#CCCCCC",
    "--editor-panel-border": "#3C3C3C",
    
    // CodeMirror 6 - Scrollbar
    "--editor-scrollbar-bg": "rgba(121, 121, 121, 0.4)",
    "--editor-scrollbar-hover-bg": "rgba(100, 100, 100, 0.7)",
    "--editor-scrollbar-active-bg": "rgba(191, 191, 191, 0.4)",
    
    // Terminal
    "--terminal-bg": "#0D0D0D",
    "--terminal-fg": "#00FF00",
    "--terminal-input-bg": "#111111",
    "--terminal-input-fg": "#00FF00",
    "--terminal-prompt-fg": "#00FF00",
    "--terminal-button-bg": "#333333",
    "--terminal-button-hover-bg": "#444444",
    "--terminal-button-fg": "#00FF00",
    "--terminal-button-border": "#00FF00",
    "--terminal-border": "#333333",
    "--terminal-selection-bg": "#264F78",
    
    // Xterm Colors
    "--xterm-black": "#000000",
    "--xterm-red": "#cd3131",
    "--xterm-green": "#0dbc79",
    "--xterm-yellow": "#e5e510",
    "--xterm-blue": "#2472c8",
    "--xterm-magenta": "#bc3fbc",
    "--xterm-cyan": "#11a8cd",
    "--xterm-white": "#e5e5e5",
    "--xterm-bright-black": "#666666",
    "--xterm-bright-red": "#f14c4c",
    "--xterm-bright-green": "#23d18b",
    "--xterm-bright-yellow": "#f5f543",
    "--xterm-bright-blue": "#3b8eea",
    "--xterm-bright-magenta": "#d670d6",
    "--xterm-bright-cyan": "#29b8db",
    "--xterm-bright-white": "#ffffff",
    
    // Panel
    "--panel-bg": "#0D0D0D",
    "--panel-fg": "#E0E0E0",
    "--panel-border": "#333333",
    
    // Context Menu
    "--context-menu-bg": "#252525",
    "--context-menu-fg": "#cccccc",
    "--context-menu-hover-bg": "#2a2a2a",
    "--context-menu-border": "#454545",
    
    // Settings
    "--settings-bg": "#1e1e1e",
    "--settings-fg": "#cccccc",
    "--settings-input-bg": "#2a2a2a",
    "--settings-input-fg": "#ffffff",
    "--settings-input-border": "#444444",
    
    // TodoList
    "--todo-bg": "#1e1e1e",
    "--todo-fg": "#cccccc",
    "--todo-item-bg": "#2a2a2a",
    "--todo-item-hover-bg": "#333333",
    "--todo-checkbox-border": "#666666",
    "--todo-checkbox-checked-bg": "#007ACC",
    
    // Welcome Screen
    "--welcome-bg": "#0D0D0D",
    "--welcome-fg": "#E0E0E0",
    "--welcome-accent": "#007ACC",
    
    // Top Menu
    "--menu-bg": "#1A1A1A",
    "--menu-fg": "#E0E0E0",
    "--menu-hover-bg": "#2a2a2a",
    "--menu-active-bg": "#007ACC",
    "--menu-border": "#333333",
  },
  "light": {
    // Couleurs de base
    "--primary-bg": "#FFFFFF",
    "--primary-fg": "#000000",
    "--secondary-bg": "#F3F3F3",
    "--secondary-fg": "#333333",
    "--accent-color": "#0078D4",
    "--border-color": "#CCCCCC",
    
    // Sidebar
    "--sidebar-bg": "#F3F3F3",
    "--sidebar-fg": "#333333",
    "--sidebar-button-bg": "#E1E1E1",
    "--sidebar-button-fg": "#000000",
    "--sidebar-button-hover": "#D5D5D5",
    "--sidebar-button-border": "#CCCCCC",
    "--sidebar-input-bg": "#FFFFFF",
    "--sidebar-input-fg": "#000000",
    "--sidebar-input-border": "#CCCCCC",
    
    // Toolbar
    "--toolbar-bg": "#FFFFFF",
    "--toolbar-fg": "#000000",
    "--toolbar-button-bg": "#E1E1E1",
    "--toolbar-button-fg": "#000000",
    "--toolbar-button-hover": "#D5D5D5",
    "--toolbar-button-border": "#CCCCCC",
    
    // Tabs
    "--tabs-bg": "#F3F3F3",
    "--tabs-fg": "#333333",
    "--tabs-border": "#CCCCCC",
    "--tab-active-bg": "#FFFFFF",
    "--tab-active-fg": "#000000",
    "--tab-hover-bg": "#E8E8E8",
    "--tab-close-fg": "#666666",
    "--tab-close-hover-fg": "#000000",
    "--tab-dirty-indicator": "#f59e0b",
    
    // CodeMirror 6 - Base
    "--editor-bg": "#FFFFFF",
    "--editor-fg": "#000000",
    "--editor-selection-bg": "#ADD6FF",
    "--editor-selection-inactive-bg": "#E4E4E4",
    "--editor-line-number-fg": "#237893",
    "--editor-line-number-active-fg": "#0B216F",
    "--editor-cursor": "#000000",
    "--editor-cursor-primary": "#000000",
    "--editor-cursor-secondary": "#888888",
    "--editor-active-line-bg": "rgba(0, 0, 0, 0.03)",
    "--editor-active-line-gutter-bg": "rgba(0, 0, 0, 0.03)",
    
    // CodeMirror 6 - Gutters
    "--editor-gutter-bg": "#F8F8F8",
    "--editor-gutter-fg": "#237893",
    "--editor-gutter-border": "#CCCCCC",
    "--editor-gutter-hover-bg": "rgba(0, 0, 0, 0.05)",
    "--editor-fold-gutter-fg": "#237893",
    "--editor-fold-gutter-hover-fg": "#0B216F",
    
    // CodeMirror 6 - Matching
    "--editor-matching-bracket-bg": "rgba(0, 200, 0, 0.2)",
    "--editor-matching-bracket-border": "#00C800",
    "--editor-nonmatching-bracket-bg": "rgba(255, 0, 0, 0.2)",
    "--editor-nonmatching-bracket-border": "#FF0000",
    "--editor-search-match-bg": "#FFD580",
    "--editor-search-match-selected-bg": "#FFC04D",
    
    // CodeMirror 6 - Syntax Highlighting
    "--editor-comment": "#008000",
    "--editor-keyword": "#0000FF",
    "--editor-operator": "#000000",
    "--editor-punctuation": "#000000",
    "--editor-string": "#A31515",
    "--editor-string-special": "#EE9900",
    "--editor-number": "#098658",
    "--editor-boolean": "#0000FF",
    "--editor-null": "#0000FF",
    "--editor-variable": "#001080",
    "--editor-variable-name": "#001080",
    "--editor-variable-definition": "#001080",
    "--editor-variable-special": "#0070C1",
    "--editor-property": "#001080",
    "--editor-property-definition": "#001080",
    "--editor-function": "#795E26",
    "--editor-function-call": "#795E26",
    "--editor-class": "#267F99",
    "--editor-class-name": "#267F99",
    "--editor-type": "#267F99",
    "--editor-type-name": "#267F99",
    "--editor-tag": "#800000",
    "--editor-tag-name": "#800000",
    "--editor-attribute": "#FF0000",
    "--editor-attribute-name": "#FF0000",
    "--editor-attribute-value": "#0000FF",
    "--editor-constant": "#0070C1",
    "--editor-regexp": "#811F3F",
    "--editor-escape": "#EE9900",
    "--editor-meta": "#AF00DB",
    "--editor-heading": "#0000FF",
    "--editor-heading-1": "#0000FF",
    "--editor-heading-2": "#0000FF",
    "--editor-heading-3": "#0000FF",
    "--editor-emphasis": "#000000",
    "--editor-strong": "#000000",
    "--editor-link": "#267F99",
    "--editor-link-url": "#A31515",
    
    // CodeMirror 6 - Lint/Diagnostic
    "--editor-error-fg": "#E51400",
    "--editor-error-bg": "rgba(229, 20, 0, 0.1)",
    "--editor-error-border": "#E51400",
    "--editor-warning-fg": "#BF8803",
    "--editor-warning-bg": "rgba(191, 136, 3, 0.1)",
    "--editor-warning-border": "#BF8803",
    "--editor-info-fg": "#1A85FF",
    "--editor-info-bg": "rgba(26, 133, 255, 0.1)",
    "--editor-info-border": "#1A85FF",
    "--editor-hint-fg": "#6C6C6C",
    "--editor-hint-bg": "rgba(108, 108, 108, 0.1)",
    "--editor-hint-border": "#6C6C6C",
    
    // CodeMirror 6 - Autocomplete
    "--editor-autocomplete-bg": "#F3F3F3",
    "--editor-autocomplete-fg": "#000000",
    "--editor-autocomplete-selected-bg": "#0078D4",
    "--editor-autocomplete-selected-fg": "#FFFFFF",
    "--editor-autocomplete-border": "#CCCCCC",
    "--editor-autocomplete-match-fg": "#267F99",
    "--editor-autocomplete-icon-fg": "#666666",
    
    // CodeMirror 6 - Tooltip
    "--editor-tooltip-bg": "#F3F3F3",
    "--editor-tooltip-fg": "#000000",
    "--editor-tooltip-border": "#CCCCCC",
    "--editor-tooltip-code-bg": "#FFFFFF",
    
    // CodeMirror 6 - Selection
    "--editor-selection-main-bg": "#ADD6FF",
    "--editor-selection-secondary-bg": "#E4E4E4",
    "--editor-selection-match-bg": "#FFD580",
    
    // CodeMirror 6 - Folding
    "--editor-fold-placeholder-fg": "#6C6C6C",
    "--editor-fold-placeholder-bg": "rgba(108, 108, 108, 0.1)",
    "--editor-fold-marker-fg": "#6C6C6C",
    "--editor-fold-marker-hover-fg": "#000000",
    
    // CodeMirror 6 - Panels
    "--editor-panel-bg": "#F3F3F3",
    "--editor-panel-fg": "#000000",
    "--editor-panel-border": "#CCCCCC",
    
    // CodeMirror 6 - Scrollbar
    "--editor-scrollbar-bg": "rgba(100, 100, 100, 0.4)",
    "--editor-scrollbar-hover-bg": "rgba(80, 80, 80, 0.7)",
    "--editor-scrollbar-active-bg": "rgba(50, 50, 50, 0.4)",
    
    // Terminal
    "--terminal-bg": "#FFFFFF",
    "--terminal-fg": "#222222",
    "--terminal-input-bg": "#F0F0F0",
    "--terminal-input-fg": "#222222",
    "--terminal-prompt-fg": "#444444",
    "--terminal-button-bg": "#E1E1E1",
    "--terminal-button-hover-bg": "#CCCCCC",
    "--terminal-button-fg": "#222222",
    "--terminal-button-border": "#888888",
    "--terminal-border": "#CCCCCC",
    "--terminal-selection-bg": "#ADD6FF",
    
    // Xterm Colors
    "--xterm-black": "#000000",
    "--xterm-red": "#cd3131",
    "--xterm-green": "#00BC00",
    "--xterm-yellow": "#949800",
    "--xterm-blue": "#0451a5",
    "--xterm-magenta": "#bc05bc",
    "--xterm-cyan": "#0598bc",
    "--xterm-white": "#555555",
    "--xterm-bright-black": "#666666",
    "--xterm-bright-red": "#cd3131",
    "--xterm-bright-green": "#14CE14",
    "--xterm-bright-yellow": "#b5ba00",
    "--xterm-bright-blue": "#0451a5",
    "--xterm-bright-magenta": "#bc05bc",
    "--xterm-bright-cyan": "#0598bc",
    "--xterm-bright-white": "#a5a5a5",
    
    // Panel
    "--panel-bg": "#FFFFFF",
    "--panel-fg": "#000000",
    "--panel-border": "#CCCCCC",
    
    // Context Menu
    "--context-menu-bg": "#FFFFFF",
    "--context-menu-fg": "#333333",
    "--context-menu-hover-bg": "#F0F0F0",
    "--context-menu-border": "#CCCCCC",
    
    // Settings
    "--settings-bg": "#F3F3F3",
    "--settings-fg": "#333333",
    "--settings-input-bg": "#FFFFFF",
    "--settings-input-fg": "#000000",
    "--settings-input-border": "#CCCCCC",
    
    // TodoList
    "--todo-bg": "#F3F3F3",
    "--todo-fg": "#333333",
    "--todo-item-bg": "#FFFFFF",
    "--todo-item-hover-bg": "#E8E8E8",
    "--todo-checkbox-border": "#999999",
    "--todo-checkbox-checked-bg": "#0078D4",
    
    // Welcome Screen
    "--welcome-bg": "#FFFFFF",
    "--welcome-fg": "#000000",
    "--welcome-accent": "#0078D4",
    
    // Top Menu
    "--menu-bg": "#FFFFFF",
    "--menu-fg": "#000000",
    "--menu-hover-bg": "#E8E8E8",
    "--menu-active-bg": "#0078D4",
    "--menu-border": "#CCCCCC",
  },
} as const;
