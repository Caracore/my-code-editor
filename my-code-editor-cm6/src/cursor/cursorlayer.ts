import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

export const smoothCaret = ViewPlugin.fromClass(
  class {
    cursorEl: HTMLElement;

    constructor(view: EditorView) {
      this.cursorEl = document.createElement("div");
      this.cursorEl.className = "cm-smooth-caret";
      view.dom.appendChild(this.cursorEl);

      console.log("✅ Cursor layer créé :", this.cursorEl);

      // 🔥 clic souris
      view.dom.addEventListener("mousedown", (event) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return;

        requestAnimationFrame(() => {
          this.moveCaret(view, pos);
        });
      });

      // 🔥 frappe clavier
      view.dom.addEventListener("keydown", () => {
        const head = view.state.selection.main.head;
        requestAnimationFrame(() => {
          this.moveCaret(view, head);
        });
      });
    }

    moveCaret(view: EditorView, pos: number) {
      const coords = view.coordsAtPos(pos);
      if (!coords) return;

      const parentRect = view.dom.getBoundingClientRect();

      this.cursorEl.style.left = coords.left - parentRect.left + "px";
      this.cursorEl.style.top = coords.top - parentRect.top + "px";
      this.cursorEl.style.height = coords.bottom - coords.top + "px";

      console.log("📍 Cursor déplacé :", {
        left: this.cursorEl.style.left,
        top: this.cursorEl.style.top,
        height: this.cursorEl.style.height,
      });

      // Animation shrink
      this.cursorEl.classList.remove("animate");
      void this.cursorEl.offsetWidth;
      this.cursorEl.classList.add("animate");
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        const head = update.state.selection.main.head;
        requestAnimationFrame(() => {
          this.moveCaret(update.view, head);
        });
      }
    }

    destroy() {
      console.log("❌ Cursor layer détruit");
      this.cursorEl.remove();
    }
  }
);
