import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { DoorOpen, Eye, FileText, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RangeBar, StatCard, useAnalyticsRange, tooltipStyle } from './shared';
import { PageHeader } from '@/components/ui/page-header';

const VIEW_COLOR = '#2563eb';

const SITES = [
  { id: 'all', label: 'Both sites' },
  { id: 'store', label: 'surokkha.store' },
  { id: 'shop', label: 'surokkha.shop' },
];

const PAGE_TYPE_LABELS = {
  home: 'Home',
  'home-classic': 'Home',
  offer: 'Offer',
  offers: 'Offers',
  'offer-products': 'Offer products',
  'group-offer': 'Group offer',
  shop: 'Shop',
  category: 'Category',
  combo: 'Combo',
  blog: 'Blog',
  'blog-post': 'Blog post',
  confirmation: 'Order confirmed',
  account: 'Account',
  faq: 'FAQ',
  policy: 'Policy',
  'not-found': 'Not found',
  notfound: 'Not found',
};

// Hour label for a single day, short date otherwise
const formatBucket = (b, hourly) => (hourly ? b : new Date(`${b}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

// Blog posts show their title; other pages may keep the previous page's title, so they are named by type and path
const pageLabel = (row) => {
  const title = row.pageType === 'blog-post' ? (row.title || '').split(/\s[|–-]\s/)[0].trim() : '';
  return title || (row.path === '/' ? PAGE_TYPE_LABELS[row.pageType] || 'Home' : row.path);
};

// Page views report: which pages people open and which pages they enter the site on
export default function AnalyticsPages() {
  const { t } = useTranslation();
  const range = useAnalyticsRange('today');
  const [site, setSite] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-pages', range.query, site],
    enabled: range.enabled,
    queryFn: async () => (await apiClient.get(`/api/v1/product-analytics/pages?${range.query}${site === 'all' ? '' : `&site=${site}`}`)).data,
    keepPreviousData: true,
    refetchInterval: range.preset === 'today' ? 30000 : false,
  });

  const report = data?.data;
  const totals = report?.totals || { views: 0, visitors: 0, landings: 0 };
  const pages = report?.pages || [];
  const landingPages = report?.landingPages || [];
  const sources = report?.sources || [];
  const maxViews = Math.max(1, ...pages.map((p) => p.views));
  const showSite = site === 'all';

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<FileText />}
        title={t('analytics.pages_title', 'Pages')}
        description={t('analytics.pages_desc', 'Page views and landing pages. Product and checkout pages are counted under products.')}
        actions={
          <>
            <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {SITES.map((s) => (
              <Button key={s.id} size="sm" variant={site === s.id ? 'default' : 'outline'} onClick={() => setSite(s.id)}>
                {s.label}
              </Button>
            ))}
          </div>
          <RangeBar range={range} />
        </div>
          </>
        }
      />

      {isError ? (
        <p className="py-10 text-center text-destructive">{t('analytics.error', 'Error loading analytics.')}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Eye} label={t('analytics.page_views', 'Page views')} value={isLoading ? '-' : totals.views} accent={VIEW_COLOR} />
            <StatCard icon={Users} label={t('analytics.visitors', 'Visitors')} value={isLoading ? '-' : totals.visitors} accent="#9333ea" />
            <StatCard icon={DoorOpen} label={t('analytics.visits', 'Visits started')} value={isLoading ? '-' : totals.landings} sub={t('analytics.visits_sub', 'Entries counted on non-product pages')} accent="#16a34a" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.page_views_trend', 'Page views over time')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!report || totals.views === 0 ? (
                <p className="py-24 text-center text-sm text-muted-foreground">{isLoading ? t('common.loading', 'Loading...') : t('analytics.no_data', 'No activity in this period yet.')}</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.trend} margin={{ left: -16, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="pg-views" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={VIEW_COLOR} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={VIEW_COLOR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="bucket" tickFormatter={(b) => formatBucket(b, report.hourly)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} labelFormatter={(b) => formatBucket(b, report.hourly)} />
                      <Area type="monotone" dataKey="views" name={t('analytics.page_views', 'Page views')} stroke={VIEW_COLOR} strokeWidth={2} fill="url(#pg-views)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.top_pages', 'Most viewed pages')}</CardTitle>
                <CardDescription>{t('analytics.top_pages_desc', 'Views and unique visitors per page')}</CardDescription>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
                ) : (
                  <div className="divide-y overflow-hidden rounded-md border">
                    {pages.map((p) => (
                      <div key={`${p.site}|${p.path}`} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium" title={p.path}>{pageLabel(p)}</span>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{PAGE_TYPE_LABELS[p.pageType] || p.pageType}</Badge>
                            {showSite && <Badge variant="secondary" className="shrink-0 text-[10px]">{p.site}</Badge>}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{p.path}</div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: `${(p.views / maxViews) * 100}%`, background: VIEW_COLOR }} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right tabular-nums">
                          <div className="font-semibold">{p.views}</div>
                          <div className="text-[11px] text-muted-foreground">{p.visitors} {t('analytics.visitors_short', 'visitors')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.landing_pages', 'Landing pages')}</CardTitle>
                  <CardDescription>{t('analytics.landing_pages_desc', 'The page a visit started on, and where those visitors came from')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {landingPages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
                  ) : (
                    <div className="divide-y overflow-hidden rounded-md border">
                      {landingPages.map((p) => (
                        <div key={`${p.site}|${p.path}`} className="px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium" title={p.path}>{pageLabel(p)}</span>
                                {showSite && <Badge variant="secondary" className="shrink-0 text-[10px]">{p.site}</Badge>}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{p.path}</div>
                            </div>
                            <span className="shrink-0 font-semibold tabular-nums">{p.entries}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.sources.map((s) => (
                              <Badge key={s.source} variant="outline" className="text-[10px] font-normal">
                                {s.source || 'direct'} · {s.entries}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.entry_sources', 'Where visits come from')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {sources.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t('analytics.no_data', 'No activity in this period yet.')}</p>
                  ) : (
                    <div className="space-y-2">
                      {sources.map((s) => (
                        <div key={s.source} className="flex items-center gap-3 text-sm">
                          <span className="w-32 truncate">{s.source}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(s.entries / Math.max(1, sources[0].entries)) * 100}%` }} />
                          </div>
                          <span className="w-10 text-right tabular-nums">{s.entries}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
