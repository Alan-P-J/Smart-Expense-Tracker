import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Plus, Users as UsersIcon } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { RoleBadge } from '../components/ui/RoleBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateUserForm } from '../components/users/CreateUserForm';

import { userService } from '../api/services/userService';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../lib/initials';
import type { Role, UserResponse } from '../types';

const TH =
  'text-xs font-medium text-text-muted dark:text-text-dark-muted ' +
  'uppercase tracking-wider px-4 py-3 text-left';

const TD = 'px-4 py-3 align-middle text-sm';

const ROW =
  'border-b border-border dark:border-border-dark ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark/50 ' +
  'transition-colors duration-150';

const LINK_BTN =
  'text-xs hover:underline focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-primary rounded ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline';

const ADD_BTN =
  'flex items-center gap-2 bg-primary hover:bg-primary-hover text-white ' +
  'px-4 py-2 rounded-lg text-sm font-medium ' +
  'transition-all duration-200 active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function handleMutationError(err: unknown, fallback: string) {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    if (status === 400) {
      // Backend returns 400 for "cannot target self" — but the UI already
      // disables those buttons, so reaching this branch is a sign of a bug.
      toast.error(err.response?.data?.message ?? fallback);
      return;
    }
    if (status === 403) {
      toast.error("You don't have permission");
      return;
    }
  }
  toast.error(fallback);
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<UserResponse | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) =>
      userService.changeRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => handleMutationError(err, 'Failed to update role'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: () => {
      toast.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeactivatingUser(null);
    },
    onError: (err) => {
      handleMutationError(err, 'Failed to deactivate user');
      setDeactivatingUser(null);
    },
  });

  return (
    <>
      <PageHeader
        title="User management"
        subtitle={users ? `${users.length} users` : 'Loading…'}
        action={
          <button type="button" onClick={() => setCreateOpen(true)} className={ADD_BTN}>
            <Plus size={16} aria-hidden="true" />
            Add user
          </button>
        }
      />

      <AppCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-surface-muted dark:bg-border-dark/40 border-b border-border dark:border-border-dark">
              <tr>
                <th className={TH}>Name / Email</th>
                <th className={TH}>Role</th>
                <th className={TH}>Status</th>
                <th className={TH}>Joined</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={ROW}>
                  <td className={TD}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40 mt-1" />
                      </div>
                    </div>
                  </td>
                  <td className={TD}><Skeleton className="h-5 w-16" /></td>
                  <td className={TD}><Skeleton className="h-5 w-16" /></td>
                  <td className={TD}><Skeleton className="h-4 w-24" /></td>
                  <td className={TD}><Skeleton className="h-4 w-32 ml-auto" /></td>
                </tr>
              ))}

              {!isLoading && users && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <EmptyState icon={UsersIcon} title="No users found" />
                  </td>
                </tr>
              )}

              {!isLoading && users && users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const targetRole: Role = u.role === 'ADMIN' ? 'VIEWER' : 'ADMIN';
                const rolePending =
                  roleMutation.isPending && roleMutation.variables?.id === u.id;
                const deactivatePending =
                  deactivateMutation.isPending && deactivateMutation.variables === u.id;
                return (
                  <tr key={u.id} className={ROW}>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-primary-light text-primary text-xs font-medium flex items-center justify-center flex-shrink-0"
                          aria-hidden="true"
                        >
                          {getInitials(u.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">
                            {u.fullName}
                            {isSelf && (
                              <span className="ml-2 text-xs text-text-muted dark:text-text-dark-muted font-normal">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted dark:text-text-dark-muted truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className={TD}>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-surface-muted dark:bg-border-dark text-text-muted dark:text-text-dark-muted px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted" aria-hidden="true" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className={`${TD} text-text-muted dark:text-text-dark-muted`}>
                      {format(parseISO(u.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className={`${TD} text-right whitespace-nowrap`}>
                      {!isSelf && u.isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => roleMutation.mutate({ id: u.id, role: targetRole })}
                            disabled={rolePending}
                            className={`${LINK_BTN} text-primary`}
                          >
                            {rolePending ? 'Updating…' : `Make ${targetRole === 'ADMIN' ? 'Admin' : 'Viewer'}`}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeactivatingUser(u)}
                            disabled={deactivatePending}
                            className={`${LINK_BTN} text-danger ml-3`}
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      {!isSelf && !u.isActive && (
                        <span className="text-xs text-text-muted dark:text-text-dark-muted">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AppCard>

      <CreateUserForm
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deactivatingUser}
        title="Deactivate user"
        message={
          deactivatingUser
            ? `Deactivate ${deactivatingUser.fullName} (${deactivatingUser.email})? They will be signed out and can't log in until reactivated.`
            : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivatingUser && deactivateMutation.mutate(deactivatingUser.id)}
        onCancel={() => setDeactivatingUser(null)}
      />
    </>
  );
}
