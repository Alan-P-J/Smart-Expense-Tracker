import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Building2, Plus, ShieldOff, Users, X } from 'lucide-react';

import { companyService } from '../api/services/companyService';
import type {
  CompanyResponse,
  CreateCompanyRequest,
  CreateCompanyUserRequest,
} from '../types';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

// ────────────────────────────────────────────────────────────
// Create-company modal
// ────────────────────────────────────────────────────────────

function CreateCompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setSlug('');
    setLogoUrl('');
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: (data: CreateCompanyRequest) => companyService.create(data),
    onSuccess: (created) => {
      toast.success(`Created "${created.name}"`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to create company';
      setError(msg);
    },
  });

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Name is required');
    if (!SLUG_PATTERN.test(slug)) {
      return setError('Slug must contain only lowercase letters, digits, and hyphens');
    }
    mutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      logoUrl: logoUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0"
        style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(4px)' }}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary dark:text-[#F5F7FF]">Create company</h2>
            <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">
              A new tenant with its own users, expenses and budgets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            placeholder="Acme Corp"
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            maxLength={100}
            placeholder="acme-corp"
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none font-mono"
          />
          <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">
            Lowercase letters, digits, hyphens. Used in URLs.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Logo URL (optional)</span>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            maxLength={500}
            placeholder="https://…"
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          />
        </label>

        {error && (
          <div className="text-[12.5px] text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-[13px] font-semibold text-text-muted dark:text-[#94A3B8] hover:bg-surface-muted dark:hover:bg-[#121B32]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-10 px-4 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            {mutation.isPending ? 'Creating…' : 'Create company'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Add-user modal
// ────────────────────────────────────────────────────────────

function AddUserModal({
  open,
  company,
  onClose,
}: {
  open: boolean;
  company: CompanyResponse | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('VIEWER');
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateCompanyUserRequest }) =>
      companyService.addUser(id, data),
    onSuccess: () => {
      toast.success('User created');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to create user';
      setError(msg);
    },
  });

  if (!open || !company) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!fullName.trim()) return setError('Full name is required');

    mutation.mutate({
      id: company.id,
      data: { email: email.trim(), password, fullName: fullName.trim(), role },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0"
        style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(4px)' }}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary dark:text-[#F5F7FF]">Add user</h2>
            <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">
              New user for <span className="font-semibold">{company.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={100}
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          />
          <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">Minimum 8 characters.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary dark:text-[#F5F7FF]">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'VIEWER')}
            className="h-10 rounded-lg bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none"
          >
            <option value="VIEWER">Viewer (read-only)</option>
            <option value="ADMIN">Admin (manages the company)</option>
          </select>
        </label>

        {error && (
          <div className="text-[12.5px] text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-[13px] font-semibold text-text-muted dark:text-[#94A3B8] hover:bg-surface-muted dark:hover:bg-[#121B32]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-10 px-4 rounded-lg text-white text-[13px] font-semibold disabled:opacity-60"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            {mutation.isPending ? 'Adding…' : 'Add user'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

const COL_GRID =
  'grid grid-cols-[minmax(180px,2fr)_minmax(0,140px)_minmax(0,90px)_minmax(0,110px)_120px] items-center gap-3 px-4';

export function CompaniesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: companyService.list,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [addingUserTo, setAddingUserTo] = useState<CompanyResponse | null>(null);

  const deactivate = useMutation({
    mutationFn: (id: number) => companyService.deactivate(id),
    onSuccess: () => {
      toast.success('Company deactivated');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to deactivate';
      toast.error(msg);
    },
  });

  const onDeactivate = (c: CompanyResponse) => {
    if (!c.isActive) return;
    if (!confirm(`Deactivate "${c.name}"? Users in this company will lose access on next login.`)) {
      return;
    }
    deactivate.mutate(c.id);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Companies
          </h1>
          <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1 tnum">
            {data?.length ?? 0} tenants
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="h-10 px-3.5 sm:px-4 rounded-lg text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
          style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
        >
          <Plus size={15} aria-hidden="true" /> Add company
        </button>
      </div>

      {isError ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-10 shadow-card flex flex-col items-center text-center">
          <p className="font-semibold text-text-primary dark:text-[#F5F7FF]">Couldn't load companies</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 px-5 h-10 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-6 shadow-card text-[13px] text-text-muted dark:text-[#94A3B8]">
          Loading…
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-12 shadow-card flex flex-col items-center text-center">
          <div
            className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3"
            aria-hidden="true"
          >
            <Building2 size={20} />
          </div>
          <div className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">No companies yet</div>
          <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-1 max-w-sm">
            Create your first tenant to start onboarding users.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
          <div
            className={
              COL_GRID +
              ' h-10 border-b border-border dark:border-[#1F2A44] bg-surface-muted/60 dark:bg-[#081028]/40 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]'
            }
          >
            <div>Name</div>
            <div>Slug</div>
            <div>Users</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          {(data ?? []).map((c) => (
            <div
              key={c.id}
              className={
                'w-full ' +
                COL_GRID +
                ' h-[60px] border-t border-border dark:border-[#1F2A44] first:border-t-0 hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition'
              }
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{c.name}</div>
              </div>
              <div className="text-[12.5px] font-mono text-text-muted dark:text-[#94A3B8] truncate">{c.slug}</div>
              <div className="text-[12.5px] text-text-primary dark:text-[#F5F7FF] tnum">{c.userCount}</div>
              <div>
                <span
                  className={
                    'inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                    (c.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300')
                  }
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setAddingUserTo(c)}
                  title="Add user"
                  aria-label={`Add user to ${c.name}`}
                  className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-accent flex items-center justify-center transition"
                >
                  <Users size={14} aria-hidden="true" />
                </button>
                {c.isActive && (
                  <button
                    type="button"
                    onClick={() => onDeactivate(c)}
                    title="Deactivate"
                    aria-label={`Deactivate ${c.name}`}
                    className="w-8 h-8 rounded-lg hover:bg-danger/10 text-text-muted dark:text-[#94A3B8] hover:text-danger flex items-center justify-center transition"
                  >
                    <ShieldOff size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCompanyModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AddUserModal
        open={addingUserTo !== null}
        company={addingUserTo}
        onClose={() => setAddingUserTo(null)}
      />
    </div>
  );
}
