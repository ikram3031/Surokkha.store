import { useTranslation } from 'react-i18next';
import { Clock, Loader, ShoppingCart, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Four all-time order count cards. Hidden on mobile.
export function StatCards({ stats }) {
  const { t } = useTranslation();

  const cards = [
    { label: t('overview.total_orders', 'Total Orders'), value: stats.totalOrders, icon: ShoppingCart },
    { label: t('orders.status_pending', 'Pending'), value: stats.pending, icon: Clock },
    { label: t('orders.status_processing', 'Processing'), value: stats.processing, icon: Loader },
    { label: t('orders.status_shipped', 'Shipped'), value: stats.shipped, icon: Truck },
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
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value.toLocaleString()}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default StatCards;
