import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type Language = "en" | "ar";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLanguage?: Language;
  storageKey?: string;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: "ltr" | "rtl";
};

const initialState: ThemeContextType = {
  theme: "system",
  setTheme: () => null,
  language: "en",
  setLanguage: () => null,
  direction: "ltr",
};

const ThemeContext = createContext<ThemeContextType>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultLanguage = "en",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem(`${storageKey}-lang`) as Language) || defaultLanguage
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const dir = language === "ar" ? "rtl" : "ltr";
    
    root.setAttribute("dir", dir);
    root.setAttribute("lang", language);
    localStorage.setItem(`${storageKey}-lang`, language);
  }, [language, storageKey]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    language,
    setLanguage: (lang: Language) => {
      setLanguage(lang);
    },
    direction: (language === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
