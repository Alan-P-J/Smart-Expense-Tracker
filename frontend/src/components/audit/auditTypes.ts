import {
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  X,
  Download,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuditLogResponse } from '../../types';

export type ActionKey = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT' | 'READ';

export interface ActionDef {
  fg: string;
  bg: string;
  Icon: LucideIcon;
  label: string;
  verb: string;
}

export const ACTION_DEFS: Record<ActionKey, ActionDef> = {
  CREATE:  { fg: '#10B981', bg: 'rgba(16, 185, 129, 0.15)',  Icon: Plus,         label: 'Create',  verb: 'created'  },
  UPDATE:  { fg: '#5B5CF0', bg: 'rgba(91, 92, 240, 0.15)',   Icon: Pencil,       label: 'Update',  verb: 'updated'  },
  DELETE:  { fg: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)',   Icon: Trash2,       label: 'Delete',  verb: 'deleted'  },
  READ:    { fg: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', Icon: FileText,     label: 'View',    verb: 'viewed'   },
  LOGIN:   { fg: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)',  Icon: UserPlus,     label: 'Login',   verb: 'signed in' },
  LOGOUT:  { fg: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', Icon: X,            label: 'Logout',  verb: 'signed out' },
  EXPORT:  { fg: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)',  Icon: Download,     label: 'Export',  verb: 'exported' },
  APPROVE: { fg: '#10B981', bg: 'rgba(16, 185, 129, 0.15)',  Icon: CheckCircle2, label: 'Approve', verb: 'approved' },
  REJECT:  { fg: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)',   Icon: AlertCircle,  label: 'Reject',  verb: 'rejected' },
};

export interface EntityDef {
  label: string;
  color: string;
}

const ENTITY_FALLBACK: EntityDef = { label: 'Record', color: '#94A3B8' };

const ENTITY_COLOR_BY_NAME: Record<string, string> = {
  expense:  '#5B5CF0',
  budget:   '#10B981',
  user:     '#38BDF8',
  category: '#F59E0B',
  project:  '#8B5CF6',
  report:   '#EC4899',
};

export function entityDefFor(entityType: string): EntityDef {
  if (!entityType) return ENTITY_FALLBACK;
  const lower = entityType.toLowerCase();
  const color = ENTITY_COLOR_BY_NAME[lower] ?? ENTITY_FALLBACK.color;
  // Title-case the entity name for display (e.g., "Expense", "Audit Log")
  const label = entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
  return { label, color };
}

// ── User derivation ──────────────────────────────────────────────────────
// Backend gives us userEmail; derive display name + initials + tint.

const TINTS = ['#5B5CF0', '#10B981', '#F59E0B', '#38BDF8', '#EC4899', '#8B5CF6', '#06B6D4'];

export interface AuditUser {
  name: string;
  email: string;
  initials: string;
  tint: string;
}

function tintForEmail(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

function nameFromEmail(email: string): string {
  if (!email) return '—';
  const local = email.split('@')[0] || '';
  // "system.admin" / "system_admin" / "system-admin" → "System Admin"
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || (parts[0]?.[0] ?? '').toUpperCase() || '?';
}

export function deriveUser(email: string): AuditUser {
  const name = nameFromEmail(email);
  return { name, email, initials: initialsFrom(name), tint: tintForEmail(email) };
}

// ── Diff parsing ─────────────────────────────────────────────────────────

const NOISY_KEYS = new Set(['createdAt', 'updatedAt', 'id', 'version', 'createdById']);

function fmt(v: unknown): string {
  if (v == null) return '∅';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function parseJsonSafe(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch { return null; }
}

export type Change = [field: string, before: string, after: string];

export function diffOf(oldRaw: string | null, newRaw: string | null): Change[] {
  const oldObj = parseJsonSafe(oldRaw);
  const newObj = parseJsonSafe(newRaw);
  if (!oldObj && !newObj) return [];
  const keys = new Set<string>([...Object.keys(oldObj ?? {}), ...Object.keys(newObj ?? {})]);
  const out: Change[] = [];
  keys.forEach((k) => {
    if (NOISY_KEYS.has(k)) return;
    const a = oldObj?.[k];
    const b = newObj?.[k];
    if (fmt(a) === fmt(b)) return;
    out.push([k, fmt(a), fmt(b)]);
  });
  return out;
}

// ── Enriched event ───────────────────────────────────────────────────────

export interface AuditEvent {
  id: number;
  eventCode: string;     // "evt_XXXX"
  ts: Date;
  action: ActionKey;
  entityType: string;
  entityId: number;
  user: AuditUser;
  changes: Change[];     // empty for CREATE/DELETE/non-UPDATE
  summary: string | null;
}

function isKnownAction(value: string): value is ActionKey {
  return value in ACTION_DEFS;
}

export function enrichAuditEvent(api: AuditLogResponse): AuditEvent {
  const action: ActionKey = isKnownAction(api.action) ? api.action : 'UPDATE';
  const changes = action === 'UPDATE' ? diffOf(api.oldValue, api.newValue) : [];
  let summary: string | null = null;
  if (action === 'CREATE') {
    const parsed = parseJsonSafe(api.newValue);
    if (parsed) {
      // Prefer a "title" / "name" field for a readable one-line summary
      const t = (parsed.title ?? parsed.name ?? null) as string | null;
      summary = t ? String(t) : null;
    }
  }
  return {
    id: api.id,
    eventCode: 'evt_' + api.id,
    ts: new Date(api.createdAt),
    action,
    entityType: api.entityType,
    entityId: api.entityId,
    user: deriveUser(api.userEmail),
    changes,
    summary,
  };
}

// ── Formatting helpers ───────────────────────────────────────────────────

export function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  h = ((h + 11) % 12) + 1;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDay(d: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function dayKeyFor(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function relTime(d: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}
