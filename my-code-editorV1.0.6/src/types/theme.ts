export type ThemeName = "joe-dark" | "joe-light" | "custom";

export type CustomTheme = {
  name: string;
  palette: Record<string, string>;
  // palette: {
  //   background: string;
  //   foreground: string;
  //   accent: string;
  //   error: string;
  //   success: string;
  //   warning: string;
  //   [key: string]: string;
  // };
  typography: {
    fontFamily: string;
    fontSize: number;
    [key: string]: string | number;
  };
  monaco: {
    base: "vs" | "vs-dark";
    rules: Array<{ token: string; foreground: string }>;
    colors: Record<string, string>;
  };
};
