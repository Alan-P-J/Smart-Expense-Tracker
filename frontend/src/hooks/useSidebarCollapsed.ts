import { useEffect, useState } from 'react';

const KEY = 'et-collapsed';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, collapsed ? '1' : '0');
    } catch {
      // localStorage unavailable — silent fail
    }
  }, [collapsed]);

  return { collapsed, toggle: () => setCollapsed((c) => !c) };
}
