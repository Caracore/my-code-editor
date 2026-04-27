import { useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { startResize } from "../../hooks/useResize";

export type ResizeEdge = "right" | "left" | "top";

interface ResizeHandleProps {
  edge: ResizeEdge;
  /** Current size of the panel being resized. */
  size: number;
  onResize: (size: number) => void;
  min?: number;
  max?: number;
}

/**
 * Thin draggable handle absolutely positioned on a panel edge.
 * The parent must be `position: relative`.
 */
export default function ResizeHandle({
  edge,
  size,
  onResize,
  min,
  max,
}: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const axis: "horizontal" | "vertical" = edge === "top" ? "vertical" : "horizontal";
      // For sidebar (drag right edge) +1; for right panel (drag left edge) -1;
      // for bottom panel (drag top edge) -1.
      const direction: 1 | -1 = edge === "right" ? 1 : -1;
      setDragging(true);
      startResize({
        event: e,
        axis,
        initial: size,
        direction,
        min,
        max,
        onChange: onResize,
        onEnd: () => setDragging(false),
      });
    },
    [edge, size, onResize, min, max],
  );

  return (
    <div
      className={`resize-handle resize-handle--${edge}${dragging ? " is-dragging" : ""}`}
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation={edge === "top" ? "horizontal" : "vertical"}
    />
  );
}
