import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
};

export default function CodeEditor({
  value,
  language = "typescript",
  onChange,
}: CodeEditorProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <Editor
      height="100%"
      language={language}
      value={internalValue}
      theme="vs-dark"
      onChange={(val) => {
        const v = val ?? "";
        setInternalValue(v);
        onChange?.(v);
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        smoothScrolling: false,
        renderWhitespace: "none",
        fontLigatures: false,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
      }}
    />
  );
}
