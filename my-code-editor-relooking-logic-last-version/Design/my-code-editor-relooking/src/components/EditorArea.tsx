import { Suspense } from "react";
import "./EditorArea.css";
import { useTabs } from "../context/TabsContext";
import { detectLanguageFromFilename } from "../utils/detectLanguage";
import { ErrorBoundary } from "./ErrorBoundary/ErrorBoundary";
import WelcomeScreen from "./WelcomeScreen/WelcomeScreen";

interface EditorAreaProps {
  LazyCodeEditor: React.ComponentType<{
    value: string;
    onChange: (newValue: string) => void;
    language?: string;
    filePath?: string;
  }>;
}

export default function EditorArea({ LazyCodeEditor }: EditorAreaProps) {
  const { tabs, activeTab, updateTabContent } = useTabs();
  const file = tabs.find((t) => t.path === activeTab);

  if (!file) {
    return (
      <div className="editor editor--welcome">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="editor editor--code-host">
      <ErrorBoundary>
        <Suspense
          fallback={
            <div style={{ color: "var(--text-2)", padding: 16 }}>
              Loading editor…
            </div>
          }
        >
          <LazyCodeEditor
            key={file.path}
            value={file.content}
            onChange={(newValue: string) =>
              updateTabContent(file.path, newValue)
            }
            language={detectLanguageFromFilename(file.name)}
            filePath={file.path}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
