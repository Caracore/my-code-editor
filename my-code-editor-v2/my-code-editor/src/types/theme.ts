export type ThemeName = "dark" | "light" | "custom" | string;

export type CustomTheme = {
    name: string;
    palette: Record<string, string>; // Variables CSS (ex: --editor-bg: "#000000")
    typography: {
        fontFamily: string;
        fontSize: number;
        [key: string]: string | number;
    };
    codemirror?: {
        dark?: boolean; // true pour thème sombre, false pour clair
        highlightActiveLine?: boolean; // Mettre en surbrillance la ligne active
        highlightActiveLineGutter?: boolean; // Mettre en surbrillance le numéro de ligne active
    };
};
