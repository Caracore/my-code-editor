import "./BottomPanel.css";
import { useState } from "react";
import { I } from "./Icons";
import TerminalPanel from "./Terminal/TerminalPanel";
import { useWorkspace } from "../context/WorkspaceContext";

const tabs = ["Problems", "Output", "Debug Console", "Terminal", "Ports"];

export default function BottomPanel() {
  const [active, setActive] = useState(3);
  const { rootPath, setBottomPanelVisible } = useWorkspace();

  return (
    <section className="panel">
      <div className="panel__header">
        <div className="panel__tabs">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={`panel__tab ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="panel__actions">
          <button className="iconbtn" title="Maximize">
            <I.Max size={12} />
          </button>
          <button
            className="iconbtn"
            title="Close"
            onClick={() => setBottomPanelVisible(false)}
          >
            <I.Close size={14} />
          </button>
        </div>
      </div>

      <div className="panel__body">
        {active === 3 ? (
          <TerminalPanel rootPath={rootPath} />
        ) : (
          <div
            style={{
              padding: 16,
              color: "var(--text-2)",
              fontSize: 12,
            }}
          >
            {tabs[active]} — coming soon.
          </div>
        )}
      </div>
    </section>
  );
}
