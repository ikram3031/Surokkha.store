import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Radio, List, Eye, ShoppingCart, CreditCard, PackageCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENT_LABELS, formatTime, tooltipStyle } from './shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisitorJourney } from '@/components/dashboard/analytics/VisitorJourney';
import { PageHeader } from '@/components/ui/page-header';

// Side panel with one visitor's full history
const VisitorSheet = ({ visitorId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-visitor', visitorId],
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics/visitor/${encodeURIComponent(visitorId)}`)).data?.data,
    enabled: Boolean(visitorId),
  });
  return (
    <Sheet open={Boolean(visitorId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Visitor</SheetTitle></SheetHeader>
        <div className="px-4 pb-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : <VisitorJourney visitor={data} />}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const TABS = [
  { id: 'all', label: 'All', icon: List },
  { id: 'view', label: 'Views', icon: Eye },
  { id: 'add_to_cart', label: 'Cart', icon: ShoppingCart },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'purchase', label: 'Purchased', icon: PackageCheck },
];

const SERIES = [
  { id: 'view', color: '#2563eb', label: 'Views' },
  { id: 'add_to_cart', color: '#f97316', label: 'Add to cart' },
  { id: 'checkout', color: '#9333ea', label: 'Checkout' },
  { id: 'purchase', color: '#16a34a', label: 'Purchased' },
];

// Real-time view of today: refreshes every 15 seconds
export default function AnalyticsLive() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('all');
  const { data } = useQuery({
    queryKey: ['analytics-live', tab],
    queryFn: async () => (await apiClient.get('/api/v1/product-analytics/live', { params: tab === 'all' ? {} : { type: tab } })).data?.data,
    placeholderData: (prev) => prev,
    refetchInterval: 15000,
  });

  const [openVisitor, setOpenVisitor] = useState(null);
  const flags = data?.visitors || {};
  const todayStart = data?.todayStart ? new Date(data.todayStart) : null;
  const counts = (data?.hourly || []).reduce((acc, h) => {
    for (const k of ['view', 'add_to_cart', 'checkout', 'purchase']) acc[k] = (acc[k] || 0) + (h[k] || 0);
    return acc;
  }, {});
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);
  const hourly = (data?.hourly || []).map((h) => ({ ...h, label: `${h.hour}:00` }));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Radio />}
        title={t('analytics.live_title', 'Live Today')}
        description={<><span className="relative flex size-2.5"> <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" /> <span className="relative inline-flex size-2.5 rounded-full bg-green-500" /> </span> <span className="font-semibold tabular-nums text-foreground">{data?.activeNow ?? 0}</span> {t('analytics.active_now', 'visitors active in the last 5 minutes')}</>}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.hourly', 'Hour by hour (today)')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SERIES.map((s) => (
                  <Bar key={s.id} dataKey={s.id} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.latest', 'Latest actions')}</CardTitle>
          <div className="mt-2 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                title={label}
                aria-label={label}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  tab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums">{counts[id] || 0}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {(data?.recent || []).length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">{t('analytics.no_data_today', 'No activity yet today.')}</p>
            )}
            {(data?.recent || []).map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`inline-flex h-4 shrink-0 items-center rounded px-1 text-[10px] font-bold leading-none text-white ${
                        e.site === 'store' ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      title={e.site === 'store' ? 'surokkha.store' : 'surokkha.shop'}
                    >
                      {e.site === 'store' ? 'ST' : 'SH'}
                    </span>
                    <span className="font-medium">{EVENT_LABELS[e.eventType] || e.eventType}</span>
                    {' · '}
                    {e.productName || e.productKey}
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    <span className="truncate">{[e.source, e.device, e.os, e.browser, e.ipAddress || '-'].filter(Boolean).join(' · ')}</span>
                    {e.visitorId && (
                      <button type="button" onClick={() => setOpenVisitor(e.visitorId)} className="shrink-0 rounded bg-muted px-1 font-mono text-foreground hover:bg-primary hover:text-primary-foreground">
                        {e.visitorId.slice(-6)}
                      </button>
                    )}
                    {todayStart && flags[e.visitorId]?.firstSeen && new Date(flags[e.visitorId].firstSeen) < todayStart && (
                      <span className="shrink-0 rounded bg-amber-500 px-1 font-semibold text-white">Returning · {flags[e.visitorId].activeDays}d</span>
                    )}
                    {flags[e.visitorId]?.orders > 0 && (
                      <span className="shrink-0 rounded bg-green-600 px-1 font-semibold text-white">Ordered {flags[e.visitorId].orders}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(e.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <VisitorSheet visitorId={openVisitor} onClose={() => setOpenVisitor(null)} />
    </div>
  );
}
