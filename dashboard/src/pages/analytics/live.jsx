import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Radio } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENT_LABELS, formatTime, tooltipStyle } from './shared';

const SERIES = [
  { id: 'view', color: '#2563eb', label: 'Views' },
  { id: 'add_to_cart', color: '#f97316', label: 'Add to cart' },
  { id: 'checkout', color: '#9333ea', label: 'Checkout' },
  { id: 'purchase', color: '#16a34a', label: 'Purchased' },
];

// Real-time view of today: refreshes every 15 seconds
export default function AnalyticsLive() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['analytics-live'],
    queryFn: async () => (await apiClient.get('/api/v1/product-analytics/live')).data?.data,
    refetchInterval: 15000,
  });

  const hourly = (data?.hourly || []).map((h) => ({ ...h, label: `${h.hour}:00` }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Radio className="h-8 w-8" />
          {t('analytics.live_title', 'Live Today')}
        </h2>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
          </span>
          <span className="font-semibold tabular-nums text-foreground">{data?.activeNow ?? 0}</span>
          {t('analytics.active_now', 'visitors active in the last 5 minutes')}
        </p>
      </div>

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
                  <div className="truncate text-[11px] text-muted-foreground">
                    {e.source} · {e.device} · {e.ipAddress || '-'} · {e.visitorId?.slice(-6)}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(e.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
