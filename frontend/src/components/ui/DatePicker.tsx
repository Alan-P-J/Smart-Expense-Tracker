import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { usePopover } from '../../hooks/usePopover';

interface DatePickerProps {
  /** ISO yyyy-MM-dd, or '' for unset. */
  value: string;
  onChange: (value: string) => void;
  /** Inclusive lower bound, yyyy-MM-dd. */
  min?: string;
  /** Inclusive upper bound, yyyy-MM-dd. */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Adds a "Clear" footer button — useful for filter-style usage. */
  clearable?: boolean;
  /** Extra classes appended to the trigger button. */
  className?: string;
  /** Accessible label fallback when no surrounding <label> is used. */
  ariaLabel?: string;
}

const TRIGGER =
  'w-full h-10 rounded-lg flex items-center gap-2 px-3 text-[13px] ' +
  'bg-surface-muted dark:bg-[#121B32] ' +
  'border border-border dark:border-[#2D3956] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'hover:border-accent/50 focus:border-accent/60 focus:outline-none transition ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** ISO parse — strict 'yyyy-MM-dd'. Returns null for empty/invalid. */
function parseValue(v: string): Date | null {
  if (!v) return null;
  const d = parseISO(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

/**
 * Build a 42-cell grid (6 weeks × 7 days) starting at the Monday on/before
 * the 1st of `viewMonth`. Cells outside the view month are still in the array
 * — the UI fades them.
 */
function buildMonthGrid(viewMonth: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  clearable = false,
  className = '',
  ariaLabel,
}: DatePickerProps) {
  const popover = usePopover<HTMLDivElement>();
  const selected = useMemo(() => parseValue(value), [value]);
  const minDate = useMemo(() => parseValue(min ?? ''), [min]);
  const maxDate = useMemo(() => parseValue(max ?? ''), [max]);
  const today = useMemo(() => new Date(), []);

  // Calendar's current month — driven by selected date if present, else today.
  const [viewMonth, setViewMonth] = useState<Date>(
    () => (selected ?? today),
  );

  // Viewport-aware placement: flip the calendar to the left/upward when it
  // would otherwise overflow the right edge / bottom of the window.
  const [hAlign, setHAlign] = useState<'left' | 'right'>('left');
  const [openUp, setOpenUp] = useState(false);

  // Re-anchor the calendar to the selected month every time the popover opens
  // so reopening doesn't strand the user on the previous month they scrolled to.
  useEffect(() => {
    if (popover.open) {
      setViewMonth(selected ?? today);
    }
    // We deliberately don't depend on `selected`/`today` to avoid resetting
    // while the user is navigating months inside an already-open calendar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popover.open]);

  // Measure available space when the popover opens and pick the best placement.
  useEffect(() => {
    if (!popover.open || !popover.ref.current) return;
    const CAL_W = 280;
    const CAL_H = 360;
    const rect = popover.ref.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.left;
    const spaceLeft = rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;
    setHAlign(spaceRight < CAL_W && spaceLeft > CAL_W ? 'right' : 'left');
    setOpenUp(spaceBelow < CAL_H);
  }, [popover.open, popover.ref]);

  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const isOutOfBounds = (d: Date): boolean => {
    if (minDate && isBefore(d, minDate)) return true;
    if (maxDate && isAfter(d, maxDate)) return true;
    return false;
  };

  const handleSelect = (d: Date) => {
    if (isOutOfBounds(d)) return;
    onChange(toISO(d));
    popover.setOpen(false);
  };

  const goPrevMonth = () => setViewMonth((m) => addMonths(m, -1));
  const goNextMonth = () => setViewMonth((m) => addMonths(m, 1));

  const display = selected ? format(selected, 'MMM dd, yyyy') : '';

  return (
    <div ref={popover.ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && popover.setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-label={ariaLabel ?? (display || placeholder)}
        disabled={disabled}
        className={TRIGGER + (className ? ' ' + className : '')}
      >
        <CalendarIcon
          size={15}
          className={selected ? 'text-accent' : 'text-text-muted dark:text-[#94A3B8]'}
          aria-hidden="true"
        />
        <span
          className={
            'flex-1 text-left tnum ' +
            (display ? '' : 'text-text-muted dark:text-[#94A3B8]')
          }
        >
          {display || placeholder}
        </span>
        {clearable && selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
              }
            }}
            className="p-0.5 rounded hover:bg-surface dark:hover:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition cursor-pointer"
          >
            <X size={13} aria-hidden="true" />
          </span>
        )}
      </button>

      {popover.open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className={
            'absolute z-40 w-[280px] rounded-2xl ' +
            'bg-white dark:bg-[#1A233A] ' +
            'border border-border dark:border-[#2D3956] ' +
            'shadow-pop p-3 fade-up ' +
            (hAlign === 'right' ? 'right-0 ' : 'left-0 ') +
            (openUp ? 'bottom-full mb-2' : 'top-full mt-2')
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <div
              className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] tracking-tight"
              aria-live="polite"
            >
              {format(viewMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-0.5 mb-1 px-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="h-7 text-center text-[10.5px] font-semibold uppercase tracking-wider text-text-muted dark:text-[#94A3B8] flex items-center justify-center"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              const inMonth = isSameMonth(d, viewMonth);
              const isToday = isSameDay(d, today);
              const isSelected = selected && isSameDay(d, selected);
              const oob = isOutOfBounds(d);

              const base =
                'h-9 w-full rounded-lg text-[12.5px] tnum transition relative ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

              const stateClasses = (() => {
                if (oob) {
                  return 'opacity-30 cursor-not-allowed text-text-muted dark:text-[#94A3B8]';
                }
                if (isSelected) {
                  return 'text-white font-bold shadow-[0_6px_14px_-6px_rgba(91,92,240,0.7)]';
                }
                if (!inMonth) {
                  return 'text-text-muted/60 dark:text-[#94A3B8]/60 hover:bg-surface-muted dark:hover:bg-[#121B32]';
                }
                return 'text-text-primary dark:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]';
              })();

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(d)}
                  disabled={oob}
                  aria-pressed={!!isSelected}
                  aria-label={format(d, 'PPP')}
                  className={base + ' ' + stateClasses}
                  style={
                    isSelected
                      ? { background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }
                      : undefined
                  }
                >
                  {format(d, 'd')}
                  {isToday && !isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-border dark:border-[#1F2A44] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isOutOfBounds(today)) {
                  onChange(toISO(today));
                  popover.setOpen(false);
                }
              }}
              disabled={isOutOfBounds(today)}
              className="h-8 px-2.5 rounded-md text-[12px] font-semibold text-accent hover:bg-accent-soft transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Today
            </button>
            {clearable && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  popover.setOpen(false);
                }}
                className="h-8 px-2.5 rounded-md text-[12px] font-semibold text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32] transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
