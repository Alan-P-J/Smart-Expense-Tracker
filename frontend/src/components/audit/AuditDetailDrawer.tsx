import { useEffect, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';

import {
  ACTION_DEFS,
  entityDefFor,
  formatTime,
  type AuditEvent,
} from './auditTypes';

interface AuditDetailDrawerProps {
  event: AuditEvent | null;
  onClose: () => void;
}

const META_LABEL = 'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]';

function ActionPill({ action }: { action: AuditEvent['action'] }) {
  const def = ACTION_DEFS[action];
  const Icon = def.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md font-bold uppercase tracking-wide text-[11.5px]"
      style={{ color: def.fg, background: def.bg }}
    >
      <Icon size={12} aria-hidden="true" />
      {action}
    </span>
  );
}

function InfoBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3">
      <div className={META_LABEL + ' mb-1.5'}>{label}</div>
      {children}
    </div>
  );
}

function MetaRow({ label, mono = false, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 px-3.5 py-2.5">
      <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8]">{label}</div>
      <div className={'text-[12.5px] text-text-primary dark:text-[#F5F7FF] break-all ' + (mono ? 'font-mono' : '')}>
        {children}
      </div>
    </div>
  );
}

export function AuditDetailDrawer({ event, onClose }: AuditDetailDrawerProps) {
  useEffect(() => {
    if (!event) return;
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
  }, [event, onClose]);

  if (!event) return null;
  const def = ACTION_DEFS[event.action];
  const entityDef = entityDefFor(event.entityType);
  const ActIcon = def.Icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(4px)' }}
      />
      <aside
        className="relative w-full max-w-[480px] h-full bg-white dark:bg-[#1A233A] border-l border-border dark:border-[#2D3956] shadow-pop overflow-y-auto fade-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-white/95 dark:bg-[#1A233A]/95 backdrop-blur z-10 px-6 py-4 border-b border-border dark:border-[#1F2A44] flex items-center justify-between">
          <div>
            <div className={META_LABEL}>Audit event</div>
            <div className="text-[13.5px] font-mono text-text-muted dark:text-[#94A3B8] mt-0.5">{event.eventCode}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
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
              style={{ background: def.bg, color: def.fg }}
              aria-hidden="true"
            >
              <ActIcon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
                {def.label}{' '}
                <span className="text-text-muted dark:text-[#94A3B8] font-medium">{entityDef.label.toLowerCase()}</span>{' '}
                <span className="font-mono text-text-primary dark:text-[#F5F7FF]">#{event.entityId}</span>
              </div>
              <div className="text-[13px] text-text-muted dark:text-[#94A3B8] mt-1">
                {event.user.name} {def.verb} this {entityDef.label.toLowerCase()} at {formatTime(event.ts)}
              </div>
            </div>
          </div>

          {/* Action + entity */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Action">
              <ActionPill action={event.action} />
            </InfoBox>
            <InfoBox label="Entity">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: entityDef.color }} aria-hidden="true" />
                <span className="text-[13px] text-text-primary dark:text-[#F5F7FF] font-medium">{entityDef.label}</span>
                <span className="text-[12px] font-mono text-text-muted dark:text-[#94A3B8]">#{event.entityId}</span>
              </div>
            </InfoBox>
          </div>

          {/* Diff section */}
          {event.changes.length > 0 && (
            <div>
              <div className={META_LABEL + ' mb-2'}>Changes ({event.changes.length})</div>
              <div className="rounded-xl border border-border dark:border-[#1F2A44] overflow-hidden">
                {event.changes.map(([field, before, after], i) => (
                  <div
                    key={i}
                    className="px-3.5 py-3 border-t border-border dark:border-[#1F2A44] first:border-t-0 bg-surface-muted/40 dark:bg-[#121B32]/40"
                  >
                    <div className="text-[11px] font-mono text-text-muted dark:text-[#94A3B8] mb-1.5">{field}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_18px_1fr] items-center gap-2">
                      <div className="rounded-md bg-danger/10 border border-danger/20 px-2.5 py-1.5 text-[12px] font-mono text-danger break-all">
                        {before}
                      </div>
                      <ArrowRight size={13} className="text-text-muted dark:text-[#94A3B8] mx-auto hidden sm:block" aria-hidden="true" />
                      <div className="rounded-md bg-success/10 border border-success/20 px-2.5 py-1.5 text-[12px] font-mono text-success break-all">
                        {after}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary for CREATE / non-diff actions */}
          {event.summary && event.changes.length === 0 && (
            <div>
              <div className={META_LABEL + ' mb-2'}>Summary</div>
              <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3 text-[13px] text-text-primary dark:text-[#F5F7FF]">
                {event.summary}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <div className={META_LABEL + ' mb-2'}>Metadata</div>
            <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] divide-y divide-border dark:divide-[#1F2A44]">
              <MetaRow label="Timestamp" mono>
                {event.ts.toLocaleString('en-IN')} IST
              </MetaRow>
              <MetaRow label="User">
                <span className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: event.user.tint }}
                    aria-hidden="true"
                  >
                    {event.user.initials}
                  </span>
                  <span>{event.user.email}</span>
                </span>
              </MetaRow>
              <MetaRow label="Event ID" mono>{event.eventCode}</MetaRow>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
