import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ARROW = 14; // px depth of each chevron point

// Chevron cut: flat left edge on the first segment, notched left edge on the rest, pointed right edge on all but the last
const shapeFor = (index, isLast) => {
  const right = isLast ? '100% 0, 100% 100%' : `calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%`;
  const notch = index === 0 ? '' : `, ${ARROW}px 50%`;
  return `polygon(0 0, ${right}, 0 100%${notch})`;
};

// All-time order counts as one chevron status bar. Hidden on mobile.
export function StatCards({ stats }) {
  const { t } = useTranslation();

  const steps = [
    { label: t('overview.total_orders', 'Total Orders'), value: stats.totalOrders, color: 'bg-slate-500/20 text-foreground', dot: 'bg-slate-400' },
    { label: t('orders.status_pending', 'Pending'), value: stats.pending, color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    { label: t('orders.status_processing', 'Processing'), value: stats.processing, color: 'bg-sky-500/20 text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
    { label: t('orders.status_shipped', 'Shipped'), value: stats.shipped, color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="hidden overflow-x-auto sm:block">
      <div className="flex min-w-[560px] items-stretch">
        {steps.map(({ label, value, color, dot }, index) => (
          <div
            key={label}
            style={{ clipPath: shapeFor(index, index === steps.length - 1), marginLeft: index === 0 ? 0 : -ARROW + 3 }}
            className={cn('flex flex-1 items-center justify-between gap-3 py-3 pr-6', index === 0 ? 'pl-5' : 'pl-8', color)}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={cn('size-2 rounded-full', dot)} />
              {label}
            </span>
            {stats.isLoading ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              <span className="text-xl font-bold tabular-nums">{value.toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatCards;
