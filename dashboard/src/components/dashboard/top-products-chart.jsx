import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTopProducts } from '@/hooks/use-top-products';

const METRICS = {
  unitsSold: { label: 'Units', format: (v) => Number(v || 0).toLocaleString() },
  salesAmount: { label: 'Amount', format: (v) => `৳${Number(v || 0).toLocaleString()}` },
};

const chartConfig = {
  unitsSold: { label: 'Units sold', color: 'var(--primary)' },
  salesAmount: { label: 'Sales amount', color: 'var(--primary)' },
  label: { color: 'var(--primary-foreground)' },
};

// Horizontal bar chart of the best-selling products, switchable between units sold and sales amount
export const TopProductsChart = ({ range = '30days' }) => {
  const { t } = useTranslation();
  const [metric, setMetric] = useState('unitsSold');
  const { data: products = [], isLoading } = useTopProducts(range, 8);

  const chartData = [...products]
    .sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0))
    .map((p) => ({ ...p, shortName: p.name?.length > 28 ? `${p.name.slice(0, 27)}…` : p.name }));
  const top = chartData[0];

  return (
    <Card className="col-span-1 min-w-0 flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle>{t('overview.top_products', 'Trending Products')}</CardTitle>
          <CardDescription>{t('overview.top_products_desc', 'Best sellers in the last 30 days')}</CardDescription>
        </div>
        <div className="inline-flex shrink-0 rounded-md border border-border p-0.5 text-xs">
          {Object.entries(METRICS).map(([key, m]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={`cursor-pointer rounded px-2.5 py-1 font-medium transition-colors ${
                metric === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t('common.loading', 'Loading chart...')}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t('overview.no_sales', 'No sales in this period.')}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: Math.max(220, chartData.length * 44) }}
          >
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 64 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="shortName" type="category" tickLine={false} axisLine={false} hide />
              <XAxis dataKey={metric} type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name}
                    formatter={(value, _name, item) => (
                      <div className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">{chartConfig[metric].label}</span>
                        <span className="font-mono font-medium tabular-nums">{METRICS[metric].format(value)}</span>
                        <span className="text-muted-foreground">{item?.payload?.orderCount} orders</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={4} minPointSize={140}>
                <LabelList dataKey="shortName" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                <LabelList
                  dataKey={metric}
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={METRICS[metric].format}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      {top && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            {top.name} leads with {METRICS[metric].format(top[metric])} <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            {t('overview.top_products_note', 'Cancelled, fake and returned orders are excluded')}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default TopProductsChart;
