import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { registerHtmlSnippets } from "../../monaco/htmlSnippets";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new jsonWorker();
    if (label === "css") return new cssWorker();
    if (label === "html") return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

type CodeEditorProps = {
  value: string;
  path: string;
  theme: string;
  onChange?: (value: string) => void;
  customTheme?: any;
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

export default function CodeEditor({
  value,
  path,
  theme,
  onChange,
  customTheme,
}: CodeEditorProps) {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const lang = getLanguageFromPath(path);

  const handleMount: OnMount = (editor, monacoInstance) => {
    monacoRef.current = monacoInstance;
    editorRef.current = editor;

    // ✅ Définir le thème custom si présent
    if (customTheme) {
      monacoInstance.editor.defineTheme(customTheme.name, {
        base: customTheme.monaco.base,
        inherit: false,
        rules: customTheme.monaco.rules,
        colors: customTheme.monaco.colors,
      });
    }

    const themeToApply = customTheme ? customTheme.name : theme;
    monacoInstance.editor.setTheme(themeToApply);

    registerHtmlSnippets(monacoInstance);

    const uri = path
      ? monacoInstance.Uri.file(path)
      : monacoInstance.Uri.parse("untitled://default.js");

    const model = monacoInstance.editor.createModel(value, lang, uri);
    editor.setModel(model);
  };

  // ✅ Quand le thème change → redéfinir + réappliquer
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;

    const monaco = monacoRef.current;

    if (customTheme) {
      monaco.editor.defineTheme(customTheme.name, {
        base: customTheme.monaco.base,
        inherit: false,
        rules: customTheme.monaco.rules,
        colors: customTheme.monaco.colors,
      });
    }

    const themeToApply = customTheme ? customTheme.name : theme;
    monaco.editor.setTheme(themeToApply);
  }, [theme, customTheme]);

  // ✅ Recréer le modèle quand theme ou path change
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const uri = path
      ? monaco.Uri.file(path)
      : monaco.Uri.parse("untitled://default.js");

    const oldModel = editor.getModel();
    if (oldModel) oldModel.dispose();

    const newModel = monaco.editor.createModel(value, lang, uri);
    editor.setModel(newModel);
  }, [path, theme, customTheme]);

  return (
    <Editor
      height="100%"
      language={lang}
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

// import Editor, { OnMount } from "@monaco-editor/react";
// // import * as monaco from "monaco-editor";
// import { registerHtmlSnippets } from "../../monaco/htmlSnippets";
// import { registerThemes } from "../../themes/themes.ts";

// type CodeEditorProps = {
//   value: string;
//   path: string;
//   theme: string;
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
//   theme,
//   onChange,
// }: CodeEditorProps) {
//   const handleMount: OnMount = (editor, monacoInstance) => {
//     registerThemes(monacoInstance);
//     monacoInstance.editor.setTheme(theme); // ✅ applique le thème manuellement
//     registerHtmlSnippets(monacoInstance); // enregistrer le snipets l'instancier !!! Important sans ça pas détecter !!!
//     if (!path) {
//       const uri = monacoInstance.Uri.parse("untitled://default.js");
//       const model = monacoInstance.editor.createModel(value, "javascript", uri);
//       editor.setModel(model);
//       // ✅ Aucun fichier ouvert → on ne crée pas de modèle
//       return;
//     }

//     const lang = getLanguageFromPath(path);
//     const uri = monacoInstance.Uri.file(path);

//     let model = monacoInstance.editor.getModel(uri);
//     if (!model) {
//       model = monacoInstance.editor.createModel(value, lang, uri);
//     }

//     editor.setModel(model);
//   };

//   const lang = getLanguageFromPath(path); // ✅ utilisé aussi ici

//   return (
//     <Editor
//       height="100%"
//       language={lang} // ✅ plus "typescript" forcé
//       theme={theme} //vs-dark"
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
