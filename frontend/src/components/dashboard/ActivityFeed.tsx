import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { auditLogService } from '../../api/services/auditLogService';
import type { AuditLogResponse } from '../../types';

type Tone = 'accent' | 'success' | 'warning' | 'info' | 'neutral' | 'danger';

const TONE_STYLE: Record<Tone, { iconBg: string; iconFg: string }> = {
  accent:  { iconBg: 'rgba(91, 92, 240, 0.13)',  iconFg: '#5B5CF0' },
  success: { iconBg: 'rgba(16, 185, 129, 0.13)', iconFg: '#10B981' },
  warning: { iconBg: 'rgba(245, 158, 11, 0.13)', iconFg: '#F59E0B' },
  info:    { iconBg: 'rgba(56, 189, 248, 0.13)', iconFg: '#38BDF8' },
  danger:  { iconBg: 'rgba(239, 68, 68, 0.13)',  iconFg: '#EF4444' },
  neutral: { iconBg: 'rgba(148, 163, 184, 0.13)',iconFg: '#94A3B8' },
};

function iconAndToneFor(log: AuditLogResponse): { icon: LucideIcon; tone: Tone; verb: string } {
  if (log.action === 'CREATE') {
    if (log.entityType === 'User') return { icon: UserPlus, tone: 'info', verb: 'added' };
    if (log.entityType === 'Budget') return { icon: Wallet, tone: 'accent', verb: 'created' };
    if (log.entityType === 'Category') return { icon: Tag, tone: 'accent', verb: 'created' };
    return { icon: Plus, tone: 'accent', verb: 'added' };
  }
  if (log.action === 'UPDATE') {
    return { icon: Pencil, tone: 'success', verb: 'updated' };
  }
  // DELETE
  return { icon: Trash2, tone: 'danger', verb: 'deleted' };
}

function titleFor(log: AuditLogResponse, verb: string): { title: string; sub: string } {
  // newValue may contain a JSON blob; surface only the entity + actor.
  const entityLabel = log.entityType.toLowerCase();
  return {
    title: `${log.entityType} ${verb}`,
    sub: `${log.userEmail} · ${entityLabel} #${log.entityId}`,
  };
}

function ActivityRow({ log }: { log: AuditLogResponse }) {
  const { icon: Icon, tone, verb } = iconAndToneFor(log);
  const t = TONE_STYLE[tone];
  const { title, sub } = titleFor(log, verb);
  let when = '';
  try {
    when = formatDistanceToNow(parseISO(log.createdAt), { addSuffix: true });
  } catch {
    when = log.createdAt;
  }
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: t.iconBg, color: t.iconFg }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{title}</div>
          <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] whitespace-nowrap tnum">{when}</div>
        </div>
        <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-48 mt-2" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 5;

export function ActivityFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log', 'recent', PAGE_SIZE],
    queryFn: () => auditLogService.getAuditLog({ page: 0, size: PAGE_SIZE }),
  });

  const rows = data?.content ?? [];

  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 sm:p-6 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Recent Activity</h3>
        <Link
          to="/audit-log"
          className="text-[12.5px] font-semibold text-accent hover:opacity-80 inline-flex items-center gap-1 transition"
        >
          View All <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => <LoadingRow key={i} />)}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load activity"
          description="Refresh to try again."
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="No recent activity"
          description="Changes to expenses, budgets and users will appear here."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex-1 flex flex-col gap-4">
          {rows.map((log) => <ActivityRow key={log.id} log={log} />)}
        </div>
      )}
    </div>
  );
}
