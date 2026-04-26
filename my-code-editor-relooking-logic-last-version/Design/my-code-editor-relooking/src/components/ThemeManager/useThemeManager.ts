import { useTheme } from "../../context/ThemeContext";
import { CustomThemeSchema } from "../../types/themeSchema";
import type { CustomTheme } from "../../types/theme";

export function useThemeManager() {
  const { loadCustomTheme, currentTheme } = useTheme();

  // ✅ Import JSON
  const importTheme = async (file: File) => {
    const text = await file.text();

    try {
      const json = JSON.parse(text);
      const parsed = CustomThemeSchema.parse(json) as CustomTheme;
      loadCustomTheme(parsed);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ✅ Export JSON
  const exportTheme = () => {
    if (!currentTheme) return;

    const blob = new Blob([JSON.stringify(currentTheme, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTheme.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { importTheme, exportTheme };
}
