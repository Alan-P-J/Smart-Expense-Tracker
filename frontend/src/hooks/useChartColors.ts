import { useEffect, useState } from 'react';

/**
 * Recharts renders raw SVG, so Tailwind `dark:` class variants don't apply
 * to grid lines, axis ticks, or tooltips. This hook observes the
 * `<html class="dark">` toggle and returns plain hex values that match
 * our Tailwind palette tokens.
 *
 * Hex values mirror the design tokens — keep them in sync with
 * tailwind.config.js when the palette shifts.
 */
export function useChartColors() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return {
    gridColor:     isDark ? '#1F2A44' : '#E2E8F0', // border.dark / border.DEFAULT
    tickColor:     isDark ? '#94A3B8' : '#64748B', // text.dark-muted / text.muted
    tooltipBg:     isDark ? '#1A233A' : '#FFFFFF', // surface.dark / surface.DEFAULT
    tooltipBorder: isDark ? '#2D3956' : '#E2E8F0', // border.dark-strong / border.DEFAULT
  };
}
