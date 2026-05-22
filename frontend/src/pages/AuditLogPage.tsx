import { useCallback, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ClipboardList } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';

import { auditLogService } from '../api/services/auditLogService';
import { userService } from '../api/services/userService';
import { getInitials } from '../lib/initials';
import { formatCurrency } from '../lib/format';
import type { AuditLogResponse } from '../types';

const PAGE_SIZE = 20;

// Backend audit-log entity strings (set as `ENTITY_TYPE` constants in each
// service). The UI offers friendly lowercase labels — map between them.
const ENTITY_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'All types', value: '' },
  { label: 'Expense',   value: 'Expense' },
  { label: 'Category',  value: 'Category' },
  { label: 'Budget',    value: 'Budget' },
  { label: 'User',      value: 'AdminUser' },
];

const TH =
  'text-xs font-medium text-text-muted dark:text-text-dark-muted ' +
  'uppercase tracking-wider px-4 py-3 text-left';

const TD = 'px-4 py-3 align-top text-sm';

const ROW =
  'border-b border-border dark:border-border-dark ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark/50 ' +
  'transition-colors duration-150';

const FIELD =
  'rounded-lg border ' +
  'border-border-strong dark:border-border-dark-strong ' +
  'bg-surface dark:bg-surface-dark ' +
  'text-text-primary dark:text-text-dark-primary ' +
  'focus:outline-none focus:ring-2 focus:ring-primary ' +
  'transition-colors duration-200';

const LABEL = 'block text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-1';

const ACTION_BADGE: Record<AuditLogResponse['action'], string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-info/10 text-info',
  DELETE: 'bg-danger/10 text-danger',
};

// Format scalar values for the diff display so users see e.g. "₹500" rather
// than '"500.00"'. Money fields are caught by name; everything else either
// stringifies as-is or short-circuits to JSON.stringify for objects/arrays.
function formatScalar(key: string, value: unknown): string {
  if (value === null || value === undefined) return '∅';
  if (/amount|spent|limit|total/i.test(key) && (typeof value === 'string' || typeof value === 'number')) {
    return formatCurrency(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface Change {
  key: string;
  oldVal: unknown;
  newVal: unknown;
}

function diffJsonStrings(oldJson: string | null, newJson: string | null): Change[] {
  let oldObj: Record<string, unknown> = {};
  let newObj: Record<string, unknown> = {};
  try { if (oldJson) oldObj = JSON.parse(oldJson) as Record<string, unknown>; } catch { /* ignore — show raw if parse fails */ }
  try { if (newJson) newObj = JSON.parse(newJson) as Record<string, unknown>; } catch { /* ignore */ }

  const changes: Change[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    // Audit metadata fields rarely matter in a diff — they're noise.
    if (['createdAt', 'updatedAt', 'id'].includes(key)) continue;
    const o = oldObj[key];
    const n = newObj[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changes.push({ key, oldVal: o, newVal: n });
    }
  }
  return changes;
}

function ChangesCell({ log }: { log: AuditLogResponse }) {
  if (log.action === 'CREATE') {
    return (
      <span className="text-xs text-text-muted dark:text-text-dark-muted">
        New {log.entityType.toLowerCase()} created
      </span>
    );
  }
  if (log.action === 'DELETE') {
    return (
      <span className="text-xs text-text-muted dark:text-text-dark-muted">Deleted</span>
    );
  }
  const changes = diffJsonStrings(log.oldValue, log.newValue);
  if (changes.length === 0) {
    return <span className="text-xs text-text-muted dark:text-text-dark-muted">—</span>;
  }
  const shown = changes.slice(0, 2);
  const more = changes.length - shown.length;
  return (
    <div className="space-y-1 text-xs font-mono">
      {shown.map((c) => (
        <div key={c.key} className="text-text-secondary dark:text-text-dark-secondary">
          <span className="text-text-muted dark:text-text-dark-muted">{c.key}:</span>{' '}
          <span className="line-through text-text-muted dark:text-text-dark-muted">
            {formatScalar(c.key, c.oldVal)}
          </span>
          {' → '}
          <span>{formatScalar(c.key, c.newVal)}</span>
        </div>
      ))}
      {more > 0 && (
        <p className="text-text-muted dark:text-text-dark-muted">+ {more} more</p>
      )}
    </div>
  );
}

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const entityType = searchParams.get('entityType') ?? '';
  const userIdParam = searchParams.get('userId') ?? '';
  const userId = userIdParam ? Number(userIdParam) : undefined;
  const pageParam = Number(searchParams.get('page') ?? 0);
  const page = Number.isInteger(pageParam) && pageParam >= 0 ? pageParam : 0;

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

  const setEntityType = (v: string) =>
    updateParams((p) => {
      if (v) p.set('entityType', v);
      else p.delete('entityType');
      p.delete('page');
    });

  const setUserId = (v: string) =>
    updateParams((p) => {
      if (v) p.set('userId', v);
      else p.delete('userId');
      p.delete('page');
    });

  const setPage = (next: number) =>
    updateParams((p) => {
      if (next > 0) p.set('page', String(next));
      else p.delete('page');
    });

  // Guard the userId param — a stray ?userId= would deserialise as NaN.
  const filters = useMemo(
    () => ({
      entityType: entityType || undefined,
      userId: userId && Number.isInteger(userId) && userId > 0 ? userId : undefined,
      page,
      size: PAGE_SIZE,
    }),
    [entityType, userId, page],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => auditLogService.getAuditLog(filters),
    placeholderData: keepPreviousData,
  });

  // Users for the filter dropdown. ADMIN-only page, so the call is safe.
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Complete history of all data changes"
      />

      <AppCard>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="w-full sm:w-48">
            <label htmlFor="audit-entity" className={LABEL}>Entity type</label>
            <select
              id="audit-entity"
              className={`${FIELD} w-full px-3 py-2.5 text-sm`}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56">
            <label htmlFor="audit-user" className={LABEL}>User</label>
            <select
              id="audit-user"
              className={`${FIELD} w-full px-3 py-2.5 text-sm`}
              value={userIdParam}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">All users</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-muted dark:bg-border-dark/40 border-b border-border dark:border-border-dark">
              <tr>
                <th className={TH}>Time</th>
                <th className={TH}>User</th>
                <th className={TH}>Action</th>
                <th className={TH}>Entity</th>
                <th className={TH}>Changes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={ROW}>
                  <td className={TD}><Skeleton className="h-4 w-32" /></td>
                  <td className={TD}><Skeleton className="h-4 w-40" /></td>
                  <td className={TD}><Skeleton className="h-5 w-16" /></td>
                  <td className={TD}><Skeleton className="h-4 w-24" /></td>
                  <td className={TD}><Skeleton className="h-4 w-48" /></td>
                </tr>
              ))}

              {!isLoading && data && data.content.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <EmptyState
                      icon={ClipboardList}
                      title="No audit entries"
                      description="Actions will be logged here"
                    />
                  </td>
                </tr>
              )}

              {!isLoading && data && data.content.map((log) => (
                <tr key={log.id} className={ROW}>
                  <td className={`${TD} text-text-muted dark:text-text-dark-muted whitespace-nowrap`}>
                    {format(parseISO(log.createdAt), 'dd MMM yyyy HH:mm')}
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full bg-primary-light text-primary text-[10px] font-medium flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        {getInitials(log.userEmail)}
                      </div>
                      <span className="truncate text-text-secondary dark:text-text-dark-secondary">
                        {log.userEmail}
                      </span>
                    </div>
                  </td>
                  <td className={TD}>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${ACTION_BADGE[log.action]}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className={`${TD} text-text-secondary dark:text-text-dark-secondary whitespace-nowrap`}>
                    {log.entityType.toLowerCase()} #{log.entityId}
                  </td>
                  <td className={`${TD} max-w-md`}>
                    <ChangesCell log={log} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </AppCard>
    </>
  );
}
