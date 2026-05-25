import { useEffect, type ReactNode } from 'react';
import { Bell, ChevronRight, Pencil, ShieldOff, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Avatar, MfaShield, RoleBadge, StatusBadge } from './UserBadges';
import { ROLE_DEFS, type EnrichedUser } from './userTypes';
import { formatCurrency } from '../../lib/format';

interface UserDetailDrawerProps {
  user: EnrichedUser | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (user: EnrichedUser) => void;
  onSuspend: (user: EnrichedUser) => void;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">{label}</div>
      <div className="text-[13px] text-text-primary dark:text-[#F5F7FF] mt-1 font-semibold truncate">{value}</div>
    </div>
  );
}

interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

function ActionRow({ icon: Icon, label, description, onClick, danger, hidden }: ActionRowProps) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full text-left flex items-center gap-3 px-3.5 py-3 transition ' +
        'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 ' +
        (danger ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')
      }
    >
      <div
        className={
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' +
          (danger ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent')
        }
      >
        <Icon size={14} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={'text-[13px] font-semibold truncate ' + (danger ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')}>
          {label}
        </div>
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5">{description}</div>
      </div>
      <ChevronRight size={14} className="text-text-muted dark:text-[#94A3B8] shrink-0" aria-hidden="true" />
    </button>
  );
}

export function UserDetailDrawer({ user, canEdit, onClose, onEdit, onSuspend }: UserDetailDrawerProps) {
  useEffect(() => {
    if (!user) return;
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
  }, [user, onClose]);

  if (!user) return null;
  const roleDef = ROLE_DEFS[user.role];
  const suspended = user.status === 'Suspended';

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
          <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">Team member</div>
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
          <div className="flex items-start gap-4">
            <Avatar user={user} size={64} />
            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">{user.name}</h2>
              <a
                href={'mailto:' + user.email}
                className="text-[12.5px] text-accent hover:opacity-80 transition break-all"
              >
                {user.email}
              </a>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
                {user.mfa && (
                  <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[11px] font-semibold text-success bg-success/10">
                    <MfaShield />
                    MFA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3.5">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-1.5">
              Permissions
            </div>
            <p className="text-[12.5px] text-text-primary dark:text-[#F5F7FF]">{roleDef.desc}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Department" value={user.department} />
            <Stat label="Joined" value={user.joined} />
            <Stat label="Last active" value={user.lastActive} />
            <Stat
              label="2-factor auth"
              value={
                user.twoFa
                  ? <span className="text-success">Enabled</span>
                  : <span className="text-text-muted dark:text-[#94A3B8]">Not set up</span>
              }
            />
            <Stat label="Expenses" value={`${user.txCount} txns`} />
            <Stat label="Total spent" value={formatCurrency(user.totalSpent)} />
          </div>

          {/* Quick actions */}
          {canEdit && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-2">
                Actions
              </div>
              <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] divide-y divide-border dark:divide-[#1F2A44]">
                <ActionRow
                  icon={Pencil}
                  label="Edit role"
                  description="Update this member's permission level"
                  onClick={() => onEdit(user)}
                />
                <ActionRow
                  icon={Bell}
                  label="Send password reset"
                  description="Coming soon — backend endpoint not wired yet"
                  onClick={() => { /* no-op */ }}
                />
                <ActionRow
                  icon={ShieldOff}
                  label={suspended ? 'Reactivate user (coming soon)' : 'Suspend access'}
                  description={
                    suspended
                      ? 'Backend reactivation endpoint pending'
                      : 'Block login but keep records'
                  }
                  onClick={() => onSuspend(user)}
                  danger
                  hidden={suspended}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
