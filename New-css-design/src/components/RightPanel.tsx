import "./RightPanel.css";
import { I } from "./Icons";

const messages = [
  {
    role: "user" as const,
    text: "How can I add a dark mode toggle to my Tauri React app?",
  },
  {
    role: "ai" as const,
    text:
      "You can store the theme in a React context, persist it in localStorage and apply a `data-theme` attribute on the root element.",
  },
];

export default function RightPanel() {
  return (
    <aside className="rightpanel">
      <div className="rightpanel__header">
        <div className="rightpanel__title">
          <I.Sparkle size={14} className="rightpanel__icon" />
          <span>Lumen AI</span>
          <span className="badge badge--pro">PRO</span>
        </div>
        <div className="rightpanel__actions">
          <button className="iconbtn" title="New Chat">
            <I.Plus size={14} />
          </button>
          <button className="iconbtn" title="More">
            <I.More size={14} />
          </button>
          <button className="iconbtn" title="Close">
            <I.Close size={14} />
          </button>
        </div>
      </div>

      <div className="rightpanel__chips">
        <button className="chip chip--active">Chat</button>
        <button className="chip">Edit</button>
        <button className="chip">Agent</button>
      </div>

      <div className="rightpanel__messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg msg--${m.role}`}>
            <div className="msg__avatar">
              {m.role === "user" ? "JM" : <I.Sparkle size={14} />}
            </div>
            <div className="msg__bubble">{m.text}</div>
          </div>
        ))}

        <div className="msg msg--ai">
          <div className="msg__avatar">
            <I.Sparkle size={14} />
          </div>
          <div className="msg__bubble">
            Here is a suggested implementation:
            <pre className="msg__code">
{`const [theme, setTheme] = useState("dark");
useEffect(() => {
  document.documentElement
    .setAttribute("data-theme", theme);
}, [theme]);`}
            </pre>
            <div className="msg__actions">
              <button className="msg__action">Insert</button>
              <button className="msg__action">Copy</button>
              <button className="msg__action">Diff</button>
            </div>
          </div>
        </div>
      </div>

      <div className="rightpanel__composer">
        <div className="composer__chips">
          <span className="ctxchip">
            <I.File size={11} /> App.tsx
          </span>
          <span className="ctxchip ctxchip--add">
            <I.Plus size={11} /> Add context
          </span>
        </div>
        <div className="composer__input">
          <textarea
            placeholder="Ask Lumen anything, or @mention a file..."
            rows={2}
          />
          <div className="composer__bottom">
            <div className="composer__model">
              <span className="composer__model-dot" />
              Claude 3.5 Sonnet
              <I.ChevronDown size={11} />
            </div>
            <button className="composer__send">
              <I.Sparkle size={13} />
              Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
