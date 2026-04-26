import "./RightPanel.css";
import { I } from "./Icons";
import { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import TodoList from "./TodoList/TodoList";

type Tab = "chat" | "todo";

export default function RightPanel() {
  const { setRightPanelVisible } = useWorkspace();
  const [tab, setTab] = useState<Tab>("chat");
  const [draft, setDraft] = useState("");

  return (
    <aside className="rightpanel">
      <div className="rightpanel__header">
        <div className="rightpanel__title">
          <I.Sparkle size={14} className="rightpanel__icon" />
          <span>Lumen AI</span>
          <span className="badge badge--pro">PRO</span>
        </div>
        <div className="rightpanel__actions">
          <button className="iconbtn" title="More">
            <I.More size={14} />
          </button>
          <button
            className="iconbtn"
            title="Close"
            onClick={() => setRightPanelVisible(false)}
          >
            <I.Close size={14} />
          </button>
        </div>
      </div>

      <div className="rightpanel__chips">
        <button
          className={`chip ${tab === "chat" ? "chip--active" : ""}`}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>
        <button
          className={`chip ${tab === "todo" ? "chip--active" : ""}`}
          onClick={() => setTab("todo")}
        >
          Todo
        </button>
      </div>

      {tab === "todo" ? (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <TodoList />
        </div>
      ) : (
        <>
          <div className="rightpanel__messages">
            <div className="msg msg--ai">
              <div className="msg__avatar">
                <I.Sparkle size={14} />
              </div>
              <div className="msg__bubble">
                Hi! I'm Lumen — ask me anything about your code, or @mention a
                file from the explorer.
              </div>
            </div>
          </div>

          <div className="rightpanel__composer">
            <div className="composer__input">
              <textarea
                placeholder="Ask Lumen anything…"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="composer__bottom">
                <div className="composer__model">
                  <span className="composer__model-dot" />
                  Claude 3.5 Sonnet
                  <I.ChevronDown size={11} />
                </div>
                <button
                  className="composer__send"
                  disabled={!draft.trim()}
                  onClick={() => setDraft("")}
                >
                  <I.Sparkle size={13} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
