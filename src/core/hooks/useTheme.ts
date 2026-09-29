import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'my-wallet.theme';

function read(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    // Safari en modo privado puede lanzar al tocar localStorage.
    return 'system';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      /* preferencia no persistida: no es critico */
    }
  }, [theme]);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { theme, isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}
