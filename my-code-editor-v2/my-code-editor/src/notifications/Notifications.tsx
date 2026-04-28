import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { I } from "../components/Icons";
import "./Notifications.css";

export type NotificationKind = "info" | "success" | "warn" | "error";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title?: string;
  message: string;
  /** ms before auto-dismiss. 0 / undefined = sticky (manual dismiss). */
  timeout?: number;
  /** Optional action button. */
  action?: { label: string; run: () => void };
}

interface ShowOptions extends Omit<Notification, "id"> {}

interface NotificationCtx {
  list: Notification[];
  show: (n: ShowOptions) => string;
  info: (message: string, opts?: Partial<ShowOptions>) => string;
  success: (message: string, opts?: Partial<ShowOptions>) => string;
  warn: (message: string, opts?: Partial<ShowOptions>) => string;
  error: (message: string, opts?: Partial<ShowOptions>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const Ctx = createContext<NotificationCtx | null>(null);

/** Default auto-dismiss windows per kind. Errors stick until dismissed. */
const DEFAULT_TIMEOUTS: Record<NotificationKind, number> = {
  info: 4000,
  success: 3500,
  warn: 6000,
  error: 0,
};

/** Maximum number of toasts kept on screen at once (older ones drop off). */
const MAX_VISIBLE = 6;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setList((prev) => prev.filter((n) => n.id !== id));
    const handle = timersRef.current.get(id);
    if (handle != null) {
      window.clearTimeout(handle);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (n: ShowOptions): string => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: Notification = {
        timeout: DEFAULT_TIMEOUTS[n.kind],
        ...n,
        id,
      };
      setList((prev) => {
        const next = [...prev, item];
        // Cap how many toasts stack at once to keep the UI tidy.
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      if (item.timeout && item.timeout > 0) {
        const handle = window.setTimeout(() => dismiss(id), item.timeout);
        timersRef.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  const clear = useCallback(() => {
    timersRef.current.forEach((h) => window.clearTimeout(h));
    timersRef.current.clear();
    setList([]);
  }, []);

  // Listen to a global window event so non-React code (plugins, Tauri
  // commands, error handlers) can fire toasts without importing the hook.
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<ShowOptions>).detail;
      if (!detail || typeof detail.message !== "string") return;
      show(detail);
    };
    window.addEventListener("notify", onEvent as EventListener);
    return () => window.removeEventListener("notify", onEvent as EventListener);
  }, [show]);

  // Cleanup timers on unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach((h) => window.clearTimeout(h));
      timersRef.current.clear();
    },
    [],
  );

  const value = useMemo<NotificationCtx>(
    () => ({
      list,
      show,
      info: (message, opts) => show({ kind: "info", message, ...opts }),
      success: (message, opts) => show({ kind: "success", message, ...opts }),
      warn: (message, opts) => show({ kind: "warn", message, ...opts }),
      error: (message, opts) => show({ kind: "error", message, ...opts }),
      dismiss,
      clear,
    }),
    [list, show, dismiss, clear],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <NotificationStack list={list} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useNotifications(): NotificationCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be inside <NotificationsProvider>");
  return ctx;
}

/** Convenience wrapper firing the global `notify` event. Safe everywhere. */
export function notify(opts: ShowOptions): void {
  window.dispatchEvent(new CustomEvent("notify", { detail: opts }));
}

// ---------------------------------------------------------------------
// Visual layer — toast stack rendered into a portal.
// ---------------------------------------------------------------------

function NotificationStack({
  list,
  onDismiss,
}: {
  list: Notification[];
  onDismiss: (id: string) => void;
}) {
  if (list.length === 0) return null;
  return createPortal(
    <div className="notif-stack" role="region" aria-label="Notifications">
      {list.map((n) => (
        <Toast key={n.id} item={n} onClose={() => onDismiss(n.id)} />
      ))}
    </div>,
    document.body,
  );
}

function Toast({ item, onClose }: { item: Notification; onClose: () => void }) {
  const icon =
    item.kind === "error"
      ? <I.Error size={14} />
      : item.kind === "warn"
        ? <I.Warn size={14} />
        : item.kind === "success"
          ? <I.Sparkle size={14} />
          : <I.Bell size={14} />;
  return (
    <div className={`notif notif--${item.kind}`} role="alert">
      <span className="notif__icon">{icon}</span>
      <div className="notif__body">
        {item.title && <div className="notif__title">{item.title}</div>}
        <div className="notif__msg">{item.message}</div>
        {item.action && (
          <button
            type="button"
            className="notif__action"
            onClick={() => {
              try { item.action?.run(); } finally { onClose(); }
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="notif__close"
        onClick={onClose}
        aria-label="Dismiss"
      >
        <I.Close size={12} />
      </button>
    </div>
  );
}
