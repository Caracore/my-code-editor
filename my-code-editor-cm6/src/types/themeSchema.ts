import { z } from "zod";

// Schéma pour les thèmes personnalisés avec CodeMirror 6
export const CustomThemeSchema = z.object({
  name: z.string(),
  palette: z.record(z.string(), z.string()), // Variables CSS (ex: --editor-bg: "#000000")
  typography: z
    .object({
      fontFamily: z.string(),
      fontSize: z.number(),
    })
    .passthrough(), // Autorise des clés supplémentaires
  // Configuration CodeMirror 6 (optionnel)
  codemirror: z.object({
    dark: z.boolean().optional(), // true pour thème sombre, false pour clair
    highlightActiveLine: z.boolean().optional(),
    highlightActiveLineGutter: z.boolean().optional(),
  }).optional(),
});

export type CustomThemeValidated = z.infer<typeof CustomThemeSchema>;
