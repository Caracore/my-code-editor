// completions/htmlSnippets.ts
import { CompletionContext } from "@codemirror/autocomplete";

export function htmlSnippets(context: CompletionContext) {
  const word = context.matchBefore(/html/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    to: word.to,
    options: [
      {
        label: "HTML Boilerplate",
        type: "snippet",
        detail: "Insert HTML skeleton",
        info: "Squelette HTML complet",
        apply: `<!-- Created with My Code Editor CM6 -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="styles.css" />
  <title>Document</title>
</head>
<body>
  
</body>
</html>`
      }
    ]
  };
}