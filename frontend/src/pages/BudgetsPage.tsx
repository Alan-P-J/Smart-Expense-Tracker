import { PieChart } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function BudgetsPage() {
  return (
    <EmptyState
      icon={PieChart}
      title="Budgets coming soon"
      description="Monthly budgets with live progress will appear here in a later day."
    />
  );
}
