import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { Compartment } from "@codemirror/state";

/**
 * Lightweight minimap extension for CodeMirror 6.
 *
 * Why custom rather than `@replit/codemirror-minimap`?
 *   - keeps the dependency surface tight,
 *   - lets us bind theming to our CSS variables,
 *   - the IDE's needs are modest (overview + jump-to-line).
 *
 * The view plugin attaches a `<canvas>` to `view.dom` (positioned absolute
 * in the editor's viewport) and re-renders:
 *   - on doc changes,
 *   - on viewport / geometry changes,
 *   - on theme changes (caller can `redrawMinimap(view)` after applying).
 *
 * Each rendered "pixel-line" is one source line, painted as a single
 * solid-colour bar whose width approximates the line's content density.
 * It's not a syntax-aware mini-render but it's fast and gives a decent
 * sense of the file's shape — same approach VS Code's minimap defaults to
 * with `editor.minimap.renderCharacters: false`.
 */

const MINIMAP_WIDTH = 88;          // px — width of the minimap column.
const LINE_HEIGHT_PX = 2;          // px per source line in the minimap.
const PADDING = 4;                 // px of inner padding on the minimap.

export const minimapCompartment = new Compartment();

interface MinimapState {
  canvas: HTMLCanvasElement;
  viewport: HTMLDivElement;
  wrapper: HTMLDivElement;
  resizeObs: ResizeObserver;
  scrollHandler: () => void;
  scrollerEl: HTMLElement | null;
}

const minimapPlugin = ViewPlugin.fromClass(
  class {
    private state: MinimapState;
    private rafHandle: number | null = null;

    constructor(public view: EditorView) {
      const wrapper = document.createElement("div");
      wrapper.className = "cm-minimap";
      const canvas = document.createElement("canvas");
      canvas.className = "cm-minimap__canvas";
      const viewport = document.createElement("div");
      viewport.className = "cm-minimap__viewport";
      wrapper.appendChild(canvas);
      wrapper.appendChild(viewport);

      // Append to the editor's DOM so it lives inside .cm-editor and
      // inherits the host's positioning context.
      view.dom.appendChild(wrapper);
      view.dom.classList.add("cm-has-minimap");

      const resizeObs = new ResizeObserver(() => this.scheduleRender());
      resizeObs.observe(view.dom);

      const scrollHandler = () => this.scheduleRender();
      // The actual scroll happens on .cm-scroller; remember it so we can
      // detach cleanly in destroy().
      const scrollerEl = view.scrollDOM;
      scrollerEl.addEventListener("scroll", scrollHandler, { passive: true });

      this.state = { canvas, viewport, wrapper, resizeObs, scrollHandler, scrollerEl };

      // Click / drag to scroll.
      let dragging = false;
      const onPointer = (e: PointerEvent) => {
        const rect = wrapper.getBoundingClientRect();
        const yWithin = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const ratio = rect.height === 0 ? 0 : yWithin / rect.height;
        const scroller = view.scrollDOM;
        const target = ratio * (scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = target;
      };
      wrapper.addEventListener("pointerdown", (e) => {
        dragging = true;
        wrapper.setPointerCapture(e.pointerId);
        onPointer(e);
      });
      wrapper.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        onPointer(e);
      });
      wrapper.addEventListener("pointerup", (e) => {
        dragging = false;
        try { wrapper.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      });
      wrapper.addEventListener("pointercancel", () => { dragging = false; });

      this.scheduleRender();
    }

    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || u.geometryChanged) {
        this.scheduleRender();
      }
    }

    private scheduleRender() {
      if (this.rafHandle != null) return;
      this.rafHandle = requestAnimationFrame(() => {
        this.rafHandle = null;
        this.render();
      });
    }

    private render() {
      const { canvas, viewport, wrapper } = this.state;
      const view = this.view;
      const scroller = view.scrollDOM;

      // Sync wrapper height with the scroller (so it spans the full
      // editor body, not the gutter padding).
      wrapper.style.height = `${scroller.clientHeight}px`;

      const cssWidth = MINIMAP_WIDTH;
      const cssHeight = scroller.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const doc = view.state.doc;
      const totalLines = doc.lines;
      // Vertical scaling: at most LINE_HEIGHT_PX per line, but compress
      // when the file is too tall to fit.
      const maxLinesShown = Math.max(
        1,
        Math.floor((cssHeight - PADDING * 2) / LINE_HEIGHT_PX),
      );
      const compressed = totalLines > maxLinesShown;
      const linesShown = compressed ? maxLinesShown : totalLines;
      const lineHeight = compressed
        ? (cssHeight - PADDING * 2) / linesShown
        : LINE_HEIGHT_PX;
      const innerWidth = cssWidth - PADDING * 2;

      const fg = readVar("--text-3", "#9aa0a6");
      ctx.fillStyle = fg;

      // Render lines. When compressed, sample every Nth line; otherwise
      // render all lines.
      const step = totalLines / linesShown;
      for (let i = 0; i < linesShown; i++) {
        const lineNo = Math.min(totalLines, Math.floor(i * step) + 1);
        const text = doc.line(lineNo).text;
        // Strip leading whitespace so indented lines visually carve out
        // a left margin like the real text does.
        const trimmedStart = text.search(/\S/);
        if (trimmedStart < 0) continue; // blank line — leave the row empty
        const indent = trimmedStart;
        const len = text.length - indent;
        const visualLen = Math.min(len, 80); // clamp super long lines
        const x = PADDING + Math.min(indent, 30);
        const w = Math.max(1, (visualLen / 80) * (innerWidth - Math.min(indent, 30)));
        const y = PADDING + i * lineHeight;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x, y, w, Math.max(1, lineHeight - 0.4));
      }
      ctx.globalAlpha = 1;

      // Viewport indicator: maps the visible portion of the scroller to
      // the minimap.
      const totalH = scroller.scrollHeight || 1;
      const top = (scroller.scrollTop / totalH) * cssHeight;
      const height = Math.max(
        14,
        (scroller.clientHeight / totalH) * cssHeight,
      );
      viewport.style.top = `${Math.round(top)}px`;
      viewport.style.height = `${Math.round(height)}px`;
    }

    destroy() {
      const { wrapper, resizeObs, scrollerEl, scrollHandler } = this.state;
      resizeObs.disconnect();
      if (scrollerEl) scrollerEl.removeEventListener("scroll", scrollHandler);
      wrapper.remove();
      this.view.dom.classList.remove("cm-has-minimap");
      if (this.rafHandle != null) cancelAnimationFrame(this.rafHandle);
    }
  }
);

/** Resolve a CSS custom property at the document root, with a fallback. */
function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

/** The CodeMirror extension you wrap in a `Compartment` to toggle live. */
export function minimap() {
  return [
    minimapPlugin,
    EditorView.theme({
      ".cm-has-minimap .cm-scroller": {
        // Reserve room on the right for the minimap.
        paddingRight: `${MINIMAP_WIDTH}px`,
      },
      ".cm-minimap": {
        position: "absolute",
        top: "0",
        right: "0",
        width: `${MINIMAP_WIDTH}px`,
        backgroundColor: "var(--bg-3, #1e232c)",
        borderLeft: "1px solid var(--border-1, #232934)",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
      },
      ".cm-minimap__canvas": {
        display: "block",
      },
      ".cm-minimap__viewport": {
        position: "absolute",
        left: "0",
        right: "0",
        backgroundColor: "var(--accent-soft, rgba(124, 92, 255, 0.18))",
        borderTop: "1px solid var(--accent, #7c5cff)",
        borderBottom: "1px solid var(--accent, #7c5cff)",
        pointerEvents: "none",
      },
    }),
  ];
}
