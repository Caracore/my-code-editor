import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { I } from "../Icons";
import { useWorkspace } from "../../context/WorkspaceContext";
import "./EditorTabs.css";

const COLOR: Record<string, string> = {
  tsx: "#1a73c4", ts: "#3178c6", css: "#264de4",
  json: "#8a8a8a", md: "#444", toml: "#d34516",
  js: "#f7df1e", jsx: "#1a73c4", html: "#e34f26",
  py: "#3776ab", rs: "#d34516", cpp: "#00599c",
};

interface EditorTabsProps {
  paneId: string;
}

export default function EditorTabs({ paneId }: EditorTabsProps) {
  const {
    tabs, panes, layout, activePaneId,
    setActive, closeTab, togglePinned,
    splitRight, splitDown, closePane, setActivePane,
  } = useWorkspace();

  const pane = panes.find((p) => p.id === paneId);
  if (!pane) return null;

  const paneTabs = pane.tabIds
    .map((id) => tabs.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const isActivePane = activePaneId === paneId;
  const canSplitRight = layout.cols === 1;
  const canSplitDown = layout.rows === 1;
  const canClosePane = !(layout.cols === 1 && layout.rows === 1);

  const onClose = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(id, paneId);
  };
  const onAuxClick = (id: string) => (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(id, paneId);
    }
  };
  const onDoubleClick = (id: string) => () => togglePinned(id);

  return (
    <div
      className={`tabs ${isActivePane ? "tabs--active-pane" : ""}`}
      onMouseDown={() => setActivePane(paneId)}
    >
      <PaneTabsDropZone paneId={paneId}>
        <SortableContext
          items={paneTabs.map((t) => `${paneId}::${t.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="tabs__list">
            {paneTabs.map((t) => (
              <SortableTab
                key={t.id}
                paneId={paneId}
                tabId={t.id}
                ext={t.ext}
                name={t.name}
                path={t.path}
                pinned={!!t.pinned}
                dirty={!!t.dirty}
                isActive={pane.activeTabId === t.id}
                onClick={() => setActive(t.id, paneId)}
                onClose={onClose(t.id)}
                onAuxClick={onAuxClick(t.id)}
                onDoubleClick={onDoubleClick(t.id)}
              />
            ))}
            {paneTabs.length === 0 && (
              <div className="tabs__empty">Drop tab here</div>
            )}
          </div>
        </SortableContext>
      </PaneTabsDropZone>
      <div className="tabs__actions">
        {canSplitRight && (
          <button
            className="tabs__action"
            title="Split right"
            onClick={() => splitRight(paneId)}
          >
            <I.Split size={14} />
          </button>
        )}
        {canSplitDown && (
          <button
            className="tabs__action"
            title="Split down"
            onClick={() => splitDown(paneId)}
            style={{ transform: "rotate(90deg)" }}
          >
            <I.Split size={14} />
          </button>
        )}
        {canClosePane && (
          <button
            className="tabs__action"
            title="Close pane"
            onClick={() => closePane(paneId)}
          >
            <I.Close size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

interface SortableTabProps {
  paneId: string;
  tabId: string;
  ext: string;
  name: string;
  path: string;
  pinned: boolean;
  dirty: boolean;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  onAuxClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

function SortableTab(props: SortableTabProps) {
  const id = `${props.paneId}::${props.tabId}`;
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id,
    data: { type: "tab", tabId: props.tabId, paneId: props.paneId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tab ${props.isActive ? "is-active" : ""} ${props.pinned ? "is-pinned" : ""}`}
      onClick={props.onClick}
      onAuxClick={props.onAuxClick}
      onDoubleClick={props.onDoubleClick}
      title={props.path}
      {...attributes}
      {...listeners}
    >
      <span className="tab__color" style={{ background: COLOR[props.ext] ?? "#666" }} />
      <span className="tab__name">{props.name}</span>
      {props.pinned && <span className="tab__pin" title="Pinned">📌</span>}
      {props.dirty ? <span className="tab__dirty" title="Unsaved changes" /> : null}
      <button
        className="tab__close"
        onClick={props.onClose}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        title="Close (Ctrl+W)"
      >
        <I.Close size={11} />
      </button>
    </div>
  );
}

function PaneTabsDropZone({
  paneId,
  children,
}: {
  paneId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `pane-tabs::${paneId}`,
    data: { type: "pane-tabs", paneId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`tabs__dropzone ${isOver ? "is-over" : ""}`}
    >
      {children}
    </div>
  );
}
