import { useEffect } from "react";

/**
 * Subscribe to global Escape key presses.
 *
 * Used by overlay-style "windows" (Settings, Command Palette, future modals)
 * so the user can close them with Esc instead of clicking the X button.
 *
 * The listener is registered in capture phase, so it fires even if a focused
 * input or library widget would otherwise stop bubbling. We still skip the
 * action when the event was already cancelled (e.g. an inner editor/widget
 * uses Escape for something else and called preventDefault first).
 *
 * NOTE: this is intentionally NOT wired into the main editor / sidebar /
 * bottom panel — Escape is far too common to be allowed to close those
 * (and it must never close the IDE itself).
 *
 * @param enabled  Only attach when truthy. Pass the open-state of the modal.
 * @param onEscape Callback fired on Escape.
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      e.stopPropagation();
      onEscape();
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => {
      window.removeEventListener("keydown", handler, { capture: true } as any);
    };
  }, [enabled, onEscape]);
}
