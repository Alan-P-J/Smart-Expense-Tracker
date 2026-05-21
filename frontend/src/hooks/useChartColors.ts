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
    // CartesianGrid stroke — slate-200 light / slate-700 dark (matches border.dark)
    gridColor:     isDark ? '#334155' : '#E2E8F0',
    // Axis ticks — slate-500 light / slate-400 dark (matches text.dark-muted)
    tickColor:     isDark ? '#94A3B8' : '#64748B',
    // Tooltip bg — surface DEFAULT light / surface.dark in dark
    tooltipBg:     isDark ? '#1E293B' : '#FFFFFF',
    // Tooltip border — border.DEFAULT light / border.dark in dark
    tooltipBorder: isDark ? '#334155' : '#E2E8F0',
  };
}
