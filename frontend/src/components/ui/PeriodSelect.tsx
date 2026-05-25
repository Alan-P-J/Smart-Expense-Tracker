import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface PeriodSelectProps {
  value: string;
  options: string[];
  onChange: (next: string) => void;
}

export function PeriodSelect({ value, options, onChange }: PeriodSelectProps) {
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
          'h-9 px-3.5 rounded-lg bg-surface-muted dark:bg-[#121B32] ' +
          'border border-border dark:border-[#2D3956] text-[12.5px] ' +
          'text-text-muted dark:text-[#94A3B8] ' +
          'hover:text-text-primary dark:hover:text-[#F5F7FF] transition ' +
          'flex items-center gap-2'
        }
      >
        {value}
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1 z-20">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={
                'w-full text-left px-3 h-9 rounded-lg text-[13px] flex items-center justify-between transition ' +
                (o === value
                  ? 'bg-accent-soft text-text-primary dark:text-[#F5F7FF]'
                  : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60')
              }
            >
              {o}
              {o === value && <Check size={13} className="text-accent" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
