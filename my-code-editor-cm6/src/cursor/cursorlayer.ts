import {EditorView, Decoration, ViewPlugin, ViewUpdate} from "@codemirror/view";



export const smoothCaret = ViewPlugin.fromClass(
  class {
    cursorEl: HTMLElement;

    constructor(view: EditorView) {
      this.cursorEl = document.createElement("div");
      this.cursorEl.className = "cm-smooth-caret";
      
      // Ajouter au contentDOM plutôt qu'au dom principal
      const scroller = view.scrollDOM;
      scroller.appendChild(this.cursorEl);

      console.log("✅ Cursor layer créé :", this.cursorEl);

      // Position initiale
      requestAnimationFrame(() => {
        this.moveCaret(view);
      });
    }

    moveCaret(view: EditorView) {
      const head = view.state.selection.main.head;
      const coords = view.coordsAtPos(head);
      if (!coords) return;

      const scrollRect = view.scrollDOM.getBoundingClientRect();

      this.cursorEl.style.left = coords.left - scrollRect.left + view.scrollDOM.scrollLeft + "px";
      this.cursorEl.style.top = coords.top - scrollRect.top + view.scrollDOM.scrollTop + "px";
      this.cursorEl.style.height = coords.bottom - coords.top + "px";

      console.log("📍 Cursor déplacé :", {
        pos: head,
        left: this.cursorEl.style.left,
        top: this.cursorEl.style.top,
        height: this.cursorEl.style.height,
      });
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        requestAnimationFrame(() => {
          this.moveCaret(update.view);
        });
      }
    }

    destroy() {
      console.log("❌ Cursor layer détruit");
      this.cursorEl.remove();
    }
  }
);
