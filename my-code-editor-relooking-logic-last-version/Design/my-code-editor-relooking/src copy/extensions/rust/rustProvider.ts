import { CompletionContext } from "@codemirror/autocomplete";

const rustKeywords = [
  "fn", "let", "mut", "struct", "enum", "impl", "trait",
  "pub", "use", "mod", "match", "if", "else", "loop",
  "while", "for", "in", "return", "async", "await", "continue", "break", "const", "await", "async", "as", "false", "move", "ref", "Self", "self", "static", "struct", "true", "type", "unsafe", "where", "abstract", "become", "box", "do", "final", "macro", "override", "priv", "try", "typeof", "unsized", "virtual", "yield",
];

const rustSnippets = [
  {
    label: "fn-main",
    type: "snippet",
    apply: "fn main() {\n    println!(\"Hello, world!\");\n}",
    detail: "Rust main function",
  },
  {
    label: "struct-example",
    type: "snippet",
    apply: "struct Point {\n    x: i32,\n    y: i32,\n}",
    detail: "Rust struct example",
  },
];

export function rustSmartProvider(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const text = word.text;

  const keywordOptions = rustKeywords
    .filter((kw) => kw.startsWith(text))
    .map((kw) => ({
      label: kw,
      type: "keyword" as const,
      apply: kw,
    }));

  const snippetOptions = rustSnippets
    .filter((s) => s.label.includes(text))
    .map((s) => ({
      label: s.label,
      type: "snippet" as const,
      apply: s.apply,
      detail: s.detail,
    }));

  return {
    from: word.from,
    options: [...keywordOptions, ...snippetOptions],
  };
}
