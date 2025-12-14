import * as monaco from "monaco-editor";

// Version sans ! qui apparaît
export function registerHtmlSnippets(monacoInstance: typeof monaco) {
  monacoInstance.languages.registerCompletionItemProvider("html", {
    triggerCharacters: ["!"],

    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);

      const range = new monacoInstance.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      return {
        suggestions: [
          {
            label: "HTML Template",
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            documentation: "HTML Template",
            insertText: [
              "<!-- Structucture HTML -- Created by CodeEditor & Wassim-->",
              "<!DOCTYPE html>",
              '<html lang="fr">',
              "<head>",
              '\t<meta charset="UTF-8" />',
              '\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
              "\t<title>Document</title>",
              "</head>",
              "<body>",
              "\t$0",
              "</body>",
              "</html>",
            ].join("\n"),
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,

            range,

            // ✅ Supprime le "!" juste avant le curseur
            additionalTextEdits: [
              {
                range: new monacoInstance.Range(
                  position.lineNumber,
                  position.column - 1,
                  position.lineNumber,
                  position.column,
                ),
                text: "",
              },
            ],
          },
        ],
      };
    },
  });
}
// Version avec !
// export function registerHtmlSnippets(monacoInstance: typeof monaco) {
//   monacoInstance.languages.registerCompletionItemProvider("html", {
//     triggerCharacters: ["!"], // ✅ déclenche la suggestion quand tu tapes "!"

//     provideCompletionItems(model, position) {
//       const word = model.getWordUntilPosition(position);
//       const range = new monacoInstance.Range(
//         position.lineNumber,
//         word.startColumn,
//         position.lineNumber,
//         word.endColumn,
//       );

//       return {
//         suggestions: [
//           {
//             label: "HTML Template",
//             kind: monacoInstance.languages.CompletionItemKind.Snippet,
//             documentation: "HTML Template",
//             insertText: [
//               "<!-- Structucture HTML -- Created by CodeEditor & Wassim-->",
//               "<!DOCTYPE html>",
//               '<html lang="fr">',
//               "<head>",
//               '\t<meta charset="UTF-8" />',
//               '\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
//               "\t<title>Document</title>",
//               "</head>",
//               "<body>",
//               "\t$0",
//               "</body>",
//               "</html>",
//             ].join("\n"),
//             insertTextRules:
//               monacoInstance.languages.CompletionItemInsertTextRule
//                 .InsertAsSnippet,
//             range,
//           },
//         ],
//       };
//     },
//   });
// }
