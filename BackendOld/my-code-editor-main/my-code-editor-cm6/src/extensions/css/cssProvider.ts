import { CompletionContext } from "@codemirror/autocomplete";

const cssProperties = [
  "display",
  "position",
  "background",
  "background-color",
  "color",
  "margin",
  "padding",
  "width",
  "height",
  "border",
  "border-radius",
  "flex",
  "flex-direction",
  "justify-content",
  "align-items",
  "gap",
  "font-size",
  "font-weight",
  "text-align",
  "overflow",
  "z-index",
];

const cssValues: Record<string, string[]> = {
  display: ["block", "inline", "inline-block", "flex", "grid", "none"],
  position: ["absolute", "relative", "fixed", "sticky"],
  "justify-content": ["center", "space-between", "space-around", "flex-start", "flex-end"],
  "align-items": ["center", "flex-start", "flex-end"],
  "flex-direction": ["row", "column"],
};

const cssSnippets = [
  {
    label: "flex-center",
    type: "snippet",
    apply: "display: flex;\njustify-content: center;\nalign-items: center;",
    detail: "display flex + centering",
  },
  {
    label: "absolute-center",
    type: "snippet",
    apply: "position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);",
    detail: "absolute centering",
  },
];

export function cssSmartProvider(context: CompletionContext) {
  const word = context.matchBefore(/[\w-]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const text = word.text;

  // ✅ 1. Suggestions de propriétés CSS
  const propertyOptions = cssProperties
    .filter((prop) => prop.toLowerCase().includes(text.toLowerCase()))
    .map((prop) => ({
      label: prop,
      type: "property" as const,
      apply: prop + ": ",
    }));

  // ✅ 2. Suggestions de valeurs CSS selon la propriété
  const line = context.state.doc.lineAt(context.pos).text;
  const matchProp = line.match(/([\w-]+)\s*:\s*([\w-]*)$/);

  let valueOptions: Array<{label: string, type: "keyword", apply: string}> = [];
  if (matchProp) {
    const propName = matchProp[1];
    const currentValue = matchProp[2];

    if (cssValues[propName]) {
      valueOptions = cssValues[propName]
        .filter((v) => v.toLowerCase().includes(currentValue.toLowerCase()))
        .map((v) => ({
          label: v,
          type: "keyword" as const,
          apply: v + ";",
        }));
    }
  }

  // ✅ 3. Snippets CSS
  const snippetOptions = cssSnippets
    .filter((s) => s.label.toLowerCase().includes(text.toLowerCase()))
    .map((s) => ({
      label: s.label,
      type: "text" as const,
      apply: s.apply,
      detail: s.detail,
    }));

  return {
    from: word.from,
    options: [...propertyOptions, ...valueOptions, ...snippetOptions],
  };
}
