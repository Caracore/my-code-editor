/**
 * Utilitaire de debug pour les thèmes
 */

export function debugTheme() {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  
  const variables = [
    "--primary-bg",
    "--primary-fg",
    "--sidebar-bg",
    "--toolbar-bg",
    "--tabs-bg",
    "--editor-bg",
    "--terminal-bg",
  ];
  
  console.log("🔍 Current CSS Variables:");
  variables.forEach(varName => {
    const value = computed.getPropertyValue(varName).trim();
    console.log(`  ${varName}: ${value || "(not set)"}`);
  });
  
  const dataTheme = root.getAttribute("data-theme");
  console.log(`  data-theme attribute: ${dataTheme || "(not set)"}`);
}

export function forceApplyTheme(themeName: "dark" | "light") {
  console.log(`🔧 Force applying ${themeName} theme...`);
  
  const lightColors = {
    "--primary-bg": "#FFFFFF",
    "--primary-fg": "#000000",
    "--sidebar-bg": "#F3F3F3",
    "--toolbar-bg": "#FFFFFF",
    "--tabs-bg": "#F3F3F3",
  };
  
  const darkColors = {
    "--primary-bg": "#0D0D0D",
    "--primary-fg": "#E0E0E0",
    "--sidebar-bg": "#1e1e1e",
    "--toolbar-bg": "#1A1A1A",
    "--tabs-bg": "#1e1e1e",
  };
  
  const colors = themeName === "light" ? lightColors : darkColors;
  
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
    console.log(`  Set ${key} = ${value}`);
  });
  
  if (themeName === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  
  console.log("✅ Theme force-applied!");
}

// Rendre disponible globalement pour le debug
if (typeof window !== "undefined") {
  (window as any).debugTheme = debugTheme;
  (window as any).forceApplyTheme = forceApplyTheme;
}
