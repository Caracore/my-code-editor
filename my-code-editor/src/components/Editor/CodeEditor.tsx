import Editor, { OnMount } from "@monaco-editor/react";
// import * as monaco from "monaco-editor";
import { registerHtmlSnippets } from "../../monaco/htmlSnippets";

type CodeEditorProps = {
  value: string;
  path: string;
  onChange?: (value: string) => void;
};

function getLanguageFromPath(path: string | null): string {
  if (!path) return "plaintext";

  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    case "js":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "jsx":
      return "javascript";
    case "md":
      return "markdown";
    case "py":
      return "python";
    default:
      return "plaintext";
  }
}

export default function CodeEditor({ value, path, onChange }: CodeEditorProps) {
  const handleMount: OnMount = (editor, monacoInstance) => {
    registerHtmlSnippets(monacoInstance);
    if (!path) {
      // ✅ Aucun fichier ouvert → on ne crée pas de modèle
      return;
    }

    const lang = getLanguageFromPath(path);
    const uri = monacoInstance.Uri.file(path);

    let model = monacoInstance.editor.getModel(uri);
    if (!model) {
      model = monacoInstance.editor.createModel(value, lang, uri);
    }

    editor.setModel(model);
  };

  // const handleMount: OnMount = (editor, monacoInstance) => {
  //   if (!path) return;

  //   const lang = getLanguageFromPath(path); // ✅ détecte le bon langage
  //   const uri = monacoInstance.Uri.file(path);

  //   let model = monacoInstance.editor.getModel(uri);
  //   if (!model) {
  //     model = monacoInstance.editor.createModel(value, lang, uri); // ✅ utilise le bon langage
  //   }

  //   editor.setModel(model);
  // };

  const lang = getLanguageFromPath(path); // ✅ utilisé aussi ici

  return (
    <Editor
      height="100%"
      language={lang} // ✅ plus "typescript" forcé
      theme="vs-dark"
      value={value}
      onMount={handleMount}
      onChange={(val) => onChange?.(val ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}

// import { useState, useEffect } from "react";
// import Editor, { OnMount } from "@monaco-editor/react";
// import * as monaco from "monaco-editor";

// type CodeEditorProps = {
//   value: string;
//   language?: string;
//   path: string; // <- chemin du fichier ouvert
//   onChange?: (value: string) => void;
// };

// function getLanguageFromPath(path: string | null): string {
//   if (!path) return "plaintext";

//   const ext = path.split(".").pop()?.toLowerCase();

//   switch (ext) {
//     case "json":
//       return "json";
//     case "html":
//       return "html";
//     case "css":
//       return "css";
//     case "js":
//       return "javascript";
//     case "ts":
//       return "typescript";
//     case "tsx":
//       return "typescript";
//     case "jsx":
//       return "javascript";
//     case "md":
//       return "markdown";
//     case "py":
//       return "python";
//     default:
//       return "plaintext";
//   }
// }

// export default function CodeEditor({
//   value,
//   path,
//   language = "typescript",
//   onChange,
// }: CodeEditorProps) {
//   const handleMount: OnMount = (editor, monacoInstance) => {
//     if (!path) return;

//     const uri = monacoInstance.Uri.file(path);
//     let model = monacoInstance.editor.getModel(uri);

//     if (!model) {
//       model = monacoInstance.editor.createModel(value, language, uri);
//     }

//     editor.setModel(model);
//   };

//   return (
//     <Editor
//       height="100%"
//       language={language}
//       theme="vs-dark"
//       value={value}
//       onMount={handleMount}
//       onChange={(val) => onChange?.(val ?? "")}
//       options={{
//         minimap: { enabled: false },
//         fontSize: 13,
//         wordWrap: "on",
//         scrollBeyondLastLine: false,
//         automaticLayout: true,
//       }}
//     />
//   );
// }

// export default function CodeEditor({
//   value,
//   language = "typescript",
//   onChange,
// }: CodeEditorProps) {
//   const [internalValue, setInternalValue] = useState(value);

//   useEffect(() => {
//     setInternalValue(value);
//   }, [value]);

//   return (
//     <Editor
//       height="100%"
//       language={language}
//       value={internalValue}
//       theme="vs-dark"
//       onChange={(val) => {
//         const v = val ?? "";
//         setInternalValue(v);
//         onChange?.(v);
//       }}
//       options={{
//         minimap: { enabled: false },
//         fontSize: 13,
//         smoothScrolling: false,
//         renderWhitespace: "none",
//         fontLigatures: false,
//         automaticLayout: true,
//         scrollBeyondLastLine: false,
//         wordWrap: "on",
//       }}
//     />
//   );
// }
