import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;     // 0-indexed (Spring Data convention)
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Returns an array of page indices (0-based) and 'ellipsis' tokens.
 * Always shows page 1 + last page; shows current ±1; uses ellipsis where gaps appear.
 *
 * Examples (current=4, total=10): [0, ellipsis, 3, 4, 5, ellipsis, 9]
 *          (current=0, total=10): [0, 1, ellipsis, 9]
 *          (current=8, total=10): [0, ellipsis, 7, 8, 9]
 *          (total <= 5):          [0, 1, 2, 3, 4]
 */
function computePages(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);

  const include = new Set<number>([0, total - 1, current]);
  if (current > 0)         include.add(current - 1);
  if (current < total - 1) include.add(current + 1);

  const sorted = Array.from(include).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push('ellipsis');
    }
  }
  return result;
}

const NAV_BTN =
  'p-2 rounded-lg transition-colors duration-150 ' +
  'text-text-secondary dark:text-[#CBD5E1] ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const PAGE_BTN =
  'w-8 h-8 rounded-lg text-sm transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Defensively clamp — if the caller passed a stale or hand-edited page
  // index we still render sensibly rather than show negative offsets or
  // run past the end.
  const safeCurrent = Math.min(Math.max(currentPage, 0), totalPages - 1);

  const start = safeCurrent * pageSize + 1;
  const end = Math.min((safeCurrent + 1) * pageSize, totalElements);
  const pages = computePages(safeCurrent, totalPages);
  const isFirst = safeCurrent === 0;
  const isLast = safeCurrent === totalPages - 1;

  return (
    <div className="flex flex-wrap gap-3 justify-between items-center mt-4">
      <p className="text-sm text-text-muted dark:text-[#94A3B8]">
        Showing {start}–{end} of {totalElements} expenses
      </p>

      <nav className="flex gap-1 items-center" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(safeCurrent - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          className={NAV_BTN}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1 text-sm text-text-muted dark:text-[#94A3B8]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p + 1}`}
              aria-current={p === safeCurrent ? 'page' : undefined}
              className={
                PAGE_BTN +
                (p === safeCurrent
                  ? ' bg-primary text-white'
                  : ' text-text-secondary dark:text-[#CBD5E1] hover:bg-surface-muted dark:hover:bg-border-dark')
              }
            >
              {p + 1}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrent + 1)}
          disabled={isLast}
          aria-label="Next page"
          className={NAV_BTN}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
