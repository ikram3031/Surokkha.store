import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Receipt, BadgeCheck, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import PathaoHeader from './PathaoHeader';
import { CATEGORY_META, money } from './pathaoUtils';

const StatCard = ({ icon: Icon, iconClass, label, value, hint }) => (
  <Card className="border border-border/80 shadow-sm">
    <CardContent className="p-4 flex items-start gap-3">
      <div className={`rounded-lg p-2 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tracking-tight truncate">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

const SliceTooltip = ({ active, payload, canSeeMoney }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: row.color }} />
        {row.label}
      </div>
      <div className="text-muted-foreground mt-0.5">
        {row.count} parcel(s) · {row.percent}%{canSeeMoney ? ` · ${money(row.amount)}` : ''}
      </div>
    </div>
  );
};

// Pathao overview: the merchant panel's 8 delivery buckets, plus payout figures for the owner
export default function PathaoOverviewPage() {
  const { t } = useTranslation();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState({ from: '', to: '' });

  useEffect(() => setMounted(true), []);
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  const { data: summary, isLoading } = useQuery({
    queryKey: ['pathao-summary', range],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/parcels/summary', { params: range })).data?.data,
  });

  const canSeeMoney = Boolean(summary?.canSeeMoney);
  const rows = (summary?.categories || []).map((c) => ({
    ...c,
    label: CATEGORY_META[c.key]?.label || c.key,
    color: isDark ? CATEGORY_META[c.key]?.dark : CATEGORY_META[c.key]?.light,
  }));
  const slices = rows.filter((r) => r.count > 0);
  const settlement = summary?.settlement;

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PathaoHeader
        title={t('nav.pathao_overview', 'Pathao Overview')}
        description="Delivery buckets as in Pathao's merchant panel."
        range={range}
        onRangeChange={setRange}
      />

      <Card className="border border-border/80 shadow-sm">
        <CardContent className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative h-[220px] w-[220px] shrink-0">
            {mounted && !isLoading && slices.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={78}
                    outerRadius={104}
                    paddingAngle={0}
                    stroke="var(--card)"
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  >
                    {slices.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<SliceTooltip canSeeMoney={canSeeMoney} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {mounted && !isLoading && slices.length === 0 && (
              <div className="absolute inset-0 rounded-full border-[26px] border-muted" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">Total Orders</span>
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{isLoading ? '—' : summary?.total ?? 0}</span>
              {canSeeMoney && <span className="text-sm text-muted-foreground tabular-nums">{money(summary?.totalAmount)}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 w-full">
            {rows.map((r) => (
              <Link
                key={r.key}
                to={`/dashboard/pathao/parcels?category=${r.key}`}
                className="rounded-md p-2 -m-2 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: r.color }} />
                  <span className="truncate">{r.label}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-semibold tabular-nums">{r.count}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">{r.percent}%</span>
                </div>
                {canSeeMoney && <div className="text-sm text-muted-foreground tabular-nums mt-0.5">{money(r.amount)}</div>}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {canSeeMoney && settlement && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Wallet}
            iconClass="bg-amber-500/10 text-amber-600"
            label="Pathao owes (delivered, not paid)"
            value={money(settlement.pending.netPayout)}
            hint={`${settlement.pending.count} parcel(s), estimated`}
          />
          <StatCard
            icon={Receipt}
            iconClass="bg-blue-500/10 text-blue-600"
            label="Paid by Pathao"
            value={money(settlement.invoiced.netPayout)}
            hint={`${settlement.invoiced.count} parcel(s), import invoice for exact`}
          />
          <StatCard
            icon={BadgeCheck}
            iconClass="bg-emerald-500/10 text-emerald-600"
            label="Paid, invoice matched"
            value={money(settlement.settled.netPayout)}
            hint={`${settlement.settled.count} parcel(s)`}
          />
          <StatCard
            icon={Undo2}
            iconClass="bg-red-500/10 text-red-600"
            label="Courier charges"
            value={money(summary.totalCharges)}
            hint={`Return charges ${money(summary.returnCharges)}`}
          />
        </div>
      )}
    </div>
  );
}
