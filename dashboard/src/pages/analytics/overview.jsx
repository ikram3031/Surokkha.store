import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Eye, ShoppingCart, CreditCard, PackageCheck, LayoutDashboard } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  RangeBar, StatCard, ProductDrawer, METRICS, makeColorFor, useAnalyticsRange, formatMoney, tooltipStyle,
} from './shared';

const STEP_COLORS = { view: '#2563eb', add_to_cart: '#f97316', checkout: '#9333ea', orders: '#16a34a' };

// Horizontal funnel: every step is a bar, with the drop-off ratio between steps
const FunnelCard = ({ funnel }) => {
  const { t } = useTranslation();
  if (!funnel) return null;
  const steps = [
    { id: 'view', label: t('analytics.step_views', 'Viewed a product'), value: funnel.views.unique },
    { id: 'add_to_cart', label: t('analytics.step_cart', 'Added to cart'), value: funnel.addToCart.unique },
    { id: 'checkout', label: t('analytics.step_checkout', 'Reached checkout'), value: funnel.checkout.unique },
    { id: 'orders', label: t('analytics.step_orders', 'Placed an order'), value: funnel.orders },
  ];
  const max = Math.max(1, steps[0].value);
  const rates = [null, funnel.rates.viewToCart, funnel.rates.cartToCheckout, funnel.rates.checkoutToOrder];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.funnel', 'Conversion funnel')}</CardTitle>
        <CardDescription>
          {t('analytics.funnel_hint', 'Unique visitors at each step. Percent = how many continued from the step above.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.id} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span>{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold">{s.value}</span>
                {rates[i] != null && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{rates[i]}%</span>
                )}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, background: STEP_COLORS[s.id] }}
              />
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
          <span className="text-muted-foreground">{t('analytics.overall_rate', 'Visitors who ended up ordering')}</span>
          <span className="text-xl font-bold tabular-nums">{funnel.rates.viewToOrder}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Share of the chosen metric per product; each product keeps one color across every chart
const ProductShareCard = ({ list, metric, setMetric, colorFor }) => {
  const { t } = useTranslation();
  const rows = list
    .filter((p) => p[metric].total > 0)
    .map((p) => ({ key: p.productKey, name: p.name, value: p[metric].unique || p[metric].total }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{t('analytics.by_product', 'Products compared')}</CardTitle>
        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <Button key={m.id} size="sm" variant={metric === m.id ? 'default' : 'outline'} onClick={() => setMetric(m.id)}>
              {t(`analytics.metric_${m.id}`, m.label)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
        ) : (
          <div className="grid items-center gap-4 md:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2}>
                    {rows.map((r) => <Cell key={r.key} fill={colorFor(r.key)} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-2 text-sm">
                  <span className="size-3 shrink-0 rounded-sm" style={{ background: colorFor(r.key) }} />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <span className="font-semibold tabular-nums">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// "14:00" stays as is for hourly charts; "2026-11-01" becomes "Nov 1"
const formatBucket = (bucket, hourly) => {
  if (hourly || !bucket) return bucket;
  return new Date(`${bucket}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// Tooltip listing only the products that had activity in the hovered hour/day, biggest first
const TrendTooltip = ({ active, payload, label, series, colorFor, hourly }) => {
  if (!active || !payload?.length) return null;
  const rows = payload
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((n, r) => n + r.value, 0);
  return (
    <div style={tooltipStyle} className="max-w-xs space-y-1 p-2.5 shadow-lg">
      <div className="flex justify-between gap-4 font-semibold">
        <span>{formatBucket(label, hourly)}</span>
        <span className="tabular-nums">{total}</span>
      </div>
      {rows.length === 0 && <div className="text-muted-foreground">No activity</div>}
      {rows.map((r) => (
        <div key={r.dataKey} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-sm" style={{ background: colorFor(r.dataKey) }} />
          <span className="min-w-0 flex-1 truncate">{series.find((s) => s.productKey === r.dataKey)?.name || r.name}</span>
          <span className="tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
};

// Hour-by-hour (single day) or day-by-day stacked bars, one color per product, one colored line per product
const TrendCard = ({ query, enabled, colorFor }) => {
  const { t } = useTranslation();
  const [metric, setMetric] = useState('view');
  const { data } = useQuery({
    queryKey: ['analytics-trend', query, metric],
    enabled,
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics/trend?${query}&metric=${metric}`)).data?.data,
    keepPreviousData: true,
  });

  const series = data?.series || [];
  const rows = data?.byProduct || [];

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>
          {data?.hourly ? t('analytics.trend_hourly', 'Hour by hour') : t('analytics.trend_daily', 'Day by day')}
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <Button key={m.id} size="sm" variant={metric === m.id ? 'default' : 'outline'} onClick={() => setMetric(m.id)}>
              {t(`analytics.metric_${m.id}`, m.label)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ left: -16, right: 8, top: 8 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={(b) => formatBucket(b, data?.hourly)}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    content={<TrendTooltip series={series} colorFor={colorFor} hourly={data?.hourly} />}
                  />
                  {series.map((s) => (
                    <Bar key={s.productKey} dataKey={s.productKey} name={s.name} stackId="trend" fill={colorFor(s.productKey)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Funnel numbers per product as grouped bars, each product in its own color
const ProductBarsCard = ({ list, colorFor }) => {
  const { t } = useTranslation();
  const rows = list.slice(0, 8);
  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.funnel_by_product', 'Funnel by product')}</CardTitle>
        <CardDescription>{t('analytics.funnel_by_product_hint', 'Unique visitors per step, top 8 products by views.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={METRICS.map((m) => ({
                step: t(`analytics.metric_${m.id}`, m.label),
                ...Object.fromEntries(rows.map((p) => [p.productKey, p[m.id].unique])),
              }))}
              margin={{ left: -16, right: 8, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="step" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {rows.map((p) => (
                <Bar key={p.productKey} dataKey={p.productKey} name={p.name} fill={colorFor(p.productKey)} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductTable = ({ list, colorFor, onSelect }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.product_table', 'Every product')}</CardTitle>
        <CardDescription>
          {t('analytics.table_hint', 'Big number = unique visitors, small number = total actions. Click a row for details.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.product', 'Product')}</TableHead>
                {METRICS.map((m) => (
                  <TableHead key={m.id} className="text-center">{t(`analytics.metric_${m.id}`, m.label)}</TableHead>
                ))}
                <TableHead className="text-center">{t('analytics.view_to_cart', 'View → Cart')}</TableHead>
                <TableHead className="text-center">{t('analytics.cart_to_checkout', 'Cart → Checkout')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t('analytics.no_data', 'No activity in this period yet.')}
                  </TableCell>
                </TableRow>
              ) : (
                list.map((p) => (
                  <TableRow key={p.productKey} className="cursor-pointer" onClick={() => onSelect(p)}>
                    <TableCell className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span className="size-3 shrink-0 rounded-sm" style={{ background: colorFor(p.productKey) }} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          {p.purchase.value > 0 && (
                            <div className="text-[11px] text-muted-foreground">{formatMoney(p.purchase.value)}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {METRICS.map((m) => (
                      <TableCell key={m.id}>
                        <div className="text-center tabular-nums">
                          <div className="font-semibold">{p[m.id].unique}</div>
                          {p[m.id].total !== p[m.id].unique && (
                            <div className="text-[11px] text-muted-foreground">{p[m.id].total} total</div>
                          )}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center tabular-nums">{p.cartRate}%</TableCell>
                    <TableCell className="text-center tabular-nums">{p.checkoutRate}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsOverview() {
  const { t } = useTranslation();
  const range = useAnalyticsRange();
  const [metric, setMetric] = useState('view');
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-funnel', range.query],
    enabled: range.enabled,
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics?${range.query}`)).data,
    keepPreviousData: true,
    // "Today" stays fresh without a manual reload
    refetchInterval: range.preset === 'today' ? 30000 : false,
  });

  const list = data?.data || [];
  const funnel = data?.funnel;
  const colorFor = makeColorFor(list);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <LayoutDashboard className="h-8 w-8" />
            {t('analytics.overview_title', 'Analytics Overview')}
          </h2>
          <p className="text-muted-foreground">
            {t('analytics.overview_desc', 'How visitors move from viewing a product to placing an order. Data is kept for 90 days.')}
          </p>
        </div>
        <RangeBar range={range} />
      </div>

      {isError && <p className="text-sm text-destructive">{t('analytics.error', 'Error loading analytics.')}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Eye}
          accent={STEP_COLORS.view}
          label={t('analytics.box_views', 'Product page views')}
          value={isLoading ? '-' : funnel?.views.total}
          sub={funnel && `${funnel.views.unique} ${t('analytics.unique_visitors', 'unique visitors')}`}
        />
        <StatCard
          icon={ShoppingCart}
          accent={STEP_COLORS.add_to_cart}
          label={t('analytics.box_cart', 'Added to cart')}
          value={isLoading ? '-' : funnel?.addToCart.total}
          sub={funnel && `${funnel.rates.viewToCart}% ${t('analytics.of_viewers', 'of viewers')}`}
        />
        <StatCard
          icon={CreditCard}
          accent={STEP_COLORS.checkout}
          label={t('analytics.box_checkout', 'Reached checkout')}
          value={isLoading ? '-' : funnel?.checkout.total}
          sub={funnel && `${funnel.rates.cartToCheckout}% ${t('analytics.of_carts', 'of cart adds')}`}
        />
        <StatCard
          icon={PackageCheck}
          accent={STEP_COLORS.orders}
          label={t('analytics.box_orders', 'Orders (converted)')}
          value={isLoading ? '-' : funnel?.orders}
          sub={funnel && `${formatMoney(funnel.revenue)} · ${funnel.rates.checkoutToOrder}% ${t('analytics.of_checkouts', 'of checkouts')}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelCard funnel={funnel} />
        <ProductShareCard list={list} metric={metric} setMetric={setMetric} colorFor={colorFor} />
      </div>

      <TrendCard query={range.query} enabled={range.enabled} colorFor={colorFor} />
      <ProductBarsCard list={list} colorFor={colorFor} />
      <ProductTable list={list} colorFor={colorFor} onSelect={setSelected} />

      <ProductDrawer product={selected} query={range.query} onClose={() => setSelected(null)} />
    </div>
  );
}
