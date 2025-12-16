import React, { createContext, useContext, useEffect, useState } from "react";
import type { ThemeName, CustomTheme } from "../types/theme";
import { UI_THEMES } from "../themes/ui-themes";

type ThemeContextType = {
  themeName: ThemeName; // ✅ contient un nom réel (joe-dark, joe-light, joe-rose…)
  setThemeName: (name: ThemeName) => void;
  loadCustomTheme: (theme: CustomTheme) => void;
  currentTheme: CustomTheme | null;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>("joe-dark");
  const [currentTheme, setCurrentTheme] = useState<CustomTheme | null>(null);

  // ✅ Applique un thème UI (joe-dark / joe-light)
  const applyUITheme = (name: ThemeName) => {
    if (!(name in UI_THEMES)) return; // ✅ évite l’erreur TS7053

    const vars = UI_THEMES[name as keyof typeof UI_THEMES];

    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
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
    }
  }, []);

  // ✅ Quand themeName change → appliquer UI
  useEffect(() => {
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
