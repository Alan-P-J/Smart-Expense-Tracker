import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '../components/ui/Skeleton';
import { DatePicker } from '../components/ui/DatePicker';
import { AuditDetailDrawer } from '../components/audit/AuditDetailDrawer';
import {
  ACTION_DEFS,
  enrichAuditEvent,
  entityDefFor,
  formatDay,
  formatTime,
  dayKeyFor,
  relTime,
  type ActionDef,
  type ActionKey,
  type AuditEvent,
} from '../components/audit/auditTypes';
import { auditLogService } from '../api/services/auditLogService';
import type { AuditLogResponse } from '../types';

// ────────────────────────────────────────────────────────────
// Filter state
// ────────────────────────────────────────────────────────────

interface AuditFiltersState {
  search: string;
  entityType: string;   // '' = all
  action: ActionKey | 'All';
  userEmail: string;    // '' = all
  from: string;         // YYYY-MM-DD
  to: string;
}

const DEFAULT_FILTERS: AuditFiltersState = {
  search: '',
  entityType: '',
  action: 'All',
  userEmail: '',
  from: '',
  to: '',
};

// ────────────────────────────────────────────────────────────
// Tokens / shared styles
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// CSV export — client-side because the backend has no audit-log
// export endpoint. Exports only the filtered set so what the
// user downloads matches what's on screen.
// ────────────────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportAuditLogCsv(events: AuditEvent[]): void {
  const headers = ['Timestamp', 'User Email', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Changes', 'Summary'];
  const rows = events.map((e) => [
    e.ts.toISOString(),
    e.user.email,
    e.user.name,
    e.action,
    e.entityType,
    String(e.entityId),
    e.changes.map(([f, b, a]) => `${f}: ${b} → ${a}`).join('; '),
    e.summary ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  // ﻿ BOM so Excel opens UTF-8 CSVs without garbling ₹ / →
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FIELD_LABEL = 'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]';
const FIELD_INPUT =
  'w-full h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] ' +
  'border border-border dark:border-[#2D3956] px-3 text-[13px] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'placeholder:text-text-muted dark:placeholder:text-[#94A3B8] ' +
  'focus:border-accent/60 focus:outline-none transition';

// ────────────────────────────────────────────────────────────
// Sub-components (inline for cohesion with the page state)
// ────────────────────────────────────────────────────────────

function ActionPill({ action, size = 'md' }: { action: ActionKey; size?: 'sm' | 'md' }) {
  const def: ActionDef = ACTION_DEFS[action];
  const Icon = def.Icon;
  const cls = size === 'sm' ? 'h-[22px] px-2 text-[10.5px]' : 'h-[26px] px-2.5 text-[11.5px]';
  return (
    <span
      className={'inline-flex items-center gap-1.5 rounded-md font-bold uppercase tracking-wide ' + cls}
      style={{ color: def.fg, background: def.bg }}
    >
      <Icon size={size === 'sm' ? 11 : 12} aria-hidden="true" />
      {action}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
}

function StatCard({ label, value, sub, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-text-muted dark:text-[#94A3B8]">{label}</div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: iconColor + '1F', color: iconColor }}
          aria-hidden="true"
        >
          <Icon size={15} />
        </div>
      </div>
      <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight tnum truncate">{value}</div>
      {sub && <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{sub}</div>}
    </div>
  );
}

interface AuditStatsProps {
  events: AuditEvent[];
  now: Date;
}

function AuditStats({ events, now }: AuditStatsProps) {
  const todayCount = events.filter((e) => isSameDay(e.ts, now)).length;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayCount = events.filter((e) => isSameDay(e.ts, yesterday)).length;

  const userCounts = new Map<string, number>();
  events.forEach((e) => userCounts.set(e.user.email, (userCounts.get(e.user.email) ?? 0) + 1));
  let topUserEmail = '';
  let topUserCount = 0;
  userCounts.forEach((v, k) => { if (v > topUserCount) { topUserCount = v; topUserEmail = k; } });

  const actionCounts = new Map<ActionKey, number>();
  events.forEach((e) => actionCounts.set(e.action, (actionCounts.get(e.action) ?? 0) + 1));
  let topAction: ActionKey = 'UPDATE';
  let topActionCount = 0;
  actionCounts.forEach((v, k) => { if (v > topActionCount) { topActionCount = v; topAction = k; } });

  const topUserName = topUserEmail ? events.find((e) => e.user.email === topUserEmail)?.user.name ?? topUserEmail : '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total events"     value={events.length}                              sub="across all time"                                  icon={Activity} iconColor="#5B5CF0" />
      <StatCard label="Today"            value={todayCount}                                 sub={`${yesterdayCount} yesterday`}                    icon={Calendar} iconColor="#38BDF8" />
      <StatCard label="Most active user" value={topUserName}                                sub={topUserCount ? `${topUserCount} events` : '—'}    icon={Users}    iconColor="#10B981" />
      <StatCard label="Most common"      value={ACTION_DEFS[topAction]?.label ?? topAction} sub={topActionCount ? `${topActionCount} events` : '—'} icon={Sparkles} iconColor="#F59E0B" />
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Filter bar ──

interface AuditFilterBarProps {
  filters: AuditFiltersState;
  entityOptions: string[];
  userOptions: string[];
  onChange: <K extends keyof AuditFiltersState>(key: K, value: AuditFiltersState[K]) => void;
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_INPUT + ' appearance-none pr-9 cursor-pointer'}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
      </div>
    </label>
  );
}

function AuditFilterBar({ filters, entityOptions, userOptions, onChange }: AuditFilterBarProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Search</span>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange('search', e.target.value)}
              placeholder="Entity, user, action…"
              className={FIELD_INPUT + ' pl-9'}
            />
          </div>
        </label>

        <FilterSelect
          label="Entity"
          value={filters.entityType}
          onChange={(v) => onChange('entityType', v)}
          options={[{ value: '', label: 'All entities' }, ...entityOptions.map((e) => ({ value: e, label: entityDefFor(e).label }))]}
        />

        <FilterSelect
          label="Action"
          value={filters.action}
          onChange={(v) => onChange('action', v as AuditFiltersState['action'])}
          options={[
            { value: 'All', label: 'All actions' },
            ...(['CREATE', 'UPDATE', 'DELETE'] as const).map((a) => ({ value: a, label: ACTION_DEFS[a].label })),
          ]}
        />

        <FilterSelect
          label="User"
          value={filters.userEmail}
          onChange={(v) => onChange('userEmail', v)}
          options={[{ value: '', label: 'All users' }, ...userOptions.map((u) => ({ value: u, label: u }))]}
        />

        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>From</span>
          <DatePicker
            value={filters.from}
            onChange={(v) => onChange('from', v)}
            max={filters.to || undefined}
            placeholder="Start date"
            clearable
            ariaLabel="From date"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>To</span>
          <DatePicker
            value={filters.to}
            onChange={(v) => onChange('to', v)}
            min={filters.from || undefined}
            placeholder="End date"
            clearable
            ariaLabel="To date"
          />
        </div>
      </div>
    </div>
  );
}

// ── Active chips ──

interface AuditChipsProps {
  filters: AuditFiltersState;
  count: number;
  total: number;
  onChange: <K extends keyof AuditFiltersState>(key: K, value: AuditFiltersState[K]) => void;
  onClear: () => void;
}

function AuditChips({ filters, count, total, onChange, onClear }: AuditChipsProps) {
  const chips: { key: string; label: string; reset: () => void }[] = [];
  if (filters.search)               chips.push({ key: 's', label: `"${filters.search}"`,                          reset: () => onChange('search', '') });
  if (filters.entityType)           chips.push({ key: 'e', label: `Entity: ${entityDefFor(filters.entityType).label}`, reset: () => onChange('entityType', '') });
  if (filters.action !== 'All')     chips.push({ key: 'a', label: `Action: ${ACTION_DEFS[filters.action].label}`, reset: () => onChange('action', 'All') });
  if (filters.userEmail)            chips.push({ key: 'u', label: `User: ${filters.userEmail}`,                   reset: () => onChange('userEmail', '') });
  if (filters.from)                 chips.push({ key: 'f', label: `From: ${filters.from}`,                        reset: () => onChange('from', '') });
  if (filters.to)                   chips.push({ key: 't', label: `To: ${filters.to}`,                            reset: () => onChange('to', '') });

  if (chips.length === 0) {
    return (
      <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
        Showing all <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{total}</span>{' '}
        {total === 1 ? 'event' : 'events'}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
        Showing <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{count}</span> of{' '}
        <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{total}</span>
      </span>
      <span className="text-text-muted dark:text-[#94A3B8]">·</span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.reset}
          className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-md bg-accent-soft text-accent text-[12px] font-medium border border-accent/20 hover:bg-accent/15 transition"
        >
          {c.label}
          <span className="w-4 h-4 rounded-full hover:bg-accent/30 flex items-center justify-center transition">
            <X size={10} aria-hidden="true" />
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="h-7 px-2 rounded-md text-[12px] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition"
      >
        Clear all
      </button>
    </div>
  );
}

// ── Inline diff summary for row ──

function DiffSummary({ event }: { event: AuditEvent }) {
  if (event.action === 'DELETE') return <span className="text-[12.5px] text-danger">Deleted</span>;
  if (event.action === 'CREATE') return (
    <span className="text-[12.5px] text-success truncate block">
      {event.summary ?? 'New record created'}
    </span>
  );
  if (event.changes.length === 0) {
    return <span className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">—</span>;
  }
  const first = event.changes[0];
  const more = event.changes.length - 1;
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="text-[12px] font-mono flex items-center gap-1.5 min-w-0 flex-wrap">
        <span className="text-text-muted dark:text-[#94A3B8]">{first[0]}:</span>
        <span className="text-text-muted dark:text-[#94A3B8] line-through truncate max-w-[180px]">{first[1]}</span>
        <ArrowRight size={11} className="text-text-muted dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
        <span className="text-text-primary dark:text-[#F5F7FF] truncate max-w-[180px]">{first[2]}</span>
      </div>
      {more > 0 && <div className="text-[11.5px] text-accent">+ {more} more</div>}
    </div>
  );
}

// ── Event row + day group ──

const ROW_GRID =
  'grid grid-cols-[120px_minmax(160px,1.2fr)_110px_minmax(120px,1fr)_minmax(160px,1.5fr)_24px] items-center gap-3 px-4';

function EventRow({ event, now, onOpen }: { event: AuditEvent; now: Date; onOpen: () => void }) {
  const entityDef = entityDefFor(event.entityType);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        'w-full text-left ' + ROW_GRID +
        ' h-[64px] border-t border-border dark:border-[#1F2A44] first:border-t-0 ' +
        'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition group'
      }
    >
      <div className="text-[12.5px] tnum">
        <div className="text-text-primary dark:text-[#F5F7FF] font-medium">{formatTime(event.ts)}</div>
        <div className="text-text-muted dark:text-[#94A3B8] text-[11px]">{relTime(event.ts, now)}</div>
      </div>
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: event.user.tint }}
          aria-hidden="true"
        >
          {event.user.initials}
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-text-primary dark:text-[#F5F7FF] truncate">{event.user.name}</div>
          <div className="text-[11px] text-text-muted dark:text-[#94A3B8] truncate">{event.user.email}</div>
        </div>
      </div>
      <div><ActionPill action={event.action} /></div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entityDef.color }} aria-hidden="true" />
        <span className="text-[12.5px] text-text-muted dark:text-[#94A3B8] truncate">
          <span className="text-text-primary dark:text-[#F5F7FF] font-medium">{entityDef.label}</span>{' '}
          <span className="font-mono">#{event.entityId}</span>
        </span>
      </div>
      <div className="min-w-0 overflow-hidden"><DiffSummary event={event} /></div>
      <div className="flex justify-end opacity-50 group-hover:opacity-100 transition">
        <ChevronRight size={14} className="text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
      </div>
    </button>
  );
}

function DayGroup({ day, events, now, onOpen }: { day: string; events: AuditEvent[]; now: Date; onOpen: (e: AuditEvent) => void }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
      <div className="px-4 h-11 flex items-center justify-between border-b border-border dark:border-[#1F2A44] bg-surface-muted/60 dark:bg-[#081028]/40">
        <div className="text-[12.5px] font-semibold text-text-primary dark:text-[#F5F7FF]">{day}</div>
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] tnum">
          {events.length} event{events.length === 1 ? '' : 's'}
        </div>
      </div>
      <div className={ROW_GRID + ' h-9 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] border-b border-border dark:border-[#1F2A44]'}>
        <div>Time</div>
        <div>User</div>
        <div>Action</div>
        <div>Entity</div>
        <div>Changes</div>
        <div />
      </div>
      {events.map((e) => (
        <EventRow key={e.id} event={e} now={now} onOpen={() => onOpen(e)} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditFiltersState>(DEFAULT_FILTERS);
  const setFilter = <K extends keyof AuditFiltersState>(key: K, value: AuditFiltersState[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const [openEvent, setOpenEvent] = useState<AuditEvent | null>(null);

  const now = useMemo(() => new Date(), []);

  // Backend caps `size` at 20 per page — fetch all pages serially so the
  // grouped view actually contains every event the API has, not just the first 20.
  // Safety cap so a runaway audit_log table doesn't blow up the client.
  const MAX_EVENTS = 1000;
  const PAGE_SIZE = 20;

  const { data: allApiEvents, isLoading, isError, refetch } = useQuery<AuditLogResponse[]>({
    queryKey: ['audit-log', 'v2', { entityType: filters.entityType || undefined }],
    queryFn: async () => {
      const collected: AuditLogResponse[] = [];
      let page = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await auditLogService.getAuditLog({
          entityType: filters.entityType || undefined,
          page,
          size: PAGE_SIZE,
        });
        collected.push(...result.content);
        const isLastPage = result.last || result.content.length < PAGE_SIZE;
        if (isLastPage || collected.length >= MAX_EVENTS) break;
        page += 1;
      }
      return collected.slice(0, MAX_EVENTS);
    },
  });

  const allEvents: AuditEvent[] = useMemo(
    () => (allApiEvents ?? []).map(enrichAuditEvent),
    [allApiEvents],
  );

  const entityOptions = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => set.add(e.entityType));
    return [...set].sort();
  }, [allEvents]);

  const userOptions = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => set.add(e.user.email));
    return [...set].sort();
  }, [allEvents]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const fromD = filters.from ? new Date(filters.from) : null;
    const toD = filters.to ? new Date(filters.to + 'T23:59:59') : null;
    return allEvents.filter((e) => {
      if (q) {
        const hay = [
          e.entityType,
          String(e.entityId),
          e.user.email,
          e.user.name,
          e.action,
          e.summary ?? '',
          e.changes.map((c) => c.join(' ')).join(' '),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.entityType && e.entityType !== filters.entityType) return false;
      if (filters.action !== 'All' && e.action !== filters.action) return false;
      if (filters.userEmail && e.user.email !== filters.userEmail) return false;
      if (fromD && e.ts < fromD) return false;
      if (toD && e.ts > toD) return false;
      return true;
    });
  }, [allEvents, filters]);

  const grouped = useMemo(() => {
    const map = new Map<string, { day: string; date: Date; events: AuditEvent[] }>();
    for (const e of filtered) {
      const k = dayKeyFor(e.ts);
      if (!map.has(k)) map.set(k, { day: formatDay(e.ts, now), date: e.ts, events: [] });
      map.get(k)!.events.push(e);
    }
    return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filtered, now]);

  const onExport = () => {
    if (filtered.length === 0) {
      toast.error('No events to export with the current filters.');
      return;
    }
    exportAuditLogCsv(filtered);
    toast.success(`Exported ${filtered.length} audit event${filtered.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Audit log
          </h1>
          <p className="text-[13px] sm:text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">
            Complete history of all data changes · {allEvents.length} total{allEvents.length === 1 ? ' event' : ' events'}
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="h-10 px-3.5 rounded-lg border border-border dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition inline-flex items-center gap-2 text-[13px]"
        >
          <Download size={15} aria-hidden="true" /> Export
        </button>
      </div>

      <AuditStats events={allEvents} now={now} />
      <AuditFilterBar
        filters={filters}
        entityOptions={entityOptions}
        userOptions={userOptions}
        onChange={setFilter}
      />
      <AuditChips
        filters={filters}
        count={filtered.length}
        total={allEvents.length}
        onChange={setFilter}
        onClear={clearFilters}
      />

      {isError ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-10 shadow-card flex flex-col items-center text-center">
          <p className="font-semibold text-text-primary dark:text-[#F5F7FF]">Couldn't load the audit log</p>
          <p className="text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 px-5 h-10 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(91,92,240,0.7)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 shadow-card">
              <Skeleton className="h-5 w-32 mb-3" />
              {Array.from({ length: 3 }).map((__, j) => <Skeleton key={j} className="h-14 w-full mt-2" />)}
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3" aria-hidden="true">
            <Search size={20} />
          </div>
          <div className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">No events match your filters</div>
          <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-1 max-w-sm">
            Try adjusting the filters or clear them to see the full history.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          {grouped.map((g) => (
            <DayGroup key={g.day + g.date.toISOString()} day={g.day} events={g.events} now={now} onOpen={setOpenEvent} />
          ))}
        </div>
      )}

      <div className="h-2" />

      <AuditDetailDrawer event={openEvent} onClose={() => setOpenEvent(null)} />
    </div>
  );
}
