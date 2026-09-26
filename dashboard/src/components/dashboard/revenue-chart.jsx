import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { useOrderCounts } from '@/hooks/use-order-counts';

// Renders the 30-day order trends line chart with responsive grid
export const RevenueChart = () => {
  const { t, i18n } = useTranslation();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: counts = [] } = useOrderCounts(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : undefined;

  const data = (counts || []).map((c) => ({
    name: new Date(c.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    count: c.count,
  }));

  if (!mounted) {
    return (
      <Card className="col-span-1 lg:col-span-4 h-[400px]">
        <CardHeader>
          <CardTitle>{t('overview.sales_analytics', 'Orders (last 30 days)')}</CardTitle>
          <CardDescription>{t('overview.sales_overview', 'Daily order counts for the last 30 days.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            {t('common.loading', 'Loading chart...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>{t('overview.sales_analytics', 'Orders (last 30 days)')}</CardTitle>
        <CardDescription>{t('overview.sales_overview', 'Daily order counts for the last 30 days.')}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 sm:pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  color: isDark ? '#f9fafb' : '#111827',
                  borderRadius: '6px',
                }}
                formatter={(value) => [value, t('overview.orders', 'Orders')]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#c5a059"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#c5a059' }}
                activeDot={{ r: 6, fill: '#c5a059' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
