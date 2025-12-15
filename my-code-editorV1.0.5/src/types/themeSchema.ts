import { z } from "zod";

export const CustomThemeSchema = z.object({
  name: z.string(),
  palette: z.record(z.string(), z.string()), // toutes les variables CSS doivent être des strings
  typography: z
    .object({
      fontFamily: z.string(),
      fontSize: z.number(),
    })
    .passthrough(), // autorise des clés en plus
  monaco: z.object({
    base: z.enum(["vs", "vs-dark"]),
    rules: z.array(
      z.object({
        token: z.string(),
        foreground: z.string(),
      }),
    ),

    colors: z.record(z.string(), z.string()),
  }),
});

export type CustomThemeValidated = z.infer<typeof CustomThemeSchema>;
