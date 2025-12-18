export function detectLanguageFromFilename(filename: string): "html" | "css" | "js" {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "js";

  // Par défaut, HTML (comme VS Code pour les fichiers inconnus)
  return "html";
}
