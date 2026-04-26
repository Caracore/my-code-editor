import { CompletionContext } from "@codemirror/autocomplete";

const jsKeywords = [
  "const", "let", "var",
  "function", "return", "class", "extends",
  "import", "export", "default",
  "if", "else", "switch", "case",
  "for", "while", "do",
  "try", "catch", "finally",
  "new", "this", "super",
  "async", "await",
];

const jsSnippets = [
  {
    label: "fn",
    type: "snippet",
    detail: "function declaration",
    apply: "function ${1:name}(${2:args}) {\n  ${3:// code}\n}",
  },
  {
    label: "cl",
    type: "snippet",
    detail: "console.log",
    apply: "console.log(${1:value});",
  },
  {
    label: "imp",
    type: "snippet",
    detail: "import statement",
    apply: "import ${1:module} from '${2:path}';",
  },
];

export function jsSmartProvider(context: CompletionContext) {
  const word = context.matchBefore(/[\w$]*/);
  if (!word) return null;

  const text = word.text.toLowerCase();

  const keywordOptions = jsKeywords
    .filter(k => k.startsWith(text))
    .map(k => ({
      label: k,
      type: "keyword",
    }));

  const snippetOptions = jsSnippets
    .filter(s => s.label.startsWith(text))
    .map(s => ({
      label: s.label,
      type: "snippet",
      detail: s.detail,
      apply: s.apply,
    }));

  return {
    from: word.from,
    options: [...keywordOptions, ...snippetOptions],
  };
}
