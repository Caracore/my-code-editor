import { CompletionContext } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import { applySnippet } from "./applySnippets.ts";
import { language } from "@codemirror/language";

type HtmlSnippetDef = {
  trigger: string;
  label: string;
  snippet: string;
};

const SNIPPETS: HtmlSnippetDef[] = [
  {
    trigger: "!",
    label: "HTML Boilerplate",
    snippet: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="styles.css" />
  <title>\${1:Document}</title>
</head>
<body>
  \${2}
</body>
</html>`
  },
  {
    trigger: "html",
    label: "HTML Boilerplate",
    snippet: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="styles.css" />
  <title>\${1:Document}</title>
</head>
<body>
  \${2}
</body>
</html>`
  },
  {
    trigger: "div",
    label: "<div>",
    snippet: `<div class="\${1:container}">
  \${2}
</div>`
  },
  {
    trigger: "section",
    label: "<section>",
    snippet: `<section class="\${1:section}">
  \${2}
</section>`
  },
  {
    trigger: "nav",
    label: "<nav>",
    snippet: `<nav class="\${1:nav}">
  \${2}
</nav>`
  },
  {
    trigger: "header",
    label: "<header>",
    snippet: `<header class="\${1:header}">
  \${2}
</header>`
  },
  {
    trigger: "footer",
    label: "<footer>",
    snippet: `<footer class="\${1:footer}">
  \${2}
</footer>`
  },
  {
    trigger: "main",
    label: "<main>",
    snippet: `<main class="\${1:main}">
  \${2}
</main>`
  },
  {
    trigger: "article",
    label: "<article>",
    snippet: `<article class="\${1:article}">
  \${2}
</article>`
  },
  {
    trigger: "img",
    label: "<img>",
    snippet: `<img src="\${1:path/to/image.jpg}" alt="\${2:description}" />`
  },
  {
    trigger: "link",
    label: "<link>",
    snippet: `<link rel="\${1:stylesheet}" href="\${2:style.css}" />`
  },
  {
    trigger: "script",
    label: "<script>",
    snippet: `<script src="\${1:script.js}"></script>`
  },
  {
    trigger: "form",
    label: "<form>",
    snippet: `<form action="\${1:/submit}" method="\${2:post}">
  \${3}
</form>`
  },
  {
    trigger: "input",
    label: "<input>",
    snippet: `<input type="\${1:text}" name="\${2:name}" placeholder="\${3:placeholder}" />`
  },
  {
    trigger: "button",
    label: "<button>",
    snippet: `<button type="\${1:button}">\${2:Label}</button>`
  }
];

export function htmlSnippets(context: CompletionContext) {
  const lang = context.state.facet(language);
  if (!lang || lang.name !== "html") return null;

  const before = context.matchBefore(/[a-zA-Z!]+/);
  if (!before || (before.from === before.to && !context.explicit)) return null;

  const word = before.text;

  const candidates = SNIPPETS.filter(s => s.trigger === word);
  if (!candidates.length) return null;

  const options = candidates.map(s => ({
    label: s.label,
    type: "snippet" as const,
    detail: "HTML snippet",
    apply: (view: EditorView, _completion: any, from: number, to: number) => {
      applySnippet(view, s.snippet, from, to);
    }
  }));

  return {
    from: before.from,
    to: before.to,
    options
  };
}
