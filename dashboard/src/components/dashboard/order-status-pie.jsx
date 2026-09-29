import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderStatusDistribution } from '@/hooks/use-order-status-distribution';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

const STATUS_CONFIG = {
  processing: { key: 'orders.status_processing', defaultLabel: 'Processing', color: '#ffcc00' },
  shipped: { key: 'orders.status_shipped', defaultLabel: 'Shipped', color: '#3865a3' },
  confirmed: { key: 'orders.status_confirmed', defaultLabel: 'Confirmed', color: '#87a2c7' },
  completed: { key: 'orders.status_delivered', defaultLabel: 'Delivered', color: '#64a338' },
  delivered: { key: 'orders.status_delivered', defaultLabel: 'Delivered', color: '#64a338' },
  cancelled: { key: 'orders.status_canceled', defaultLabel: 'Canceled', color: '#e03b24' },
  canceled: { key: 'orders.status_canceled', defaultLabel: 'Canceled', color: '#e03b24' },
  returned: { key: 'orders.status_returned', defaultLabel: 'Returned', color: '#e03b24' },
  pending: { key: 'orders.status_pending', defaultLabel: 'Pending', color: '#ffcc00' },
};

// Renders the order distribution donut pie chart with interactive status legend
export const OrderStatusPie = ({ range = '30days' }) => {
  const { t } = useTranslation();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: statusCounts = {}, isLoading } = useOrderStatusDistribution(range);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const total = Object.values(statusCounts).reduce((sum, v) => sum + Number(v || 0), 0);

  const chartData = Object.entries(statusCounts).map(([status, count]) => {
    const key = status.toLowerCase();
    const cfg = STATUS_CONFIG[key] || {
      key: `orders.status_${key}`,
      defaultLabel: status.charAt(0).toUpperCase() + status.slice(1),
      color: '#8b5cf6',
    };
    return {
      name: t(cfg.key, cfg.defaultLabel),
      value: Number(count || 0),
      color: cfg.color,
      percent: total ? ((Number(count || 0) / total) * 100).toFixed(1) : '0',
    };
  });

  return (
    <Card className="col-span-1 lg:col-span-3 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>{t('overview.order_status_distribution', 'Order Status')}</CardTitle>
        <CardDescription>{t('overview.dashboard_summary', 'Distribution of order statuses (last 30 days).')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center pb-4">
        {!mounted || isLoading ? (
          <div className="h-[220px] w-full flex items-center justify-center text-muted-foreground text-sm">
            {t('common.loading', 'Loading chart...')}
          </div>
        ) : total === 0 ? (
          <div className="h-[220px] w-full flex items-center justify-center text-muted-foreground text-sm">
            {t('common.no_data', 'No order status data available.')}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      color: isDark ? '#f9fafb' : '#111827',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [
                      `${value} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {t('overview.orders', 'Orders')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full px-4">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusPie;
