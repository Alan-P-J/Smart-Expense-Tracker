import { Users } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function UsersPage() {
  return (
    <EmptyState
      icon={Users}
      title="User management coming soon"
      description="Admins will be able to invite and manage admin users here."
    />
  );
}
