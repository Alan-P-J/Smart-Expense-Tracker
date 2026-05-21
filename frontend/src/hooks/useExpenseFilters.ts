import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from './useDebouncedValue';

export interface ExpenseFilters {
  search: string;
  categoryId: number | null;
  startDate: string | null;
  endDate: string | null;
  page: number;
  size: number;
}

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ─── URL sanitizers ─────────────────────────────────────────────────────
// Users can edit the URL by hand or arrive via stale bookmarks. Treat the
// URL as untrusted input — never let NaN, negative numbers, or malformed
// dates leak into the query key (would cause cache misses + bad API calls).

function parseIntInRange(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

function parsePositiveIntOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseIsoDateOrNull(value: string | null): string | null {
  if (!value) return null;
  if (!ISO_DATE.test(value)) return null;
  if (Number.isNaN(Date.parse(value))) return null;
  return value;
}

/**
 * URL search params are the source of truth.
 * Filters survive refresh, are shareable, and bookmarkable.
 *
 * Search has a 300 ms debounce so typing doesn't fire an API call per
 * keystroke. The visible {@code <input>} should bind to {@link searchInput}
 * (immediate); the API query consumes {@link filters} (debounced + sanitised).
 */
export function useExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sanitise + memoise so the returned object is stable across renders
  // with the same URL — keeps useQuery's queryKey stable.
  const filters: ExpenseFilters = useMemo(
    () => ({
      search:     searchParams.get('search') ?? '',
      categoryId: parsePositiveIntOrNull(searchParams.get('categoryId')),
      startDate:  parseIsoDateOrNull(searchParams.get('startDate')),
      endDate:    parseIsoDateOrNull(searchParams.get('endDate')),
      page:       parseIntInRange(searchParams.get('page'), 0, 0, 10_000),
      size:       parseIntInRange(searchParams.get('size'), DEFAULT_SIZE, 1, MAX_SIZE),
    }),
    [searchParams],
  );

  // ── Search debounce ──────────────────────────────────────────────────
  // searchInput is the *live* value bound to the textbox. The debounced
  // value gets written to the URL (and therefore the query) after 300ms
  // of quiet typing.
  const [searchInput, setSearchInput] = useState<string>(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // External URL change (browser back, programmatic reset) → re-sync input.
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const updateParams = useCallback(
    (mutator: (p: URLSearchParams) => void) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        mutator(next);
        return next;
      });
    },
    [setSearchParams],
  );

  // Write debounced search → URL whenever it diverges from URL state.
  useEffect(() => {
    if (debouncedSearch === filters.search) return;
    updateParams((p) => {
      if (debouncedSearch) p.set('search', debouncedSearch);
      else p.delete('search');
      // Any filter change resets pagination — otherwise you can land on
      // a page that no longer exists in the filtered set.
      p.delete('page');
    });
  }, [debouncedSearch, filters.search, updateParams]);

  const setSearch = useCallback((text: string) => setSearchInput(text), []);

  const setCategoryId = useCallback(
    (id: number | null) => {
      updateParams((p) => {
        if (id != null) p.set('categoryId', String(id));
        else p.delete('categoryId');
        p.delete('page');
      });
    },
    [updateParams],
  );

  const setStartDate = useCallback(
    (d: string | null) => {
      updateParams((p) => {
        if (d) p.set('startDate', d);
        else p.delete('startDate');
        p.delete('page');
      });
    },
    [updateParams],
  );

  const setEndDate = useCallback(
    (d: string | null) => {
      updateParams((p) => {
        if (d) p.set('endDate', d);
        else p.delete('endDate');
        p.delete('page');
      });
    },
    [updateParams],
  );

  const setPage = useCallback(
    (page: number) => {
      updateParams((p) => {
        if (page > 0) p.set('page', String(page));
        else p.delete('page');
      });
    },
    [updateParams],
  );

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const hasActiveFilters =
    !!filters.search ||
    filters.categoryId !== null ||
    !!filters.startDate ||
    !!filters.endDate;

  return {
    filters,
    searchInput,
    setSearch,
    setCategoryId,
    setStartDate,
    setEndDate,
    setPage,
    resetFilters,
    hasActiveFilters,
  };
}
