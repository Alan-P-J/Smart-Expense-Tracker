import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function DashboardPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Dashboard coming soon"
      description="Charts and summaries will appear here in Day 7."
    />
  );
}
