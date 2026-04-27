import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  searchFiles,
  searchInFiles,
  type FileSearchHit,
  type GrepHit,
} from "../../services/fs";
import "./SearchEverywhere.css";

/**
 * Time window during which two Shift presses count as a "double-shift"
 * gesture (à la JetBrains "Search Everywhere"). Single Shift presses
 * outside this window are ignored.
 */
const DOUBLE_SHIFT_WINDOW_MS = 320;

/** How long to wait after the user stops typing before firing a query. */
const DEBOUNCE_MS = 200;

type Tab = "files" | "text";

/**
 * JetBrains-style "Search Everywhere" overlay.
 *
 * Triggered by pressing Shift twice in quick succession (or by the
 * `searchEverywhere:open` window event). Has two tabs:
 *   - **Files**: walks the workspace tree, lists matching files/folders.
 *   - **Text**: recursive `grep -r` for the query, one hit per line.
 *
 * All filesystem work runs on the Tauri backend and is rate-limited
 * server-side; the UI is just a debounced wrapper around the two
 * `search_*` invokes.
 */
export default function SearchEverywhere() {
  const { rootPath, openFile } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("files");
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [fileHits, setFileHits] = useState<FileSearchHit[]>([]);
  const [textHits, setTextHits] = useState<GrepHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Token incremented on every query; stale results bail out.
  const queryToken = useRef(0);

  // ------- Open / close ------------------------------------------------

  const closeOverlay = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFileHits([]);
    setTextHits([]);
    setActiveIdx(0);
    setError(null);
  }, []);

  const openOverlay = useCallback((initialTab: Tab = "files") => {
    setTab(initialTab);
    setOpen(true);
    setActiveIdx(0);
    // Defer focus to the next tick so the input is mounted.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // ------- Double-Shift detection -------------------------------------
  useEffect(() => {
    let lastShiftAt = 0;
    let armed = false; // becomes true after a clean Shift down/up

    const onKeyDown = (e: KeyboardEvent) => {
      // Any non-Shift key (or Shift combined with another modifier) breaks
      // the chord — we must see two *bare* Shift presses in a row.
      if (e.key !== "Shift") {
        armed = false;
        lastShiftAt = 0;
        return;
      }
      // Auto-repeats from holding Shift do not count.
      if (e.repeat) return;
      // Ignore if any other modifier is currently held.
      if (e.ctrlKey || e.altKey || e.metaKey) {
        armed = false;
        lastShiftAt = 0;
        return;
      }
      const now = performance.now();
      if (armed && now - lastShiftAt <= DOUBLE_SHIFT_WINDOW_MS) {
        // Don't trigger when the user is mid-typing in an editor: a Shift
        // tap is fine, but JetBrains also disarms the gesture when the
        // last shift press was used to type a capital letter — easiest
        // proxy is "no other key was pressed in between", which the
        // `armed` flag already enforces above.
        e.preventDefault();
        if (open) {
          closeOverlay();
        } else {
          openOverlay("files");
        }
        armed = false;
        lastShiftAt = 0;
        return;
      }
      armed = true;
      lastShiftAt = now;
    };

    const onCustomOpen = () => openOverlay("files");
    const onCustomFindInFiles = () => openOverlay("text");

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("searchEverywhere:open", onCustomOpen);
    window.addEventListener("findInFiles:open", onCustomFindInFiles);
    window.addEventListener("fileSearch:open", onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("searchEverywhere:open", onCustomOpen);
      window.removeEventListener("findInFiles:open", onCustomFindInFiles);
      window.removeEventListener("fileSearch:open", onCustomOpen);
    };
  }, [open, openOverlay, closeOverlay]);

  // ------- Debounced query -------------------------------------------
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setFileHits([]);
      setTextHits([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!rootPath) {
      setError("Open a folder to search the workspace.");
      return;
    }
    const token = ++queryToken.current;
    setLoading(true);
    setError(null);
    const handle = window.setTimeout(async () => {
      try {
        if (tab === "files") {
          const hits = await searchFiles(rootPath, trimmed, 300);
          if (queryToken.current !== token) return;
          setFileHits(hits);
        } else {
          const hits = await searchInFiles(rootPath, trimmed, {
            caseSensitive,
            maxResults: 500,
          });
          if (queryToken.current !== token) return;
          setTextHits(hits);
        }
      } catch (err) {
        if (queryToken.current !== token) return;
        setError(String(err));
      } finally {
        if (queryToken.current === token) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, tab, caseSensitive, rootPath, open]);

  // Reset selection when results change.
  useEffect(() => {
    setActiveIdx(0);
  }, [fileHits, textHits, tab]);

  // ------- Pick a result ---------------------------------------------
  const pickFile = useCallback(
    (path: string) => {
      void openFile(path);
      closeOverlay();
    },
    [openFile, closeOverlay],
  );

  const pickGrep = useCallback(
    async (hit: GrepHit) => {
      await openFile(hit.path);
      // Wait one frame so the editor for that path gets mounted/swapped
      // before we ask it to scroll. Then dispatch — each editor only
      // reacts when its filePath matches.
      requestAnimationFrame(() => {
        window.dispatchEvent(
          new CustomEvent("editor:goto-line", {
            detail: { filePath: hit.path, line: hit.line, column: hit.column },
          }),
        );
      });
      closeOverlay();
    },
    [openFile, closeOverlay],
  );

  // ------- Keyboard nav ----------------------------------------------
  const resultCount = tab === "files" ? fileHits.length : textHits.length;

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeOverlay();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setTab((t) => (t === "files" ? "text" : "files"));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(resultCount - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (tab === "files") {
        const hit = fileHits[activeIdx];
        if (hit && !hit.is_dir) pickFile(hit.path);
      } else {
        const hit = textHits[activeIdx];
        if (hit) void pickGrep(hit);
      }
    }
  };

  // Keep the active row scrolled into view.
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`,
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx, fileHits, textHits]);

  // ------- Render -----------------------------------------------------
  const showHint = useMemo(
    () => !query.trim() && !loading && !error,
    [query, loading, error],
  );

  if (!open) return null;

  return (
    <div className="se-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget) closeOverlay();
    }}>
      <div className="se" role="dialog" aria-modal="true" aria-label="Search Everywhere">
        <div className="se__tabs">
          <button
            type="button"
            className={`se__tab ${tab === "files" ? "is-active" : ""}`}
            onClick={() => setTab("files")}
          >
            <I.File size={12} /> Files
          </button>
          <button
            type="button"
            className={`se__tab ${tab === "text" ? "is-active" : ""}`}
            onClick={() => setTab("text")}
          >
            <I.Search size={12} /> Text
          </button>
          <div className="se__tabs-spacer" />
          {tab === "text" && (
            <label className="se__opt" title="Match case">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Aa
            </label>
          )}
          <span className="se__hint-key">
            <kbd>Shift</kbd>·<kbd>Shift</kbd>
          </span>
        </div>

        <div className="se__input">
          <I.Search size={14} />
          <input
            ref={inputRef}
            placeholder={
              tab === "files"
                ? "Type a file or folder name…"
                : "Type a word to grep across the workspace…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          {loading && <span className="se__spinner" />}
        </div>

        <div className="se__results" ref={listRef}>
          {error && <div className="se__msg se__msg--err">{error}</div>}
          {!error && showHint && (
            <div className="se__msg">
              {rootPath
                ? tab === "files"
                  ? "Search the workspace by file or folder name. Press Tab to grep file contents."
                  : "Recursive grep across the workspace. Press Tab to switch to file-name search."
                : "No folder is open. Open a folder to search."}
            </div>
          )}

          {tab === "files" && !error && fileHits.length > 0 && (
            <ul className="se__list">
              {fileHits.map((hit, idx) => (
                <li
                  key={hit.path}
                  data-idx={idx}
                  className={`se__row ${idx === activeIdx ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => !hit.is_dir && pickFile(hit.path)}
                >
                  <span className="se__row-icon">
                    {hit.is_dir ? <I.Folder size={13} /> : <I.File size={13} />}
                  </span>
                  <span className="se__row-name">{hit.name}</span>
                  <span className="se__row-path">
                    {relPath(hit.path, rootPath)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === "text" && !error && textHits.length > 0 && (
            <ul className="se__list">
              {textHits.map((hit, idx) => (
                <li
                  key={`${hit.path}:${hit.line}:${hit.column}:${idx}`}
                  data-idx={idx}
                  className={`se__row ${idx === activeIdx ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => void pickGrep(hit)}
                >
                  <span className="se__row-icon"><I.File size={13} /></span>
                  <div className="se__grep">
                    <div className="se__grep-head">
                      <span className="se__row-name">{hit.name}</span>
                      <span className="se__row-path">
                        {relPath(hit.path, rootPath)}:{hit.line}
                      </span>
                    </div>
                    <div className="se__grep-preview">
                      {renderPreview(hit.preview, query, caseSensitive)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!error &&
            !showHint &&
            !loading &&
            ((tab === "files" && fileHits.length === 0) ||
              (tab === "text" && textHits.length === 0)) && (
              <div className="se__msg">No results.</div>
            )}
        </div>

        <div className="se__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Open</span>
          <span><kbd>Tab</kbd> Switch tab</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

/** Best-effort relative path for display. Falls back to the absolute one. */
function relPath(absolute: string, root: string | null): string {
  if (!root) return absolute;
  const a = absolute.replace(/\\/g, "/");
  const r = root.replace(/\\/g, "/").replace(/\/+$/, "");
  if (a.toLowerCase().startsWith(r.toLowerCase() + "/")) {
    return a.slice(r.length + 1);
  }
  return absolute;
}

/** Render a grep preview with the matched substring highlighted. */
function renderPreview(line: string, query: string, caseSensitive: boolean) {
  const q = query.trim();
  if (!q) return <span>{line}</span>;
  const haystack = caseSensitive ? line : line.toLowerCase();
  const needle = caseSensitive ? q : q.toLowerCase();
  const idx = haystack.indexOf(needle);
  if (idx < 0) return <span>{line}</span>;
  return (
    <>
      <span>{line.slice(0, idx)}</span>
      <mark className="se__hl">{line.slice(idx, idx + q.length)}</mark>
      <span>{line.slice(idx + q.length)}</span>
    </>
  );
}
