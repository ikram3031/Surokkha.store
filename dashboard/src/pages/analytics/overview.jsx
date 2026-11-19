import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { ArrowDown, ArrowRight, ArrowUp, LayoutDashboard } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RangeBar, ProductDrawer, useAnalyticsRange, formatMoney, tooltipStyle } from './shared';

const VIEW_COLOR = '#2563eb';
const ORDER_COLOR = '#16a34a';
const FUNNEL_COLORS = ['#2563eb', '#f97316', '#9333ea', '#16a34a'];

// % change against the previous window; null when there is nothing to compare with
const changeOf = (now, before) => {
  if (!before) return now > 0 ? null : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
};

const Change = ({ value }) => {
  if (value == null) return <span className="text-xs text-muted-foreground">new</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {Math.abs(value)}% <Icon className="size-3" />
    </span>
  );
};

// One card, four KPIs side by side with dividers (stacked 2x2 on phones)
const KpiStrip = ({ funnel, loading }) => {
  const { t } = useTranslation();
  const prev = funnel?.previous;
  const items = [
    { label: t('analytics.kpi_visitors', 'Product visitors'), value: funnel?.views.unique, before: prev?.views.unique },
    { label: t('analytics.kpi_cart', 'Added to cart'), value: funnel?.addToCart.unique, before: prev?.addToCart.unique },
    { label: t('analytics.kpi_orders', 'Orders'), value: funnel?.orders, before: prev?.orders },
    {
      label: t('analytics.kpi_revenue', 'Revenue'),
      value: funnel?.revenue,
      before: prev?.revenue,
      format: formatMoney,
    },
  ];
  return (
    <Card className="py-0">
      <div className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x [&>*:nth-child(-n+2)]:border-b lg:[&>*]:border-b-0">
        {items.map((k) => (
          <div key={k.label} className="space-y-2 p-4 sm:p-5">
            <div className="text-sm text-muted-foreground">{k.label}</div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {loading || k.value == null ? '-' : (k.format ? k.format(k.value) : k.value.toLocaleString('en-US'))}
              </span>
              {!loading && funnel && <Change value={changeOf(k.value, k.before)} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const formatBucket = (bucket, hourly) => {
  if (hourly || !bucket) return bucket;
  return new Date(`${bucket}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// Sum every product's bar in a bucket into one total
const totals = (data) =>
  (data?.byProduct || []).map((row) => ({
    bucket: row.bucket,
    value: Object.entries(row).reduce((n, [k, v]) => (k === 'bucket' ? n : n + (Number(v) || 0)), 0),
  }));

// Views vs purchases over the range (hour by hour for a single day)
const TrafficChart = ({ query, enabled }) => {
  const { t } = useTranslation();
  const fetchTrend = (metric) => async () =>
    (await apiClient.get(`/api/v1/product-analytics/trend?${query}&metric=${metric}`)).data?.data;
  const views = useQuery({ queryKey: ['analytics-trend', query, 'view'], enabled, queryFn: fetchTrend('view'), keepPreviousData: true });
  const buys = useQuery({ queryKey: ['analytics-trend', query, 'purchase'], enabled, queryFn: fetchTrend('purchase'), keepPreviousData: true });

  const hourly = views.data?.hourly;
  const buyMap = new Map(totals(buys.data).map((r) => [r.bucket, r.value]));
  const rows = totals(views.data).map((r) => ({ bucket: r.bucket, views: r.value, purchases: buyMap.get(r.bucket) || 0 }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>{t('analytics.traffic', 'Visitor activity')}</CardTitle>
          <CardDescription>{hourly ? t('analytics.trend_hourly', 'Hour by hour') : t('analytics.trend_daily', 'Day by day')}</CardDescription>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: VIEW_COLOR }} />{t('analytics.views', 'Views')}</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: ORDER_COLOR }} />{t('analytics.purchase', 'Bought')}</span>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-24 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="ov-views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VIEW_COLOR} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={VIEW_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ov-buys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORDER_COLOR} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={ORDER_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={(b) => formatBucket(b, hourly)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(b) => formatBucket(b, hourly)} />
                <Area type="monotone" dataKey="views" name={t('analytics.views', 'Views')} stroke={VIEW_COLOR} strokeWidth={2} fill="url(#ov-views)" />
                <Area type="monotone" dataKey="purchases" name={t('analytics.purchase', 'Bought')} stroke={ORDER_COLOR} strokeWidth={2} fill="url(#ov-buys)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Donut of the four steps with the overall conversion rate in the middle
const FunnelDonut = ({ funnel }) => {
  const { t } = useTranslation();
  const steps = funnel
    ? [
        { name: t('analytics.step_views', 'Viewed a product'), value: funnel.views.unique },
        { name: t('analytics.step_cart', 'Added to cart'), value: funnel.addToCart.unique },
        { name: t('analytics.step_checkout', 'Reached checkout'), value: funnel.checkout.unique },
        { name: t('analytics.step_orders', 'Placed an order'), value: funnel.orders },
      ]
    : [];
  const hasData = steps.some((s) => s.value > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <CardTitle>{t('analytics.funnel', 'Conversion funnel')}</CardTitle>
        <Link to="/analytics/conversion" className="text-xs text-muted-foreground hover:text-foreground">
          {t('analytics.details', 'Details')} →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative mx-auto h-44 w-44">
          {hasData && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={steps} dataKey="value" innerRadius="70%" outerRadius="100%" paddingAngle={3} stroke="none">
                  {steps.map((s, i) => <Cell key={s.name} fill={FUNNEL_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{funnel ? `${funnel.rates.viewToOrder}%` : '-'}</span>
            <span className="text-xs text-muted-foreground">{t('analytics.converted', 'converted')}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {steps.map((s, i) => (
            <div key={s.name} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: FUNNEL_COLORS[i] }} />
              <div className="min-w-0">
                <div className="truncate text-xs text-muted-foreground">{s.name}</div>
                <div className="font-semibold tabular-nums">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Five best sellers (by revenue, then by views when nothing sold yet)
const TopProducts = ({ list, onSelect }) => {
  const { t } = useTranslation();
  const top = list
    .slice()
    .sort((a, b) => b.purchase.value - a.purchase.value || b.purchase.qty - a.purchase.qty || b.view.unique - a.view.unique)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>{t('analytics.top_products', 'Top products')}</CardTitle>
        <Link to="/analytics/products" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {t('analytics.see_all', 'See all')} <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
        ) : (
          <div className="divide-y">
            {top.map((p, i) => (
              <button key={p.productKey} type="button" onClick={() => onSelect(p)} className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.purchase.qty || 0} {t('analytics.sold', 'sold')} · {p.view.unique} {t('analytics.viewers', 'viewers')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatMoney(p.purchase.value)}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{p.purchaseRate}%</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Step-to-step drop-off: where visitors are lost
const DropOff = ({ funnel }) => {
  const { t } = useTranslation();
  const rows = funnel
    ? [
        { label: t('analytics.view_to_cart', 'View → Cart'), rate: funnel.rates.viewToCart, color: FUNNEL_COLORS[1] },
        { label: t('analytics.cart_to_checkout', 'Cart → Checkout'), rate: funnel.rates.cartToCheckout, color: FUNNEL_COLORS[2] },
        { label: t('analytics.checkout_to_order', 'Checkout → Order'), rate: funnel.rates.checkoutToOrder, color: FUNNEL_COLORS[3] },
      ]
    : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.step_rates', 'Step conversion')}</CardTitle>
        <CardDescription>{t('analytics.step_rates_hint', 'Share of visitors who moved on to the next step')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>{r.label}</span>
              <span className="font-semibold tabular-nums">{r.rate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.rate)}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function AnalyticsOverview() {
  const { t } = useTranslation();
  const range = useAnalyticsRange();
  const [selected, setSelected] = React.useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-funnel', range.query],
    enabled: range.enabled,
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics?${range.query}`)).data,
    keepPreviousData: true,
    refetchInterval: range.preset === 'today' ? 30000 : false,
  });

  const list = data?.data || [];
  const funnel = data?.funnel;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <LayoutDashboard className="h-8 w-8" />
            {t('analytics.overview_title', 'Analytics Overview')}
          </h2>
          <p className="text-muted-foreground">
            {t('analytics.overview_short', 'Store performance at a glance, compared with the previous period.')}
          </p>
        </div>
        <RangeBar range={range} />
      </div>

      {isError && <p className="text-sm text-destructive">{t('analytics.error', 'Error loading analytics.')}</p>}

      <KpiStrip funnel={funnel} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <TrafficChart query={range.query} enabled={range.enabled} />
        <FunnelDonut funnel={funnel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><TopProducts list={list} onSelect={setSelected} /></div>
        <DropOff funnel={funnel} />
      </div>

      <ProductDrawer product={selected} query={range.query} onClose={() => setSelected(null)} />
    </div>
  );
}
