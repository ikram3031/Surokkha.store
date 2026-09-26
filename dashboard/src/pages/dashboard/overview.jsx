import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrderStatusPie } from '@/components/dashboard/order-status-pie';
import { RecentTransactionsTable } from '@/components/dashboard/recent-transactions-table';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import { useDashboardKpi } from '@/hooks/use-dashboard-kpi';
import { Skeleton } from '@/components/ui/skeleton';

// Renders the main store metrics overview page with sales charts and KPI indicators
const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = useDashboardKpi('30days');

  // Calculates formatted 30-day date range label based on current locale
  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 29);

    const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US';
    const fmt = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${fmt(from)} – ${fmt(now)}`;
  }, [i18n.language]);

  // Formats trend indicator direction for KPI tiles
  const getTrendDirection = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return 'neutral';
    return num > 0 ? 'up' : 'down';
  };

  const trendText = t('overview.growth', 'vs last period');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.overview', 'Dashboard')}</h2>
        <span className="text-sm text-muted-foreground">
          {t('overview.this_month', 'Last 30 Days')} ({dateRangeLabel})
        </span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <RevenueChart />
        <OrderStatusPie range="30days" />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <RecentTransactionsTable />
      </div>
    </div>
  );
};

export default DashboardPage;
