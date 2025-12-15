import { z } from "zod";

export const CustomThemeSchema = z.object({
  name: z.string(),
  palette: z.record(z.string(), z.string()),
  typography: z
    .object({
      fontFamily: z.string(),
      fontSize: z.number(),
    })
    .passthrough(),
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
