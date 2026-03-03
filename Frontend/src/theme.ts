import { createContext, useState, useEffect, ReactNode } from 'react';
// Tauri event listener is optional at runtime; dynamic import avoids errors in browser-only environments

export type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  // listen for toggle-theme events from native tray (Tauri)
  useEffect(() => {
    let unlisten: any = null;
    (async () => {
      try {
        const mod = await import('@tauri-apps/api/event');
        unlisten = await mod.listen('toggle-theme', () => {
          setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
        });
      } catch (e) {
        // not running in Tauri; ignore
      }
    })();
    return () => {
      if (unlisten) unlisten.then((u: any) => u());
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
