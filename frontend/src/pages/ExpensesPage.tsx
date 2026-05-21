import { Receipt } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function ExpensesPage() {
  return (
    <EmptyState
      icon={Receipt}
      title="Expenses coming soon"
      description="The expenses table, filters, and create flow land in a later day."
    />
  );
}
