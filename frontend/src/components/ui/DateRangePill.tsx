import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export interface DateRange {
  /** Stable identifier used to render the pill chip + drive query keys. */
  preset: DateRangePreset;
  /** ISO yyyy-MM-dd inclusive. */
  from: string;
  /** ISO yyyy-MM-dd inclusive. */
  to: string;
}

export type DateRangePreset =
  | 'Today'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'This Month'
  | 'This Quarter';

const PRESETS: DateRangePreset[] = [
  'Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter',
];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compute concrete from/to dates for a preset, anchored at `now`. */
export function computeRange(preset: DateRangePreset, now: Date = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = today;
  switch (preset) {
    case 'Today':
      from = today;
      break;
    case 'Last 7 Days':
      from = new Date(today); from.setDate(today.getDate() - 6);
      break;
    case 'Last 30 Days':
      from = new Date(today); from.setDate(today.getDate() - 29);
      break;
    case 'This Month':
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'This Quarter': {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      from = new Date(today.getFullYear(), qStartMonth, 1);
      break;
    }
  }
  return { preset, from: toIso(from), to: toIso(today) };
}

/** Human-readable label for the current selection. Today gets a single date. */
function formatLabel(range: DateRange): string {
  const fromD = new Date(range.from);
  const toD = new Date(range.to);
  if (range.from === range.to) {
    return format(toD, "MMM d, yyyy");
  }
  // Same month → "May 16 — 22, 2026"
  if (fromD.getFullYear() === toD.getFullYear() && fromD.getMonth() === toD.getMonth()) {
    return `${format(fromD, 'MMM d')} — ${format(toD, 'd, yyyy')}`;
  }
  // Same year → "Mar 1 — May 22, 2026"
  if (fromD.getFullYear() === toD.getFullYear()) {
    return `${format(fromD, 'MMM d')} — ${format(toD, 'MMM d, yyyy')}`;
  }
  return `${format(fromD, 'MMM d, yyyy')} — ${format(toD, 'MMM d, yyyy')}`;
}

interface DateRangePillProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePill({ value, onChange }: DateRangePillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          'h-10 px-3.5 rounded-xl bg-white dark:bg-[#1A233A] ' +
          'border border-border dark:border-[#2D3956] text-[13px] ' +
          'text-text-muted dark:text-[#94A3B8] ' +
          'hover:text-text-primary dark:hover:text-[#F5F7FF] transition ' +
          'flex items-center gap-2.5'
        }
      >
        <Calendar size={15} aria-hidden="true" />
        <span>{formatLabel(value)}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1 z-20">
          {PRESETS.map((p) => {
            const selected = p === value.preset;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(computeRange(p));
                  setOpen(false);
                }}
                className={
                  'w-full text-left px-3 h-9 rounded-lg text-[13px] transition ' +
                  (selected
                    ? 'bg-accent-soft text-accent font-semibold'
                    : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60')
                }
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
