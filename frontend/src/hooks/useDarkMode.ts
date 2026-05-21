import { useCallback, useState } from 'react';

/**
 * The initial theme was applied synchronously by the script in index.html
 * BEFORE React mounted (prevents a flash). This hook only needs to track
 * the current value (read from the <html class>) and handle toggles.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
