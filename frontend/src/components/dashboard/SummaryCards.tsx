import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Hash, Receipt, Tag } from 'lucide-react';

import { SummaryCard } from './SummaryCard';
import { dashboardService } from '../../api/services/dashboardService';
import { formatCurrency } from '../../lib/format';

const GRID = 'grid grid-cols-2 lg:grid-cols-4 gap-4';

export function SummaryCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary,
  });

  if (isLoading) {
    return (
      <div className={GRID}>
        <SummaryCard isLoading title="" value="" icon={Receipt}        iconBg="bg-primary-light"          iconColor="text-primary" />
        <SummaryCard isLoading title="" value="" icon={Hash}           iconBg="bg-success/10"             iconColor="text-success" />
        <SummaryCard isLoading title="" value="" icon={Tag}            iconBg="bg-warning/10"             iconColor="text-warning" />
        <SummaryCard isLoading title="" value="" icon={AlertTriangle}  iconBg="bg-surface-muted"          iconColor="text-text-muted" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={GRID}>
        {(['Total this month', 'Transactions', 'Top category', 'Budget alerts'] as const).map((title) => (
          <SummaryCard
            key={title}
            title={title}
            value="—"
            icon={AlertTriangle}
            iconBg="bg-danger/10"
            iconColor="text-danger"
            trend={{ value: 0, label: 'Failed to load' }}
            trendKind="delta"
          />
        ))}
      </div>
    );
  }

  const alertActive = data.alertCount > 0;
  const topAmountNum = data.topCategoryAmount == null ? null : Number(data.topCategoryAmount);

  return (
    <div className={GRID}>
      <SummaryCard
        title="Total this month"
        value={formatCurrency(data.totalAmount)}
        icon={Receipt}
        iconBg="bg-primary-light"
        iconColor="text-primary"
      />

      <SummaryCard
        title="Transactions"
        value={data.totalCount.toString()}
        icon={Hash}
        iconBg="bg-success/10"
        iconColor="text-success"
      />

      <SummaryCard
        title="Top category"
        value={data.topCategoryName ?? '—'}
        icon={Tag}
        iconBg="bg-warning/10"
        iconColor="text-warning"
        trend={
          topAmountNum != null
            ? { value: topAmountNum, label: 'this month' }
            : undefined
        }
        trendKind="currency"
      />

      <SummaryCard
        title="Budget alerts"
        value={data.alertCount.toString()}
        icon={AlertTriangle}
        iconBg={alertActive ? 'bg-danger/10' : 'bg-surface-muted dark:bg-border-dark-strong'}
        iconColor={alertActive ? 'text-danger' : 'text-text-muted dark:text-text-dark-muted'}
      />
    </div>
  );
}
