import type { Role, UserResponse } from '../../types';

export type DisplayRole = 'Admin' | 'Viewer';
export type DisplayStatus = 'Active' | 'Suspended';

export interface RoleDef {
  color: string;
  bg: string;
  desc: string;
}

export const ROLE_DEFS: Record<DisplayRole, RoleDef> = {
  Admin:  { color: '#5B5CF0', bg: 'rgba(91, 92, 240, 0.15)',  desc: 'Full access to all settings, billing, users, and audit logs' },
  Viewer: { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', desc: 'Read-only access to reports and dashboards' },
};

export interface StatusDef {
  color: string;
  bg: string;
}

export const STATUS_DEFS: Record<DisplayStatus, StatusDef> = {
  Active:    { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  Suspended: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)'  },
};

export const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Finance', 'Sales',
  'Operations', 'People & HR', 'Design', 'Product',
];

const TINTS = ['#5B5CF0', '#10B981', '#F59E0B', '#38BDF8', '#EC4899', '#8B5CF6', '#06B6D4', '#F43F5E'];

function hashOf(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function initialsOf(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || (parts[0]?.[0] ?? '').toUpperCase() || '?';
}

function relTimeFrom(iso: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.floor((Date.now() - then) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  const days = Math.floor(diff / 1440);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export interface EnrichedUser {
  id: number;
  email: string;
  name: string;
  initials: string;
  tint: string;
  role: DisplayRole;
  status: DisplayStatus;
  joined: string;             // formatted date
  lastActive: string;         // relative or formatted
  // ── client-side mocks (backend doesn't carry these) ──
  department: string;
  mfa: boolean;
  twoFa: boolean;
  txCount: number;
  totalSpent: number;
}

export function roleToDisplay(role: Role): DisplayRole {
  // SUPER_ADMIN folds into "Admin" for the users-page badge — the dedicated
  // "Super Admin" pill in the sidebar already differentiates them.
  return role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'Admin' : 'Viewer';
}

export function roleFromDisplay(role: DisplayRole): Role {
  return role === 'Admin' ? 'ADMIN' : 'VIEWER';
}

export function enrichUser(api: UserResponse): EnrichedUser {
  const h = hashOf(api.email);
  const role = roleToDisplay(api.role);
  return {
    id: api.id,
    email: api.email,
    name: api.fullName,
    initials: initialsOf(api.fullName),
    tint: TINTS[h % TINTS.length],
    role,
    status: api.isActive ? 'Active' : 'Suspended',
    joined: api.createdAt
      ? new Date(api.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    lastActive: relTimeFrom(api.createdAt),
    department: DEPARTMENTS[h % DEPARTMENTS.length],
    mfa: h % 3 !== 0,
    twoFa: h % 2 === 0,
    txCount: 0,
    totalSpent: 0,
  };
}
