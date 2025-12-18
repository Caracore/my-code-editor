export function detectLanguageFromFilename(filename: string): "html" | "css" | "js"| "python" {
  const lower = filename.toLowerCase();
  // Ajouter d'autres extensions si nécessaire (langues supportées)
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "js";
  if (lower.endsWith(".py") || lower.endsWith(".pyw")) return "python";
  
  // Par défaut, HTML (comme VS Code pour les fichiers inconnus)
  return "html";
}
