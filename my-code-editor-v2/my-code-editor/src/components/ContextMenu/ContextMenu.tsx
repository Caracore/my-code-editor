import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./ContextMenu.css";

export interface ContextMenuItem {
  /** Unique key. */
  id: string;
  /** Label shown to the user. Use `"-"` as id for a separator. */
  label?: string;
  /** Optional icon node, rendered before the label. */
  icon?: ReactNode;
  /** Optional keyboard hint shown right-aligned (e.g. "Del"). */
  shortcut?: string;
  /** Disabled items are not selectable. */
  disabled?: boolean;
  /** Render as a destructive item (red text). */
  danger?: boolean;
  /** Click handler. The menu closes automatically after the call. */
  onSelect?: () => void;
  /** Render a horizontal separator (no other props needed). */
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    items.findIndex((it) => !it.separator && !it.disabled)
  );

  // Clamp to viewport after mount.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 4;
    let nx = x;
    let ny = y;
    if (nx + rect.width + margin > window.innerWidth) {
      nx = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (ny + rect.height + margin > window.innerHeight) {
      ny = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (nx !== x || ny !== y) setPos({ x: nx, y: ny });
  }, [x, y, items]);

  // Global handlers: close on outside click / escape / scroll / resize / blur.
  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => nextSelectable(items, i, +1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => nextSelectable(items, i, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = items[activeIndex];
        if (it && !it.separator && !it.disabled) {
          it.onSelect?.();
          onClose();
        }
      }
    };
    const onScroll = () => onClose();
    window.addEventListener("mousedown", onPointer, true);
    window.addEventListener("contextmenu", onPointer, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("blur", onScroll);
    return () => {
      window.removeEventListener("mousedown", onPointer, true);
      window.removeEventListener("contextmenu", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("blur", onScroll);
    };
  }, [items, activeIndex, onClose]);

  return createPortal(
    <div
      ref={ref}
      className="ctxmenu"
      role="menu"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) => {
        if (it.separator) {
          return <div key={it.id || `sep-${i}`} className="ctxmenu__sep" role="separator" />;
        }
        const isActive = i === activeIndex;
        return (
          <button
            type="button"
            key={it.id}
            className={`ctxmenu__item ${it.disabled ? "is-disabled" : ""} ${
              it.danger ? "is-danger" : ""
            } ${isActive ? "is-active" : ""}`}
            disabled={it.disabled}
            role="menuitem"
            onMouseEnter={() => !it.disabled && setActiveIndex(i)}
            onClick={() => {
              if (it.disabled) return;
              it.onSelect?.();
              onClose();
            }}
          >
            <span className="ctxmenu__icon">{it.icon}</span>
            <span className="ctxmenu__label">{it.label}</span>
            {it.shortcut && <span className="ctxmenu__shortcut">{it.shortcut}</span>}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function nextSelectable(items: ContextMenuItem[], from: number, dir: 1 | -1): number {
  if (items.length === 0) return -1;
  let i = from;
  for (let step = 0; step < items.length; step++) {
    i = (i + dir + items.length) % items.length;
    const it = items[i];
    if (!it.separator && !it.disabled) return i;
  }
  return from;
}
