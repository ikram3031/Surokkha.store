import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Eye, ShoppingCart, CreditCard, PackageCheck } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7', label: 'Last 7 days' },
  { id: '15', label: 'Last 15 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom range' },
];

export const EVENT_LABELS = {
  view: 'Viewed',
  add_to_cart: 'Added to cart',
  checkout: 'Reached checkout',
  purchase: 'Purchased',
};

export const METRICS = [
  { id: 'view', label: 'Views', icon: Eye },
  { id: 'add_to_cart', label: 'Add to cart', icon: ShoppingCart },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'purchase', label: 'Purchased', icon: PackageCheck },
];

// One distinct color per product, assigned in a stable order so a product keeps its color across charts
export const PRODUCT_COLORS = [
  '#2563eb', '#f97316', '#16a34a', '#dc2626', '#9333ea', '#0891b2', '#ca8a04', '#db2777',
  '#4f46e5', '#65a30d', '#0d9488', '#e11d48',
];

export const makeColorFor = (products = []) => {
  const index = new Map(products.map((p, i) => [p.productKey, i]));
  return (productKey) => PRODUCT_COLORS[(index.get(productKey) ?? 0) % PRODUCT_COLORS.length];
};

export const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;
export const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
export const formatTime = (v) => (v ? new Date(v).toLocaleTimeString('en-US', { timeStyle: 'short' }) : '-');

const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

// Date range state shared by the analytics pages. `query` is ready to append to an API URL.
export const useAnalyticsRange = () => {
  const [preset, setPreset] = useState('today');
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const customReady = preset !== 'custom' || (from && to && from <= to);
  const params = new URLSearchParams({ preset });
  if (preset === 'custom') {
    params.set('from', from);
    params.set('to', to);
  }
  return { preset, setPreset, from, setFrom, to, setTo, query: params.toString(), enabled: !!customReady };
};

export const RangeBar = ({ range }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((p) => (
        <Button
          key={p.id}
          size="sm"
          variant={range.preset === p.id ? 'default' : 'outline'}
          onClick={() => range.setPreset(p.id)}
        >
          {t(`analytics.range_${p.id}`, p.label)}
        </Button>
      ))}
      {range.preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <Input type="date" value={range.from} max={range.to} onChange={(e) => range.setFrom(e.target.value)} className="h-8 w-36" />
          <span className="text-muted-foreground">→</span>
          <Input type="date" value={range.to} min={range.from} onChange={(e) => range.setTo(e.target.value)} className="h-8 w-36" />
        </div>
      )}
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: accent }} />
        <Icon className="size-3.5" /> {label}
      </CardDescription>
      <CardTitle className="text-3xl tabular-nums">{value ?? '-'}</CardTitle>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </CardHeader>
  </Card>
);

// Shown in chart tooltips so they follow the light/dark theme
export const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--popover-foreground)',
};

// One product: its funnel numbers, day-by-day table, traffic sources, devices and the latest individual actions
export const ProductDrawer = ({ product, query, onClose }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-product-detail', product?.productKey, query],
    enabled: !!product,
    queryFn: async () =>
      (await apiClient.get(`/api/v1/product-analytics/${encodeURIComponent(product.productKey)}?${query}`)).data?.data,
  });

  return (
    <Sheet open={!!product} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{product?.name}</SheetTitle>
        </SheetHeader>
        {product && (
          <div className="space-y-5 px-4 pb-6 text-sm">
            <div className="grid grid-cols-4 gap-2 text-center">
              {METRICS.map((m) => (
                <div key={m.id} className="rounded-md border p-2">
                  <div className="text-lg font-semibold tabular-nums">{product[m.id].unique}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{EVENT_LABELS[m.id]}</div>
                </div>
              ))}
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="font-medium text-muted-foreground">{t('analytics.daily', 'Day by day')}</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('analytics.day', 'Day')}</TableHead>
                          <TableHead className="text-center">{t('analytics.views', 'Views')}</TableHead>
                          <TableHead className="text-center">{t('analytics.cart', 'Cart')}</TableHead>
                          <TableHead className="text-center">{t('analytics.checkout', 'Checkout')}</TableHead>
                          <TableHead className="text-center">{t('analytics.purchase', 'Bought')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.daily || []).slice().reverse().map((d) => (
                          <TableRow key={d.day}>
                            <TableCell>{d.day}</TableCell>
                            <TableCell className="text-center tabular-nums">{d.view}</TableCell>
                            <TableCell className="text-center tabular-nums">{d.add_to_cart}</TableCell>
                            <TableCell className="text-center tabular-nums">{d.checkout}</TableCell>
                            <TableCell className="text-center tabular-nums">{d.purchase}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-muted-foreground">{t('analytics.sources', 'Traffic source')}</h3>
                    {(data?.sources || []).map((s) => (
                      <div key={s.source} className="flex justify-between gap-2">
                        <span className="truncate">{s.source}</span>
                        <span className="tabular-nums">{s.views}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-muted-foreground">{t('analytics.devices', 'Device')}</h3>
                    {(data?.devices || []).map((d) => (
                      <div key={d.device} className="flex justify-between gap-2">
                        <span className="capitalize">{d.device}</span>
                        <span className="tabular-nums">{d.views}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-medium text-muted-foreground">{t('analytics.recent', 'Recent activity')}</h3>
                  <div className="divide-y rounded-md border">
                    {(data?.recent || []).map((e) => (
                      <div key={e._id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium">{EVENT_LABELS[e.eventType] || e.eventType}</div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {e.source} · {e.device} · {e.ipAddress || '-'} · {e.visitorId?.slice(-6)}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
