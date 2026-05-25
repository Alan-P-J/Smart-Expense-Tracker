import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { ICON_CATALOG } from '../../utils/categoryIconMap';

interface IconPickerProps {
  /** Currently selected icon name; empty string means "no icon" (falls back to receipt). */
  value: string;
  /** Tint colour for the selected tile background (the category's hex). */
  tintHex: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, tintHex, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_CATALOG;
    return ICON_CATALOG.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.label.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text-secondary dark:text-[#CBD5E1]">
          Icon
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition"
          >
            <X size={11} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          aria-label="Search icons"
          className={
            'w-full h-9 pl-8 pr-3 rounded-lg border ' +
            'border-border-strong dark:border-[#2D3956] ' +
            'bg-surface dark:bg-[#1A233A] ' +
            'text-[13px] text-text-primary dark:text-[#F5F7FF] ' +
            'placeholder:text-text-muted dark:placeholder:text-[#94A3B8] ' +
            'focus:outline-none focus:ring-2 focus:ring-primary transition'
          }
        />
      </div>

      <div
        role="radiogroup"
        aria-label="Pick an icon"
        className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-[180px] overflow-y-auto pr-1 rounded-lg border border-border dark:border-[#1F2A44] p-2 bg-surface-muted/50 dark:bg-[#121B32]/40"
      >
        {filtered.map(({ name, label, Icon }) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              onClick={() => onChange(name)}
              className={
                'h-10 w-10 mx-auto rounded-lg flex items-center justify-center transition ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
                (selected
                  ? 'ring-2 ring-primary scale-[1.05]'
                  : 'hover:bg-white dark:hover:bg-[#1F2A44]')
              }
              style={
                selected
                  ? { background: tintHex + '33', color: tintHex }
                  : undefined
              }
            >
              <Icon
                size={18}
                aria-hidden="true"
                className={selected ? '' : 'text-text-muted dark:text-[#94A3B8]'}
              />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-[12px] text-text-muted dark:text-[#94A3B8] py-6">
            No icons match "{query}"
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted dark:text-[#94A3B8] mt-1.5">
        Pick an icon to represent this category. Optional — the receipt fallback is used otherwise.
      </p>
    </div>
  );
}
