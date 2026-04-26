import { CompletionContext } from "@codemirror/autocomplete";

const cppKeywords = [
  "int", "float", "double", "char", "class", "struct", "template",
  "public", "private", "protected", "virtual", "override",
  "namespace", "using", "return", "if", "else", "switch", "case",
  "for", "while", "do", "break", "continue", "new", "delete", // A partir de  la ligne en dessous aide de TrogLau de discord
   "alignas","alignof","and","and_eq","asm","atomic",
  "auto","bitand","bitor","bool","break",
  "case","catch","char","class",
  "co_await","co_return","co_yield",
  "concept","const","consteval","constexpr","constinit",
  "const_cast","continue",
  "decltype","default","delete","do","double","dynamic_cast",
  "else","enum","explicit","export","extern",
  "false","final","float","for","friend",
  "goto",
  "if","inline","int",
  "long","mutable",
  "namespace","new","noexcept","nullptr",
  "operator","or","or_eq","override",
  "private","protected","public",
  "register","reinterpret_cast","requires","return",
  "short","signed","sizeof","static","static_assert","static_cast",
  "struct","switch","synchronized",
  "template","this","thread_local","throw","true","try","typedef","typeid","typename",
  "union","unsigned","using",
  "virtual","void","volatile",
  "wchar_t","while","xor","xor_eq"
];

const cppSnippets = [
  {
    label: "main-func",
    type: "snippet",
    apply: "int main() {\n    return 0;\n}",
    detail: "C++ main function",
  },
  {
    label: "class-example",
    type: "snippet",
    apply: "class MyClass {\npublic:\n    void hello() {\n        std::cout << \"Hello!\";\n    }\n};",
    detail: "C++ class example",
  },
];

export function cppSmartProvider(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const text = word.text;

  const keywordOptions = cppKeywords
    .filter((kw) => kw.startsWith(text))
    .map((kw) => ({
      label: kw,
      type: "keyword" as const,
      apply: kw,
    }));

  const snippetOptions = cppSnippets
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
