import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useWorkspace } from "../../context/WorkspaceContext";
import { basename, joinPath, movePath } from "../../services/fs";

/**
 * Single application-wide DnD context. Handles two flows:
 *  - Editor tabs   — reorder within a pane and move between panes.
 *  - Sidebar files — drag a file/folder onto another folder to move it on disk.
 */
export function AppDndProvider({ children }: { children: ReactNode }) {
  const ws = useWorkspace();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const [activeKind, setActiveKind] = useState<"tab" | "file" | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("");

  const onDragStart = useCallback((evt: DragStartEvent) => {
    const data = evt.active.data.current as
      | { type?: "tab" | "file"; tabId?: string; name?: string; path?: string }
      | undefined;
    if (data?.type === "tab" && data.tabId) {
      const tab = ws.tabs.find((t) => t.id === data.tabId);
      setActiveKind("tab");
      setActiveLabel(tab?.name ?? "tab");
    } else if (data?.type === "file") {
      setActiveKind("file");
      setActiveLabel(data.name ?? data.path ?? "file");
    }
  }, [ws.tabs]);

  const onDragEnd = useCallback(
    async (evt: DragEndEvent) => {
      setActiveKind(null);
      setActiveLabel("");

      const { active, over } = evt;
      if (!over) return;
      const aData = active.data.current as
        | { type?: "tab" | "file"; tabId?: string; paneId?: string; path?: string; name?: string }
        | undefined;
      const oData = over.data.current as
        | { type?: "pane-tabs" | "tab" | "folder"; paneId?: string; path?: string }
        | undefined;
      if (!aData || !oData) return;

      // ---------- Tab DnD ----------
      if (aData.type === "tab" && aData.tabId) {
        // Sortable items (over another tab) carry type="tab" with paneId from data.
        if (oData.type === "tab" && oData.paneId) {
          const overTabId = (over.data.current as { tabId?: string }).tabId;
          const targetPane = ws.panes.find((p) => p.id === oData.paneId);
          if (!targetPane) return;
          const overIdx = overTabId
            ? targetPane.tabIds.indexOf(overTabId)
            : targetPane.tabIds.length;
          ws.moveTab(aData.tabId, oData.paneId, overIdx >= 0 ? overIdx : undefined);
          return;
        }
        if (oData.type === "pane-tabs" && oData.paneId) {
          ws.moveTab(aData.tabId, oData.paneId);
          return;
        }
      }

      // ---------- File DnD (sidebar) ----------
      if (aData.type === "file" && aData.path && oData.type === "folder" && oData.path) {
        const fromPath = aData.path;
        const fromDir = fromPath.replace(/[\\/][^\\/]+$/, "");
        const targetDir = oData.path;
        if (fromDir === targetDir) return; // no-op
        // Disallow moving a folder into itself or its descendants
        if (
          fromPath === targetDir ||
          targetDir.startsWith(fromPath + "/") ||
          targetDir.startsWith(fromPath + "\\")
        ) {
          console.warn("Cannot move a folder into itself");
          return;
        }
        const name = aData.name ?? basename(fromPath);
        const toPath = joinPath(targetDir, name);
        try {
          const finalPath = await movePath(fromPath, toPath);
          ws.updateTabPath(fromPath, finalPath);
          window.dispatchEvent(
            new CustomEvent("sidebar:refresh-folders", {
              detail: { folders: [fromDir, targetDir] },
            })
          );
        } catch (err) {
          console.error("move_path failed:", err);
          alert(`Cannot move file:\n${String(err)}`);
        }
      }
    },
    [ws]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeKind ? (
          <div
            className={`dnd-overlay dnd-overlay--${activeKind}`}
          >
            {activeLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
