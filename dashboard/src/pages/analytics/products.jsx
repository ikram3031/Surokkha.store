import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Package, Search } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RangeBar, ProductDrawer, METRICS, makeColorFor, useAnalyticsRange, formatMoney } from './shared';
import { PageHeader } from '@/components/ui/page-header';

// Gold, silver, bronze for the top three; plain muted badge after that
const RANK_STYLES = ['bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300', 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'];

// Products ranked by one metric: which product got the most views, cart adds, checkouts or purchases
export default function AnalyticsProducts() {
  const { t } = useTranslation();
  const range = useAnalyticsRange('month');
  const [metric, setMetric] = useState('view');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-funnel', range.query],
    enabled: range.enabled,
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics?${range.query}`)).data,
    keepPreviousData: true,
    refetchInterval: range.preset === 'today' ? 30000 : false,
  });

  const all = data?.data || [];
  const colorFor = makeColorFor(all);
  const needle = search.trim().toLowerCase();
  const ranked = all
    .filter((p) => p[metric].total > 0 && (!needle || p.name.toLowerCase().includes(needle)))
    .sort((a, b) => b[metric].unique - a[metric].unique || b[metric].total - a[metric].total);
  const max = Math.max(1, ...ranked.map((p) => p[metric].unique));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Package />}
        title={t('analytics.products_title', 'Product Rankings')}
        description={t('analytics.products_desc', 'Which products are viewed, carted, taken to checkout and bought the most.')}
        actions={
          <>
            <RangeBar range={range} />
          </>
        }
      />

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1">
            {METRICS.map((m) => (
              <Button key={m.id} size="sm" variant={metric === m.id ? 'default' : 'outline'} onClick={() => setMetric(m.id)} className="gap-1.5">
                <m.icon className="size-3.5" />
                {t(`analytics.rank_${m.id}`, `Most ${m.label.toLowerCase()}`)}
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('analytics.search', 'Product name...')}
              className="w-full pl-8 md:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-10 text-center text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          ) : isError ? (
            <p className="py-10 text-center text-destructive">{t('analytics.error', 'Error loading analytics.')}</p>
          ) : ranked.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
          ) : (
            <div className="divide-y overflow-hidden rounded-md border">
              {ranked.map((p, i) => (
                <button
                  key={p.productKey}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/50"
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums ${RANK_STYLES[i] || 'bg-muted text-muted-foreground'}`}>
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      {p.purchase.value > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {p.purchase.qty || 0} sold · {formatMoney(p.purchase.value)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(p[metric].unique / max) * 100}%`, background: colorFor(p.productKey) }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <div className="font-semibold">{p[metric].unique}</div>
                    {p[metric].total !== p[metric].unique && (
                      <div className="text-[11px] text-muted-foreground">{p[metric].total} total</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDrawer product={selected} query={range.query} onClose={() => setSelected(null)} />
    </div>
  );
}
