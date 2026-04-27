import type { PointerEvent as ReactPointerEvent } from "react";

export type ResizeAxis = "horizontal" | "vertical";

export interface StartResizeOptions {
  event: ReactPointerEvent | { clientX: number; clientY: number; preventDefault?: () => void };
  axis: ResizeAxis;
  /** Current size of the panel at drag start. */
  initial: number;
  /**
   * +1 when dragging the *right* (horizontal) or *bottom* (vertical) edge of
   * the resized element — moving the cursor away from the panel grows it.
   * -1 when dragging the *left* / *top* edge — moving away grows it.
   */
  direction: 1 | -1;
  min?: number;
  max?: number;
  onChange: (size: number) => void;
  onEnd?: (size: number) => void;
}

/**
 * Generic edge-drag resize. Captures the document until pointer-up.
 * Adds a body-level cursor + selection lock for the duration of the drag.
 */
export function startResize({
  event,
  axis,
  initial,
  direction,
  min = 120,
  max = 1200,
  onChange,
  onEnd,
}: StartResizeOptions): void {
  event.preventDefault?.();
  const startX = event.clientX;
  const startY = event.clientY;
  let last = initial;

  const cursor = axis === "horizontal" ? "col-resize" : "row-resize";
  const prevBodyCursor = document.body.style.cursor;
  const prevBodyUserSelect = document.body.style.userSelect;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";

  function onMove(ev: PointerEvent) {
    const delta = axis === "horizontal" ? ev.clientX - startX : ev.clientY - startY;
    const next = Math.max(min, Math.min(max, initial + direction * delta));
    if (next !== last) {
      last = next;
      onChange(next);
    }
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.body.style.cursor = prevBodyCursor;
    document.body.style.userSelect = prevBodyUserSelect;
    onEnd?.(last);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

/* ----------------------------------------------------------------- */
/* Backwards-compatible helpers (kept so old call sites don't break) */
/* ----------------------------------------------------------------- */

export function useResize() {
  return {
    startResizeRight(
      e: ReactPointerEvent | React.MouseEvent,
      setWidth: React.Dispatch<React.SetStateAction<number>>,
    ) {
      let current = 0;
      setWidth((prev) => {
        current = prev;
        return prev;
      });
      startResize({
        event: e as ReactPointerEvent,
        axis: "horizontal",
        initial: current,
        direction: -1,
        min: 150,
        max: 900,
        onChange: (s) => setWidth(s),
      });
    },
    startResizeBottom(
      e: ReactPointerEvent | React.MouseEvent,
      setHeight: React.Dispatch<React.SetStateAction<number>>,
    ) {
      let current = 0;
      setHeight((prev) => {
        current = prev;
        return prev;
      });
      startResize({
        event: e as ReactPointerEvent,
        axis: "vertical",
        initial: current,
        direction: -1,
        min: 100,
        max: 800,
        onChange: (s) => setHeight(s),
      });
    },
  };
}
