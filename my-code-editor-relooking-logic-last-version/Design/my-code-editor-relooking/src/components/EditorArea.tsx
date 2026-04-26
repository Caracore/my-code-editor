import "./EditorArea.css";

type Tok = { t: string; c?: string };

const lines: Tok[][] = [
  [{ t: "import", c: "kw" }, { t: " " }, { t: "React" }, { t: " " }, { t: "from", c: "kw" }, { t: " " }, { t: "\"react\"", c: "str" }, { t: ";", c: "p" }],
  [{ t: "import", c: "kw" }, { t: " " }, { t: "{ " }, { t: "useState", c: "fn" }, { t: " }" }, { t: " " }, { t: "from", c: "kw" }, { t: " " }, { t: "\"react\"", c: "str" }, { t: ";", c: "p" }],
  [],
  [{ t: "// Bienvenue dans Lumen IDE — un IDE pensé pour vous.", c: "cm" }],
  [{ t: "export", c: "kw" }, { t: " " }, { t: "default", c: "kw" }, { t: " " }, { t: "function", c: "kw" }, { t: " " }, { t: "App", c: "fn" }, { t: "() {" }],
  [{ t: "  " }, { t: "const", c: "kw" }, { t: " [" }, { t: "count", c: "var" }, { t: ", " }, { t: "setCount", c: "fn" }, { t: "] = " }, { t: "useState", c: "fn" }, { t: "(", c: "p" }, { t: "0", c: "num" }, { t: ");", c: "p" }],
  [],
  [{ t: "  " }, { t: "return", c: "kw" }, { t: " (" }],
  [{ t: "    " }, { t: "<", c: "p" }, { t: "div", c: "tag" }, { t: " " }, { t: "className", c: "attr" }, { t: "=", c: "p" }, { t: "\"app\"", c: "str" }, { t: ">", c: "p" }],
  [{ t: "      " }, { t: "<", c: "p" }, { t: "h1", c: "tag" }, { t: ">", c: "p" }, { t: "Hello, Developer 👋" }, { t: "</", c: "p" }, { t: "h1", c: "tag" }, { t: ">", c: "p" }],
  [{ t: "      " }, { t: "<", c: "p" }, { t: "button", c: "tag" }, { t: " " }, { t: "onClick", c: "attr" }, { t: "=", c: "p" }, { t: "{", c: "p" }, { t: "() => " }, { t: "setCount", c: "fn" }, { t: "(", c: "p" }, { t: "count", c: "var" }, { t: " + " }, { t: "1", c: "num" }, { t: ")", c: "p" }, { t: "}", c: "p" }, { t: ">", c: "p" }],
  [{ t: "        Count: {" }, { t: "count", c: "var" }, { t: "}" }],
  [{ t: "      " }, { t: "</", c: "p" }, { t: "button", c: "tag" }, { t: ">", c: "p" }],
  [{ t: "    " }, { t: "</", c: "p" }, { t: "div", c: "tag" }, { t: ">", c: "p" }],
  [{ t: "  );" }],
  [{ t: "}" }],
];

export default function EditorArea() {
  return (
    <div className="editor">
      <div className="editor__gutter" aria-hidden>
        {lines.map((_, i) => (
          <div key={i} className={`editor__lineno ${i === 5 ? "is-active" : ""}`}>
            {i + 1}
          </div>
        ))}
      </div>

      <div className="editor__code">
        <div className="editor__active-line" />
        {lines.map((line, i) => (
          <div key={i} className="editor__line">
            {line.length === 0 ? (
              <span>&nbsp;</span>
            ) : (
              line.map((tok, j) => (
                <span key={j} className={tok.c ? `tk tk-${tok.c}` : undefined}>
                  {tok.t}
                </span>
              ))
            )}
            {i === 5 && <span className="editor__cursor" />}
          </div>
        ))}

        <div className="editor__minimap" aria-hidden>
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="mini__line"
              style={{ width: `${20 + ((i * 37) % 70)}%` }}
            />
          ))}
          <div className="mini__viewport" />
        </div>
      </div>

      <div className="editor__inline-suggestion">
        <span className="suggestion__icon">✨</span>
        <span>
          Lumen suggests:{" "}
          <code>setCount((c) =&gt; c + 1)</code> for safer state updates
        </span>
        <kbd className="kbd">Tab</kbd>
      </div>
    </div>
  );
}
