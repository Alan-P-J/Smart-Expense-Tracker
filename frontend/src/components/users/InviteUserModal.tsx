import { useEffect, useState } from 'react';
import { Building2, Mail, Pencil, UserPlus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { DEPARTMENTS, ROLE_DEFS, roleFromDisplay, type DisplayRole, type EnrichedUser } from './userTypes';
import { userService } from '../../api/services/userService';
import { companyService } from '../../api/services/companyService';
import { useAuth } from '../../hooks/useAuth';

interface InviteUserModalProps {
  open: boolean;
  /** When set, the modal is in edit mode (role-only since backend supports only changeRole). */
  editing: EnrichedUser | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: DisplayRole;
  department: string;
  requireMfa: boolean;
  // SUPER_ADMIN only — which company to create the user inside. Ignored for
  // company admins (their tenant is taken from TenantContext on the server).
  companyId: number | null;
}

const FIELD_LABEL = 'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-1.5';
const FIELD_INPUT =
  'w-full h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] ' +
  'border border-border dark:border-[#2D3956] px-3 text-[13.5px] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'placeholder:text-text-muted dark:placeholder:text-[#94A3B8] ' +
  'focus:border-accent/60 focus:outline-none transition disabled:opacity-60';

function buildInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || (parts[0]?.[0] ?? '').toUpperCase() || '?';
}

export function InviteUserModal({ open, editing, onClose }: InviteUserModalProps) {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const isEdit = editing != null;

  // SUPER_ADMIN sees a company picker. Lazy-load only when the modal opens
  // in create mode — no point fetching for company admins.
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: companyService.list,
    enabled: open && isSuperAdmin && !isEdit,
    staleTime: 60_000,
  });

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', role: 'Viewer', department: DEPARTMENTS[0], requireMfa: true, companyId: null,
  });

  // Sync form to editing target when modal opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name, email: editing.email, password: '',
        role: editing.role, department: editing.department, requireMfa: editing.mfa,
        companyId: null,
      });
    } else {
      setForm({ name: '', email: '', password: '', role: 'Viewer', department: DEPARTMENTS[0], requireMfa: true, companyId: null });
    }
  }, [editing, open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        fullName: form.name.trim(),
        role: roleFromDisplay(form.role),
      };
      // SUPER_ADMIN: target a specific company via /api/companies/{id}/users.
      // Company admins: /api/users — the backend stamps their own tenant.
      if (isSuperAdmin) {
        if (form.companyId == null) {
          return Promise.reject(new Error('Pick a company before inviting'));
        }
        return companyService.addUser(form.companyId, {
          ...payload,
          role: payload.role as 'ADMIN' | 'VIEWER',
        });
      }
      return userService.createUser(payload);
    },
    onSuccess: () => {
      toast.success(`Invited ${form.name.trim()}`);
      invalidate();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to create user';
      toast.error(msg);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => {
      if (!editing) return Promise.reject(new Error('No editing target'));
      return userService.changeRole(editing.id, roleFromDisplay(form.role));
    },
    onSuccess: () => {
      toast.success(`Updated ${form.name.trim()}`);
      invalidate();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Failed to update role';
      toast.error(msg);
    },
  });

  if (!open) return null;
  const submitting = createMutation.isPending || updateRoleMutation.isPending;

  const canSubmit = isEdit
    ? form.role !== editing!.role
    : form.name.trim().length > 0
        && form.email.trim().length > 0
        && form.password.length >= 8
        // Super admin must pick a company; company admin's tenant is implicit.
        && (!isSuperAdmin || form.companyId != null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (isEdit) updateRoleMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0" />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop fade-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border dark:border-[#1F2A44] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1A233A] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center" aria-hidden="true">
              <UserPlus size={18} />
            </div>
            <div>
              <div className="text-[16px] font-bold text-text-primary dark:text-[#F5F7FF]">
                {isEdit ? 'Edit team member' : 'Invite team member'}
              </div>
              <div className="text-[12px] text-text-muted dark:text-[#94A3B8] mt-0.5">
                {isEdit ? 'Backend supports role changes only' : 'Add a new user with role-based permissions'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Avatar preview + name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold text-white"
              style={
                form.name
                  ? { background: 'linear-gradient(135deg, #5B5CF0 0%, #38BDF8 100%)' }
                  : { background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' }
              }
              aria-hidden="true"
            >
              {buildInitials(form.name)}
            </div>
            <div className="flex-1">
              <div className={FIELD_LABEL}>Full name</div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                disabled={isEdit}
                placeholder="e.g. Anjali Krishnan"
                className={FIELD_INPUT}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className={FIELD_LABEL}>Work email</div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                disabled={isEdit}
                placeholder="name@company.com"
                className={FIELD_INPUT + ' pl-9'}
              />
            </div>
            <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-1.5">
              {isEdit
                ? "Email can't be changed after invite — backend doesn't support it."
                : "We'll create the account with this email. They sign in with the password below."}
            </p>
          </div>

          {/* Company picker — SUPER_ADMIN, create mode only. Company admins
              don't see this; their tenant is taken from the JWT on the server. */}
          {!isEdit && isSuperAdmin && (
            <div>
              <div className={FIELD_LABEL}>Company</div>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
                <select
                  value={form.companyId == null ? '' : String(form.companyId)}
                  onChange={(e) => setField('companyId', e.target.value === '' ? null : Number(e.target.value))}
                  disabled={companiesQuery.isLoading}
                  className={FIELD_INPUT + ' pl-9 appearance-none cursor-pointer'}
                >
                  <option value="">
                    {companiesQuery.isLoading ? 'Loading companies…' : 'Select a company…'}
                  </option>
                  {(companiesQuery.data ?? [])
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              {companiesQuery.isError && (
                <p className="text-[11.5px] text-danger mt-1.5">Couldn't load companies — try again.</p>
              )}
              {!companiesQuery.isError && (
                <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-1.5">
                  The user is created inside this tenant and can't see other companies' data.
                </p>
              )}
            </div>
          )}

          {/* Password (create only) */}
          {!isEdit && (
            <div>
              <div className={FIELD_LABEL}>Initial password</div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                className={FIELD_INPUT}
              />
              <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-1.5">
                The user can change this after first sign-in.
              </p>
            </div>
          )}

          {/* Role — backend supports only Admin / Viewer */}
          <div>
            <div className={FIELD_LABEL}>Role</div>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(ROLE_DEFS) as DisplayRole[]).map((role) => {
                const def = ROLE_DEFS[role];
                const selected = form.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setField('role', role)}
                    className={
                      'text-left rounded-xl border p-3 transition ' +
                      (selected
                        ? 'border-accent/60 bg-accent-soft'
                        : 'border-border dark:border-[#2D3956] bg-surface-muted dark:bg-[#121B32] hover:border-border-strong dark:hover:border-[#2D3956]')
                    }
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: def.color }} aria-hidden="true" />
                        <span className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF]">{role}</span>
                      </div>
                      <span
                        className={
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition ' +
                          (selected ? 'border-accent bg-accent' : 'border-border dark:border-[#2D3956]')
                        }
                      >
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8] leading-snug">{def.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border dark:border-[#1F2A44] flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-[#1A233A]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-[13px] font-semibold text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            {isEdit ? (
              <>
                <Pencil size={14} aria-hidden="true" /> {submitting ? 'Saving…' : 'Save changes'}
              </>
            ) : (
              <>
                <UserPlus size={15} aria-hidden="true" /> {submitting ? 'Inviting…' : 'Send invite'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
