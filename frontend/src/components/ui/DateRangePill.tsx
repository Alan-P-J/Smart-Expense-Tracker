import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter', 'Custom Range'];

interface DateRangePillProps {
  defaultLabel?: string;
}

export function DateRangePill({ defaultLabel = 'May 16 — May 22, 2026' }: DateRangePillProps) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(defaultLabel);
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
        <span>{val}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1 z-20">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                if (r !== 'Custom Range') setVal(r);
                setOpen(false);
              }}
              className="w-full text-left px-3 h-9 rounded-lg text-[13px] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
