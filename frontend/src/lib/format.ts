/**
 * Currency formatter — Day 6 non-negotiable rule:
 *   "ALL amounts: toLocaleString('en-IN', {style:'currency',currency:'INR'})"
 *
 * Accepts the backend's BigDecimal-as-string OR a number.
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}
