import { ROLE_DEFS, STATUS_DEFS, type DisplayRole, type DisplayStatus, type EnrichedUser } from './userTypes';

export function RoleBadge({ role }: { role: DisplayRole }) {
  const def = ROLE_DEFS[role];
  return (
    <span
      className="inline-flex items-center h-[22px] px-2 rounded-md text-[11px] font-semibold tracking-wide"
      style={{ color: def.color, background: def.bg }}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const def = STATUS_DEFS[status];
  return (
    <span
      className="inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-semibold"
      style={{ color: def.color, background: def.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: def.color }} aria-hidden="true" />
      {status}
    </span>
  );
}

interface AvatarProps {
  user: Pick<EnrichedUser, 'initials' | 'tint'>;
  size?: number;
}

export function Avatar({ user, size = 36 }: AvatarProps) {
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
      style={{ background: user.tint, width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {user.initials}
    </span>
  );
}

export function MfaShield() {
  return (
    <span title="MFA enabled" aria-label="MFA enabled" className="text-success">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v5c0 4.4-3.6 8-8 9-4.4-1-8-4.6-8-9V7z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}
