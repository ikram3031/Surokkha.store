import { useTranslation } from 'react-i18next';
import { Clock, PackageCheck, ShoppingCart, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formatTaka = (value) => `৳${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Four summary cards for the last 30 days. Hidden on mobile.
export function StatCards({ stats }) {
  const { t } = useTranslation();
  const last30 = t('orders.last_30_days', 'Last 30 days');

  const cards = [
    { label: t('nav.orders', 'Orders'), value: stats.totalOrders.toLocaleString(), icon: ShoppingCart },
    { label: t('orders.status_pending', 'Pending'), value: stats.pending.toLocaleString(), icon: Clock },
    { label: t('overview.total_revenue', 'Total Revenue'), value: formatTaka(stats.sales), icon: Wallet },
    { label: t('overview.delivered_orders', 'Delivered Orders'), value: stats.completed.toLocaleString(), icon: PackageCheck },
  ];

  return (
    <div className="hidden grid-cols-2 gap-4 sm:grid xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <Icon className="size-4 text-muted-foreground" />
          </div>
          {stats.isLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{last30}</p>
        </div>
      ))}
    </div>
  );
}

export default StatCards;
