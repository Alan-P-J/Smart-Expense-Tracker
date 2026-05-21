import { useEffect, useState } from 'react';

/**
 * Returns a value that lags behind {@code value} by {@code delayMs}.
 * Every time {@code value} changes the previous pending update is cancelled,
 * so rapid changes only emit one trailing update after the quiet window.
 *
 * Typical use: wrap a controlled input's state to drive an API query without
 * firing one request per keystroke.
 *
 *   const [text, setText] = useState('');
 *   const debouncedText = useDebouncedValue(text, 300);
 *   useQuery(['search', debouncedText], …);
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
