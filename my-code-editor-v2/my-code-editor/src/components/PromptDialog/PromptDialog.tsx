import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PromptDialog.css";

export interface PromptDialogProps {
  /** Title shown at the top of the dialog (e.g. "New file"). */
  title: string;
  /** Description / label rendered above the input. */
  label?: string;
  /** Initial value of the input. */
  initial?: string;
  /** Placeholder for the empty input. */
  placeholder?: string;
  /** Label for the confirm button. Defaults to "OK". */
  okLabel?: string;
  /** Optional synchronous validator. Return an error string to block submit. */
  validate?: (value: string) => string | null;
  /** Called with the trimmed value, or `null` if the user cancelled. */
  onClose: (value: string | null) => void;
}

/**
 * Lightweight in-app replacement for `window.prompt` — themed to match the
 * rest of the IDE so creating a new file/folder no longer triggers the
 * browser's "localhost:1420 says" alert chrome.
 */
export default function PromptDialog({
  title,
  label,
  initial = "",
  placeholder,
  okLabel = "OK",
  validate,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select on mount so the user can immediately type or replace
  // the suggested name (e.g. when renaming).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  // Close on Escape (capture phase so it wins over editors / global hooks).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    const v = validate?.(trimmed);
    if (v) {
      setError(v);
      return;
    }
    onClose(trimmed);
  };

  return createPortal(
    <div
      className="prompt-dialog__backdrop"
      onMouseDown={(e) => {
        // Click on the dim layer (not the panel) closes the dialog.
        if (e.target === e.currentTarget) onClose(null);
      }}
    >
      <div
        className="prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="prompt-dialog__title">{title}</div>
        {label && <div className="prompt-dialog__label">{label}</div>}
        <input
          ref={inputRef}
          className="prompt-dialog__input"
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {error && <div className="prompt-dialog__error">{error}</div>}
        <div className="prompt-dialog__actions">
          <button
            type="button"
            className="prompt-dialog__btn"
            onClick={() => onClose(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="prompt-dialog__btn prompt-dialog__btn--primary"
            onClick={submit}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
