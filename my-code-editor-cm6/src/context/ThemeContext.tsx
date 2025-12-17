import React, { createContext, useContext, useEffect, useState } from "react";
import type { ThemeName, CustomTheme } from "../types/theme";
import { UI_THEMES } from "../themes/ui-themes";
import "../utils/themeDebug"; // Import pour rendre les fonctions debug disponibles

type ThemeContextType = {
  themeName: ThemeName; // ✅ contient un nom réel (joe-dark, joe-light, joe-rose…)
  setThemeName: (name: ThemeName) => void;
  loadCustomTheme: (theme: CustomTheme) => void;
  currentTheme: CustomTheme | null;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>("dark");
  const [currentTheme, setCurrentTheme] = useState<CustomTheme | null>(null);

  // ✅ Applique un thème UI (dark / light)
  const applyUITheme = (name: ThemeName) => {
    console.log("🎨 applyUITheme called with:", name);
    
    if (!(name in UI_THEMES)) {
      console.warn("⚠️ Theme not found in UI_THEMES:", name);
      return;
    }

    const vars = UI_THEMES[name as keyof typeof UI_THEMES];
    console.log("✅ Applying", Object.keys(vars).length, "CSS variables for theme:", name);
    
    // Log quelques valeurs pour debug
    console.log("📝 Sample values:", {
      "--primary-bg": vars["--primary-bg"],
      "--toolbar-bg": vars["--toolbar-bg"],
      "--sidebar-bg": vars["--sidebar-bg"]
    });

    // Applique les variables CSS au document root
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
    
    // Vérification après application
    const applied = getComputedStyle(document.documentElement).getPropertyValue("--primary-bg");
    console.log("✅ Verification: --primary-bg after apply =", applied);

    // Applique l'attribut data-theme pour permettre le ciblage CSS
    if (name === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.style.backgroundColor = vars["--primary-bg"] as string;
      document.body.style.color = vars["--primary-fg"] as string;
      console.log("🌞 Light theme attribute set + body styles applied");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.body.style.backgroundColor = vars["--primary-bg"] as string;
      document.body.style.color = vars["--primary-fg"] as string;
      console.log("🌙 Dark theme (no attribute) + body styles applied");
    }
  };

  // ✅ Applique un thème custom (UI uniquement)
  const applyCustomTheme = (theme: CustomTheme) => {
    Object.entries(theme.palette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  };

  // ✅ Charge un thème custom
  const loadCustomTheme = (theme: CustomTheme) => {
    setCurrentTheme(theme);

    // ✅ On stocke le vrai nom du thème (ex: "joe-rose")
    localStorage.setItem("customTheme", JSON.stringify(theme));
    localStorage.setItem("themeName", theme.name);

    applyCustomTheme(theme);

    // ✅ IMPORTANT : themeName = nom réel du thème Monaco
    setThemeName(theme.name as ThemeName);
  };

  // ✅ Restauration au démarrage
  useEffect(() => {
    const savedThemeName = localStorage.getItem("themeName");
    const savedCustom = localStorage.getItem("customTheme");

    console.log("💾 Loading saved theme:", { savedThemeName, hasCustom: !!savedCustom });

    if (savedCustom) {
      const parsed = JSON.parse(savedCustom) as CustomTheme;
      setCurrentTheme(parsed);
      applyCustomTheme(parsed);

      // ✅ On restaure le vrai nom du thème custom
      setThemeName(parsed.name as ThemeName);
      return;
    }

    if (savedThemeName) {
      setThemeName(savedThemeName as ThemeName);
    } else {
      // Appliquer le thème par défaut (dark) au premier chargement
      applyUITheme("dark");
    }
  }, []);

  // ✅ Quand themeName change → appliquer UI
  useEffect(() => {    console.log("🎨 Applying theme:", themeName, "Custom:", currentTheme?.name);
        // ✅ Si c’est un thème custom → appliquer palette custom
    if (currentTheme && themeName === currentTheme.name) {
      applyCustomTheme(currentTheme);
      return;
    }

    // ✅ Sinon → thème UI normal
    applyUITheme(themeName);
  }, [themeName, currentTheme]);

  // ✅ Mise à jour du thème UI
  const updateThemeName = (name: ThemeName) => {
    // Si on change vers un thème built-in (dark/light), effacer le custom theme
    if (name === "dark" || name === "light") {
      setCurrentTheme(null);
      localStorage.removeItem("customTheme");
    }
    
    setThemeName(name);
    localStorage.setItem("themeName", name);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeName, // ✅ contient maintenant "joe-rose" ou "joe-dark"
        setThemeName: updateThemeName,
        loadCustomTheme,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
