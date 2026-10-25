import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderInsight } from '@/hooks/use-order-insight';

// Order statuses shown as tiles; colors match the status pills / dropdown palette
const STATUSES = [
  { id: 'completed', key: 'orders.status_delivered', label: 'Delivered', color: '#4ADE80' },
  { id: 'shipped', key: 'orders.status_shipped', label: 'Shipped', color: '#38BDF8' },
  { id: 'processing', key: 'orders.status_processing', label: 'Processing', color: '#FACC15' },
  { id: 'pending', key: 'orders.status_pending', label: 'Pending', color: '#A8A29E' },
  { id: 'hold', key: 'orders.status_hold', label: 'On hold', color: '#C084FC' },
  { id: 'return', key: 'orders.status_returned', label: 'Returned', color: '#FB923C' },
  { id: 'cancelled', key: 'orders.status_canceled', label: 'Canceled', color: '#F87171' },
];

const money = (v) => `৳${Number(v || 0).toLocaleString()}`;
const pct = (n, total) => (total ? ((n / total) * 100).toFixed(1) : '0.0');

// Orders overview at the top of the dashboard: status donut with per-status count, share and amount, plus a range filter
export const OrdersInsight = ({ filter }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('insight');
  const { data, isLoading } = useOrderInsight(filter);

  const counts = data?.statusCounts || {};
  const amounts = data?.statusAmounts || {};

  const rows = STATUSES.map((s) => ({
    ...s,
    name: t(s.key, s.label),
    count: Number(counts[s.id] || 0),
    amount: Number(amounts[s.id] || 0),
  }));
  const totalOrders = rows.reduce((sum, r) => sum + r.count, 0);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const chartData = rows.filter((r) => r.count > 0);

  const summary = [
    { label: t('overview.total_orders', 'Total Orders'), value: totalOrders.toLocaleString() },
    { label: t('overview.total_amount', 'Total Amount'), value: money(totalAmount) },
    { label: t('overview.delivery_rate', 'Delivery Rate'), value: `${pct(byId.completed.count, totalOrders)}%` },
    { label: t('overview.return_rate', 'Return Rate'), value: `${pct(byId.return.count, totalOrders)}%` },
    { label: t('overview.cancel_rate', 'Cancel Rate'), value: `${pct(byId.cancelled.count, totalOrders)}%` },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl">{t('nav.orders', 'Orders')}</CardTitle>
          <CardDescription>{t('overview.orders_insight_desc', 'Order status breakdown with amounts. Updates every 30 seconds.')}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-border p-0.5 text-sm">
            {[
              { id: 'insight', label: t('overview.order_insight', 'Order Insight') },
              { id: 'summary', label: t('overview.summary', 'Summary') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                  view === tab.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="border-t pt-5">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
            <div className="relative mx-auto h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.length ? chartData : [{ name: '-', count: 1, color: 'var(--muted)' }]}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                    stroke="transparent"
                  >
                    {(chartData.length ? chartData : [{ color: 'var(--muted)' }]).map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  {chartData.length > 0 && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        borderColor: 'var(--border)',
                        color: 'var(--popover-foreground)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(value, name) => [`${value} (${pct(value, totalOrders)}%)`, name]}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">{t('overview.total_orders', 'Total Orders')}</span>
                <span className="text-3xl font-bold">{totalOrders.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{money(totalAmount)}</span>
              </div>
            </div>

            {view === 'insight' ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
                {rows.map((r) => (
                  <div key={r.id} className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="truncate">{r.name}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{r.count.toLocaleString()}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {pct(r.count, totalOrders)}%
                      </span>
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{money(r.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-3">
                {summary.map((s) => (
                  <div key={s.label}>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="mt-1 text-2xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersInsight;
