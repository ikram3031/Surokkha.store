import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Renders individual key performance indicator summary card with trend styling
export const KpiCard = ({ title, value, icon: Icon, trend, trendDirection, subtext }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={cn(
            'text-xs mt-1',
            trendDirection === 'up' && 'text-emerald-500',
            trendDirection === 'down' && 'text-destructive',
            trendDirection === 'neutral' && 'text-muted-foreground'
          )}
        >
          {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '-' : ''}
          {trend} {subtext || t('overview.growth', 'from last month')}
        </p>
      </CardContent>
    </Card>
  );
};
