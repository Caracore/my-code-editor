import { CompletionContext } from "@codemirror/autocomplete";

// ✅ Mots-clés Python
const pyKeywords = [
  "def", "class", "import", "from", "as",
  "return", "yield", "pass", "break", "continue",
  "if", "elif", "else",
  "for", "while",
  "try", "except", "finally", "raise",
  "with", "lambda",
  "True", "False", "None",
];

// ✅ Snippets premium (multi-lignes, indentation, structures complètes)
const pySnippets = [
  {
    label: "def",
    type: "snippet",
    detail: "function",
    apply: "def ${1:name}(${2:args}):\n    ${3:pass}",
  },
  {
    label: "class",
    type: "snippet",
    detail: "class",
    apply: "class ${1:Name}:\n    def __init__(self, ${2:args}):\n        ${3:pass}",
  },
  {
    label: "for",
    type: "snippet",
    detail: "for loop",
    apply: "for ${1:item} in ${2:iterable}:\n    ${3:pass}",
  },
  {
    label: "while",
    type: "snippet",
    detail: "while loop",
    apply: "while ${1:condition}:\n    ${2:pass}",
  },
  {
    label: "try",
    type: "snippet",
    detail: "try/except",
    apply: "try:\n    ${1:pass}\nexcept ${2:Exception}:\n    ${3:pass}",
  },
  {
    label: "with",
    type: "snippet",
    detail: "with context manager",
    apply: "with ${1:context} as ${2:var}:\n    ${3:pass}",
  },
  {
    label: "main",
    type: "snippet",
    detail: "__main__ guard",
    apply: "if __name__ == \"__main__\":\n    ${1:main()}",
  },
  {
    label: "imp",
    type: "snippet",
    detail: "import module",
    apply: "import ${1:module}",
  },
  {
    label: "from",
    type: "snippet",
    detail: "from module import",
    apply: "from ${1:module} import ${2:name}",
  },
  {
    label: "print",
    type: "snippet",
    detail: "print()",
    apply: "print(${1:value})",
  },
];

// ✅ Provider premium
export function pythonSmartProvider(context: CompletionContext) {
  const word = context.matchBefore(/[\w_]*/);
  if (!word) return null;

  const text = word.text.toLowerCase();

  // ✅ 1. Mots-clés Python
  const keywordOptions = pyKeywords
    .filter(k => k.toLowerCase().startsWith(text))
    .map(k => ({
      label: k,
      type: "keyword",
    }));

  // ✅ 2. Snippets Python
  const snippetOptions = pySnippets
    .filter(s => s.label.toLowerCase().startsWith(text))
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

// import { CompletionContext } from "@codemirror/autocomplete";

// const pyKeywords = [
//   "def", "class", "import", "from", "as",
//   "return", "yield",
//   "if", "elif", "else",
//   "for", "while", "break", "continue",
//   "try", "except", "finally", "raise",
//   "with", "lambda", "pass",
//   "True", "False", "None",
// ];

// const pySnippets = [
//   {
//     label: "def",
//     type: "snippet",
//     detail: "function",
//     apply: "def ${1:name}(${2:args}):\n    ${3:pass}",
//   },
//   {
//     label: "class",
//     type: "snippet",
//     detail: "class",
//     apply: "class ${1:Name}:\n    def __init__(self, ${2:args}):\n        ${3:pass}",
//   },
//   {
//     label: "imp",
//     type: "snippet",
//     detail: "import",
//     apply: "import ${1:module}",
//   },
// ];

// export function pythonSmartProvider(context: CompletionContext) {
//   const word = context.matchBefore(/[\w_]*/);
//   if (!word) return null;

//   const text = word.text.toLowerCase();

//   const keywordOptions = pyKeywords
//     .filter(k => k.toLowerCase().startsWith(text))
//     .map(k => ({
//       label: k,
//       type: "keyword",
//     }));

//   const snippetOptions = pySnippets
//     .filter(s => s.label.startsWith(text))
//     .map(s => ({
//       label: s.label,
//       type: "snippet",
//       detail: s.detail,
//       apply: s.apply,
//     }));

//   return {
//     from: word.from,
//     options: [...keywordOptions, ...snippetOptions],
//   };
// }
