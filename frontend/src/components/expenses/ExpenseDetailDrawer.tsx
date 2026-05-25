import { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';

import { CategoryChip } from '../ui/CategoryChip';
import { StatusPill } from '../ui/StatusPill';
import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { EnrichedExpense } from './enrichExpense';

interface ExpenseDetailDrawerProps {
  row: EnrichedExpense | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (row: EnrichedExpense) => void;
  onDelete: (row: EnrichedExpense) => void;
}

const META_LABEL = 'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]';

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={META_LABEL}>{label}</div>
      <div className="text-[13px] text-text-primary dark:text-[#F5F7FF] mt-1">{children}</div>
    </div>
  );
}

interface TimelineToneStyle {
  bg: string;
  fg: string;
}
const TONE_STYLE: Record<'accent' | 'success' | 'warning' | 'danger', TimelineToneStyle> = {
  accent:  { bg: 'rgba(91, 92, 240, 0.13)',  fg: '#5B5CF0' },
  success: { bg: 'rgba(16, 185, 129, 0.13)', fg: '#10B981' },
  warning: { bg: 'rgba(245, 158, 11, 0.13)', fg: '#F59E0B' },
  danger:  { bg: 'rgba(239, 68, 68, 0.13)',  fg: '#EF4444' },
};

function TimelineItem({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: LucideIcon;
  tone: keyof typeof TONE_STYLE;
  title: string;
  sub: string;
}) {
  const t = TONE_STYLE[tone];
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: t.bg, color: t.fg }}
        aria-hidden="true"
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{title}</div>
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

export function ExpenseDetailDrawer({ row, canEdit, onClose, onEdit, onDelete }: ExpenseDetailDrawerProps) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [row, onClose]);

  if (!row) return null;
  const Icon = getCategoryIcon(null);
  const dateLabel = format(row.date, 'dd MMM yyyy');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(4px)' }}
      />
      <aside
        className="relative w-full max-w-[460px] h-full bg-white dark:bg-[#1A233A] border-l border-border dark:border-[#2D3956] shadow-pop overflow-y-auto fade-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#1A233A]/95 backdrop-blur z-10 px-6 py-4 border-b border-border dark:border-[#1F2A44] flex items-center justify-between">
          <div>
            <div className={META_LABEL}>Expense detail</div>
            <div className="text-[13.5px] font-mono text-text-muted dark:text-[#94A3B8] mt-0.5">{row.expenseCode}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail drawer"
            className="w-9 h-9 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Hero */}
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: row.categoryColourHex + '1F', color: row.categoryColourHex }}
              aria-hidden="true"
            >
              <Icon size={22} style={{ color: row.categoryColourHex }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">{row.title}</div>
              {row.description && (
                <div className="text-[13px] text-text-muted dark:text-[#94A3B8] mt-0.5">{row.description}</div>
              )}
            </div>
          </div>

          {/* Amount + status */}
          <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4 flex items-center justify-between">
            <div>
              <div className={META_LABEL}>Amount</div>
              <div className="text-[24px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight mt-0.5">
                {formatCurrency(row.amount)}
              </div>
            </div>
            <StatusPill status={row.status} />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Meta label="Date">{dateLabel}</Meta>
            <Meta label="Category"><CategoryChip name={row.categoryName} color={row.categoryColourHex} /></Meta>
            <Meta label="Project">{row.project}</Meta>
            <Meta label="Payment">{row.payment}</Meta>
            <Meta label="Submitted by">
              <span className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: row.submitter.tint }}
                  aria-hidden="true"
                >
                  {row.submitter.initials}
                </span>
                <span className="text-[13px] text-text-primary dark:text-[#F5F7FF]">{row.submitter.name}</span>
              </span>
            </Meta>
            <Meta label="Receipt">
              {row.hasReceipt ? (
                <span className="text-[13px] inline-flex items-center gap-1.5 text-accent">
                  <FileText size={13} aria-hidden="true" /> receipt-{row.expenseCode.toLowerCase()}.pdf
                </span>
              ) : (
                <span className="text-[13px] text-text-muted dark:text-[#94A3B8]">No receipt</span>
              )}
            </Meta>
          </div>

          {/* Activity timeline */}
          <div>
            <div className={META_LABEL + ' mb-3'}>Activity</div>
            <div className="flex flex-col gap-3">
              <TimelineItem
                icon={Plus}
                tone="accent"
                title="Expense submitted"
                sub={`${row.submitter.name} · ${dateLabel}`}
              />
              {row.status === 'Approved' && (
                <TimelineItem icon={CheckCircle2} tone="success" title="Approved by Manager" sub="System Admin · 2 days later" />
              )}
              {row.status === 'Rejected' && (
                <TimelineItem icon={X} tone="danger" title="Rejected" sub="System Admin · missing receipt" />
              )}
              {row.status === 'Pending' && (
                <TimelineItem icon={AlertCircle} tone="warning" title="Awaiting approval" sub="Notification sent to Manager" />
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-2 transition shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
                style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
              >
                <Pencil size={14} aria-hidden="true" /> Edit expense
              </button>
              <button
                type="button"
                onClick={() => { onDelete(row); onClose(); }}
                className="h-10 px-4 rounded-lg text-[13px] font-semibold text-danger border border-danger/30 hover:bg-danger/10 transition inline-flex items-center gap-2"
              >
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
