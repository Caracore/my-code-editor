export function detectLanguageFromFilename(filename: string): "html" | "css" | "js"| "python"|"cpp"| "json" | "rust" {
  const lower = filename.toLowerCase();
  // Ajouter d'autres extensions si nécessaire (langues supportées)
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "js";
  if (lower.endsWith(".py") || lower.endsWith(".pyw")) return "python";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".c")) return "cpp";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".rs")) return "rust";
  // Par défaut, HTML (comme VS Code pour les fichiers inconnus)
  return "html";
}
