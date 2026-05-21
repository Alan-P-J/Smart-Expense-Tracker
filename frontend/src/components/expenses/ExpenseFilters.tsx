import { Search, X } from 'lucide-react';

import type { CategoryResponse } from '../../types';

interface ExpenseFiltersProps {
  categories: CategoryResponse[];
  searchInput: string;
  filters: {
    categoryId: number | null;
    startDate: string | null;
    endDate: string | null;
  };
  setSearch: (text: string) => void;
  setCategoryId: (id: number | null) => void;
  setStartDate: (d: string | null) => void;
  setEndDate: (d: string | null) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

// Shared field shell so search / select / date inputs all look identical.
const FIELD =
  'rounded-lg border ' +
  'border-border-strong dark:border-border-dark-strong ' +
  'bg-surface dark:bg-surface-dark ' +
  'text-text-primary dark:text-text-dark-primary ' +
  'placeholder:text-text-muted ' +
  'focus:outline-none focus:ring-2 focus:ring-primary ' +
  'transition-colors duration-200';

const LABEL =
  'block text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-1';

export function ExpenseFilters({
  categories,
  searchInput,
  filters,
  setSearch,
  setCategoryId,
  setStartDate,
  setEndDate,
  hasActiveFilters,
  onResetFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="w-full sm:w-64">
        <label htmlFor="filter-search" className={LABEL}>
          Search
        </label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="filter-search"
            type="search"
            placeholder="Search expenses..."
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            className={`${FIELD} w-full pl-9 pr-3 py-2.5 text-sm`}
          />
        </div>
      </div>

      {/* Category */}
      <div className="w-full sm:w-48">
        <label htmlFor="filter-category" className={LABEL}>
          Category
        </label>
        <select
          id="filter-category"
          value={filters.categoryId ?? ''}
          onChange={(e) =>
            setCategoryId(e.target.value === '' ? null : Number(e.target.value))
          }
          className={`${FIELD} w-full px-3 py-2.5 text-sm`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="w-full sm:w-40">
        <label htmlFor="filter-start" className={LABEL}>
          From
        </label>
        <input
          id="filter-start"
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => setStartDate(e.target.value || null)}
          className={`${FIELD} w-full px-3 py-2.5 text-sm`}
        />
      </div>

      <div className="w-full sm:w-40">
        <label htmlFor="filter-end" className={LABEL}>
          To
        </label>
        <input
          id="filter-end"
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => setEndDate(e.target.value || null)}
          className={`${FIELD} w-full px-3 py-2.5 text-sm`}
        />
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className={
            'flex items-center gap-1 text-sm text-text-muted dark:text-text-dark-muted ' +
            'hover:text-danger transition-colors duration-150 py-2.5'
          }
        >
          <X size={14} aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
