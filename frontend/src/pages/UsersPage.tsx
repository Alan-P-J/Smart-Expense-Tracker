import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  Search,
  Settings,
  ShieldOff,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '../components/ui/Skeleton';
import { Avatar, MfaShield, RoleBadge, StatusBadge } from '../components/users/UserBadges';
import { UserDetailDrawer } from '../components/users/UserDetailDrawer';
import { InviteUserModal } from '../components/users/InviteUserModal';
import { enrichUser, type DisplayRole, type DisplayStatus, type EnrichedUser } from '../components/users/userTypes';
import { userService } from '../api/services/userService';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/format';

// ────────────────────────────────────────────────────────────
// Filter state
// ────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid';

interface FiltersState {
  search: string;
  role: DisplayRole | 'All';
  status: DisplayStatus | 'All';
}

const DEFAULT_FILTERS: FiltersState = { search: '', role: 'All', status: 'All' };

// ────────────────────────────────────────────────────────────
// Stats strip
// ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
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
      <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">{value}</div>
      <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{sub}</div>
    </div>
  );
}

function UsersStats({ users }: { users: EnrichedUser[] }) {
  const active = users.filter((u) => u.status === 'Active').length;
  const admins = users.filter((u) => u.role === 'Admin').length;
  const mfaCount = users.filter((u) => u.mfa).length;
  const compliance = users.length === 0 ? 0 : Math.round((mfaCount / users.length) * 100);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total team"     value={users.length}                   sub={`${active} active`}                  icon={UsersIcon}    iconColor="#5B5CF0" />
      <StatCard label="Active"         value={active}                         sub={`${users.length - active} suspended`} icon={UserPlus}     iconColor="#F59E0B" />
      <StatCard label="Admins"         value={admins}                         sub={`${users.length - admins} viewers`}  icon={Settings}     iconColor="#10B981" />
      <StatCard label="MFA enrolled"   value={`${mfaCount}/${users.length}`}  sub={`${compliance}% compliance`}         icon={CheckCircle2} iconColor="#38BDF8" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// List view row
// ────────────────────────────────────────────────────────────

// Desktop-only grid. Mobile uses a stacked flex layout (see UserRow).
const ROW_GRID = 'grid grid-cols-[minmax(200px,2fr)_minmax(0,100px)_minmax(0,120px)_minmax(0,120px)_minmax(0,1fr)_90px] items-center gap-3 px-4';

interface UserRowProps {
  user: EnrichedUser;
  canEdit: boolean;
  onOpen: (u: EnrichedUser) => void;
  onEdit: (u: EnrichedUser) => void;
  onSuspend: (u: EnrichedUser) => void;
}

function UserRow({ user, canEdit, onOpen, onEdit, onSuspend }: UserRowProps) {
  const ActionButtons = canEdit ? (
    <>
      <span
        onClick={(e) => { e.stopPropagation(); onEdit(user); }}
        role="button"
        title="Edit role"
        aria-label="Edit role"
        className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center cursor-pointer"
      >
        <Pencil size={14} aria-hidden="true" />
      </span>
      <span
        onClick={(e) => { e.stopPropagation(); onSuspend(user); }}
        role="button"
        title={user.status === 'Suspended' ? 'Already suspended' : 'Suspend'}
        aria-label={user.status === 'Suspended' ? 'Already suspended' : 'Suspend'}
        className="w-8 h-8 rounded-lg hover:bg-danger/10 text-text-muted dark:text-[#94A3B8] hover:text-danger transition flex items-center justify-center cursor-pointer"
      >
        <ShieldOff size={14} aria-hidden="true" />
      </span>
    </>
  ) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(user)}
      className={
        'w-full text-left border-t border-border dark:border-[#1F2A44] first:border-t-0 ' +
        'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition group'
      }
    >
      {/* ── Desktop / tablet ≥ md: 6-column grid ────────────────── */}
      <div className={'hidden md:grid ' + ROW_GRID + ' h-[68px]'}>
        <div className="flex items-center gap-3 min-w-0 pr-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{user.name}</div>
              {user.mfa && <MfaShield />}
            </div>
            <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{user.email}</div>
          </div>
        </div>
        <div><RoleBadge role={user.role} /></div>
        <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8] truncate">{user.department}</div>
        <div><StatusBadge status={user.status} /></div>
        <div className="text-[12px] text-text-muted dark:text-[#94A3B8] truncate">{user.lastActive}</div>
        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition">
          {ActionButtons}
        </div>
      </div>

      {/* ── Mobile < md: stacked layout ─────────────────────────── */}
      <div className="md:hidden flex items-start gap-3 px-4 py-3">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{user.name}</div>
            {user.mfa && <MfaShield />}
          </div>
          <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{user.email}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
            <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">·</span>
            <span className="text-[11px] text-text-muted dark:text-[#94A3B8] truncate">{user.department}</span>
            <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">·</span>
            <span className="text-[11px] text-text-muted dark:text-[#94A3B8] truncate">{user.lastActive}</span>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            {ActionButtons}
          </div>
        )}
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Grid view card
// ────────────────────────────────────────────────────────────

function UserCard({ user, canEdit, onOpen, onEdit }: { user: EnrichedUser; canEdit: boolean; onOpen: (u: EnrichedUser) => void; onEdit: (u: EnrichedUser) => void; }) {
  return (
    <div
      onClick={() => onOpen(user)}
      className="fade-up group cursor-pointer rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 shadow-card hover:border-border-strong dark:hover:border-[#2D3956] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <Avatar user={user} size={48} />
        {canEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(user); }}
            aria-label="Edit role"
            className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center opacity-50 group-hover:opacity-100"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="text-[15px] font-bold text-text-primary dark:text-[#F5F7FF] truncate">{user.name}</h3>
        {user.mfa && <MfaShield />}
      </div>
      <div className="text-[12px] text-text-muted dark:text-[#94A3B8] truncate">{user.email}</div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>

      <div className="mt-4 pt-3 border-t border-border dark:border-[#1F2A44] grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">Department</div>
          <div className="text-[12.5px] text-text-primary dark:text-[#F5F7FF] font-medium mt-0.5 truncate">{user.department}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">Expenses</div>
          <div className="text-[12.5px] text-text-primary dark:text-[#F5F7FF] font-semibold tnum mt-0.5">
            {user.txCount} <span className="text-text-muted dark:text-[#94A3B8] font-normal">· {formatCurrency(user.totalSpent)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-text-muted dark:text-[#94A3B8] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted dark:bg-[#94A3B8]" aria-hidden="true" />
        Last active {user.lastActive}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const setFilter = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const [view, setView] = useState<ViewMode>('list');
  const [drawerUser, setDrawerUser] = useState<EnrichedUser | null>(null);
  const [editing, setEditing] = useState<EnrichedUser | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Open invite modal when navigated here from the topbar quick-add (?new=1).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1' && isAdmin) {
      setEditing(null);
      setInviteOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  const allUsers: EnrichedUser[] = useMemo(() => (data ?? []).map(enrichUser), [data]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q))) return false;
      if (filters.role !== 'All' && u.role !== filters.role) return false;
      if (filters.status !== 'All' && u.status !== filters.status) return false;
      return true;
    });
  }, [allUsers, filters]);

  const suspendMutation = useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: (_, id) => {
      const u = allUsers.find((x) => x.id === id);
      toast.success(u ? `Suspended ${u.name}` : 'User suspended');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to suspend user';
      toast.error(msg);
    },
  });

  const onSuspend = (user: EnrichedUser) => {
    if (user.status === 'Suspended') {
      toast.error('Reactivation endpoint is not wired yet on the backend.');
      return;
    }
    suspendMutation.mutate(user.id);
  };

  const openInviteForCreate = () => { setEditing(null); setInviteOpen(true); };
  const openInviteForEdit = (u: EnrichedUser) => { setEditing(u); setInviteOpen(true); };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">Users</h1>
          <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1 tnum">
            {allUsers.length} team {allUsers.length === 1 ? 'member' : 'members'} ·{' '}
            {allUsers.filter((u) => u.status === 'Active').length} active
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openInviteForCreate}
            className="h-10 px-3.5 sm:px-4 rounded-lg text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            <UserPlus size={15} aria-hidden="true" /> Invite member
          </button>
        )}
      </div>

      <UsersStats users={allUsers} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-[160px] sm:max-w-[420px] relative order-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search by name, email, dept…"
            className="w-full h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] pl-9 pr-3 text-[13px] text-text-primary dark:text-[#F5F7FF] placeholder:text-text-muted dark:placeholder:text-[#94A3B8] focus:border-accent/60 focus:outline-none transition"
          />
        </div>

        {/* View toggle */}
        <div className="flex h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] p-0.5 order-2 sm:order-4 sm:ml-auto">
          <button
            type="button"
            onClick={() => setView('list')}
            title="List view"
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={
              'w-9 rounded-md flex items-center justify-center transition ' +
              (view === 'list' ? 'bg-accent-soft text-accent' : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
            }
          >
            <ListIcon size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            title="Grid view"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            className={
              'w-9 rounded-md flex items-center justify-center transition ' +
              (view === 'grid' ? 'bg-accent-soft text-accent' : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
            }
          >
            <LayoutGrid size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Role filter */}
        <div className="relative order-3">
          <select
            value={filters.role}
            onChange={(e) => setFilter('role', e.target.value as FiltersState['role'])}
            className="appearance-none h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#2D3956] pl-3 pr-8 text-[12.5px] sm:text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none transition cursor-pointer"
          >
            <option value="All">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Viewer">Viewer</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
        </div>

        {/* Status filter */}
        <div className="relative order-4">
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value as FiltersState['status'])}
            className="appearance-none h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#2D3956] pl-3 pr-8 text-[12.5px] sm:text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none transition cursor-pointer"
          >
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {/* Count */}
      <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
        Showing <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{filtered.length}</span> of{' '}
        <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{allUsers.length}</span>{' '}
        {allUsers.length === 1 ? 'user' : 'users'}
      </div>

      {/* Body */}
      {isError ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-10 shadow-card flex flex-col items-center text-center">
          <p className="font-semibold text-text-primary dark:text-[#F5F7FF]">Couldn't load users</p>
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
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 shadow-card">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full mt-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3" aria-hidden="true">
            <Search size={20} />
          </div>
          <div className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">No users match</div>
          <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-1 max-w-sm">
            Try changing your filters, or invite someone new.
          </p>
        </div>
      ) : view === 'list' ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
          {/* Table header is desktop-only; mobile rows are self-describing. */}
          <div className={'hidden md:grid ' + ROW_GRID + ' h-10 border-b border-border dark:border-[#1F2A44] bg-surface-muted/60 dark:bg-[#081028]/40 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]'}>
            <div>User</div>
            <div>Role</div>
            <div>Department</div>
            <div>Status</div>
            <div>Last active</div>
            <div className="text-right">Actions</div>
          </div>
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              canEdit={isAdmin}
              onOpen={setDrawerUser}
              onEdit={openInviteForEdit}
              onSuspend={onSuspend}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              canEdit={isAdmin}
              onOpen={setDrawerUser}
              onEdit={openInviteForEdit}
            />
          ))}
        </div>
      )}

      <div className="h-2" />

      <UserDetailDrawer
        user={drawerUser}
        canEdit={isAdmin}
        onClose={() => setDrawerUser(null)}
        onEdit={(u) => { setDrawerUser(null); openInviteForEdit(u); }}
        onSuspend={(u) => { setDrawerUser(null); onSuspend(u); }}
      />

      <InviteUserModal
        open={inviteOpen}
        editing={editing}
        onClose={() => { setInviteOpen(false); setEditing(null); }}
      />
    </div>
  );
}
