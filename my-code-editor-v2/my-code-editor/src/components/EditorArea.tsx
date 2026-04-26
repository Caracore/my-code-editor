import "./EditorArea.css";

/**
 * Pseudo-syntax-highlighted code preview.
 * Each line is split into colored tokens manually so it looks "real"
 * without depending on a syntax engine.
 */
type Tok = { c?: string; t: string };
type Line = { gutter: { number: number; mark?: "M" | "+" | null }; toks: Tok[] };

const k = (t: string): Tok => ({ c: "kw", t });
const f = (t: string): Tok => ({ c: "fn", t });
const s = (t: string): Tok => ({ c: "str", t });
const n = (t: string): Tok => ({ c: "num", t });
const co = (t: string): Tok => ({ c: "com", t });
const ty = (t: string): Tok => ({ c: "type", t });
const p = (t: string): Tok => ({ c: "punct", t });
const tag = (t: string): Tok => ({ c: "tag", t });
const pr = (t: string): Tok => ({ c: "prop", t });
const x = (t: string): Tok => ({ t });

const lines: Line[] = [
  { gutter: { number: 1 }, toks: [co("// EditorArea — heart of the IDE")] },
  { gutter: { number: 2 }, toks: [k("import"), x(" "), p("{ "), x("useMemo, useState"), p(" }"), x(" "), k("from"), x(" "), s('"react"'), p(";")] },
  { gutter: { number: 3 }, toks: [k("import"), x(" "), x("type "), p("{ "), ty("Document"), p(" }"), x(" "), k("from"), x(" "), s('"./types"'), p(";")] },
  { gutter: { number: 4 }, toks: [x("")] },
  { gutter: { number: 5, mark: "+" }, toks: [k("export"), x(" "), k("default"), x(" "), k("function"), x(" "), f("EditorArea"), p("("), p(") "), p("{")] },
  { gutter: { number: 6 }, toks: [x("  "), k("const"), x(" "), p("["), x("doc, setDoc"), p("] = "), f("useState"), p("<"), ty("Document"), p(">("), x("initial"), p(");")] },
  { gutter: { number: 7, mark: "M" }, toks: [x("  "), k("const"), x(" "), x("stats = "), f("useMemo"), p("(() => "), p("({")] },
  { gutter: { number: 8 }, toks: [x("    "), pr("lines"), p(": "), x("doc.lines.length"), p(",")] },
  { gutter: { number: 9 }, toks: [x("    "), pr("words"), p(": "), x("doc.text.split"), p("("), s('/\\s+/'), p(").length"), p(",")] },
  { gutter: { number: 10 }, toks: [x("    "), pr("chars"), p(": "), x("doc.text.length"), p(",")] },
  { gutter: { number: 11 }, toks: [x("  "), p("})"), p(", ["), x("doc"), p("]);")] },
  { gutter: { number: 12 }, toks: [x("")] },
  { gutter: { number: 13 }, toks: [x("  "), k("return"), x(" "), p("(")] },
  { gutter: { number: 14 }, toks: [x("    "), p("<"), tag("section"), x(" "), pr("className"), p("="), s('"editor"'), p(">")] },
  { gutter: { number: 15, mark: "M" }, toks: [x("      "), p("<"), tag("Toolbar"), x(" "), pr("doc"), p("="), p("{"), x("doc"), p("}"), x(" "), p("/>")] },
  { gutter: { number: 16 }, toks: [x("      "), p("<"), tag("Canvas"), x(" "), pr("value"), p("="), p("{"), x("doc.text"), p("}"), x(" "), pr("onChange"), p("="), p("{"), x("setDoc"), p("}"), x(" "), p("/>")] },
  { gutter: { number: 17 }, toks: [x("      "), p("<"), tag("MiniMap"), x(" "), pr("lines"), p("="), p("{"), n("stats.lines"), p("}"), x(" "), p("/>")] },
  { gutter: { number: 18 }, toks: [x("    "), p("</"), tag("section"), p(">")] },
  { gutter: { number: 19 }, toks: [x("  "), p(");")] },
  { gutter: { number: 20 }, toks: [p("}")] },
  { gutter: { number: 21 }, toks: [x("")] },
  { gutter: { number: 22 }, toks: [co("// TODO: hook up LSP completions + AI inline suggestions ✨")] },
];

export default function EditorArea() {
  return (
    <div className="editor">
      <div className="editor__breadcrumbs">
        <span>src</span><span className="editor__bc-sep">›</span>
        <span>components</span><span className="editor__bc-sep">›</span>
        <span className="editor__bc-current">EditorArea.tsx</span>
        <span className="editor__bc-sep">›</span>
        <span className="editor__bc-symbol">EditorArea()</span>
      </div>

      <div className="editor__viewport">
        <div className="editor__lines">
          {lines.map((ln) => (
            <div key={ln.gutter.number} className={`code-line ${ln.gutter.number === 7 ? "is-cursor" : ""}`}>
              <span className="code-line__gutter">
                <span className={`code-line__mark code-line__mark--${ln.gutter.mark ?? "none"}`} />
                <span className="code-line__num">{ln.gutter.number}</span>
              </span>
              <span className="code-line__content">
                {ln.toks.map((t, i) => (
                  <span key={i} className={t.c ? `tok tok--${t.c}` : ""}>{t.t}</span>
                ))}
                {ln.gutter.number === 7 && <span className="code-caret" />}
              </span>
            </div>
          ))}
        </div>

        <div className="editor__minimap" aria-hidden>
          {lines.map((_, i) => (
            <div
              key={i}
              className="minimap__row"
              style={{
                width: `${20 + ((i * 13) % 70)}%`,
                opacity: 0.35 + ((i * 7) % 50) / 100,
              }}
            />
          ))}
          <div className="minimap__viewport" />
        </div>
      </div>
    </div>
  );
}

