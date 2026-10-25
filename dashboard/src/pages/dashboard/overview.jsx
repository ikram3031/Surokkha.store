import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardRangePicker } from '@/components/dashboard/dashboard-range-picker';
import { DEFAULT_RANGE_FILTER } from '@/lib/dashboard-range';
import { OrdersInsight } from '@/components/dashboard/orders-insight';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentOrdersCard } from '@/components/dashboard/recent-orders-card';
import { OrderFulfillmentChart } from '@/components/dashboard/order-fulfillment-chart';
import { RecentMailsCard } from '@/components/dashboard/recent-mails-card';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import { useDashboardKpi } from '@/hooks/use-dashboard-kpi';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { hasMenuAccess } from '@/lib/rbac';
import { clientConfig } from '@/clientConfig';

// Renders the main store metrics overview page with sales charts and KPI indicators
const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const showMails = clientConfig.features?.webmail !== false && (hasMenuAccess(user?.role || 'Marketing Expert', 'webmail') || hasMenuAccess(user?.role || 'Marketing Expert', 'tools.messages'));
  const [filter, setFilter] = useState(DEFAULT_RANGE_FILTER);
  const { data: stats, isLoading } = useDashboardKpi(filter);

  // Formats trend indicator direction for KPI tiles
  const getTrendDirection = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return 'neutral';
    return num > 0 ? 'up' : 'down';
  };

  const trendText = t('overview.growth', 'vs last period');

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t('nav.overview', 'Dashboard')}</h2>
        <DashboardRangePicker value={filter} onChange={setFilter} />
      </div>
      
      <OrdersInsight filter={filter} />

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('overview.total_revenue', 'Total Sales')}
          value={isLoading ? <Skeleton className="h-8 w-24" /> : `৳${(stats?.sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={stats?.trends?.sales ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.sales)}
          subtext={trendText}
        />
        <KpiCard
          title={t('overview.delivered_orders', 'Total Completed Orders')}
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.completedOrders ?? 0}`}
          icon={CreditCard}
          trend={stats?.trends?.orders ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.orders)}
          subtext={trendText}
        />
        <KpiCard
          title={t('overview.avg_order_value', 'Average Order Value')}
          value={isLoading ? <Skeleton className="h-8 w-24" /> : `৳${(stats?.aov ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Activity}
          trend={stats?.trends?.aov ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.aov)}
          subtext={trendText}
        />
        <KpiCard
          title={t('nav.customer_list', 'Total Members')}
          value={isLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.members ?? 0}`}
          icon={Users}
          trend={stats?.trends?.members ?? '0.0'}
          trendDirection={getTrendDirection(stats?.trends?.members)}
          subtext={trendText}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <RevenueChart filter={filter} />
        <RecentOrdersCard />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <OrderFulfillmentChart />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {showMails ? <RecentMailsCard /> : null}
        <TopProductsChart filter={filter} />
      </div>
    </div>
  );
};

export default DashboardPage;
