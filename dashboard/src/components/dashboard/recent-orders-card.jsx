import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/hooks/use-orders';

const STATUS_COLORS = {
  pending: '#A8A29E',
  processing: '#FACC15',
  confirmed: '#FACC15',
  hold: '#C084FC',
  shipped: '#38BDF8',
  completed: '#4ADE80',
  delivered: '#4ADE80',
  cancelled: '#F87171',
  canceled: '#F87171',
  return: '#FB923C',
  returned: '#FB923C',
};

const LIMIT = 8;

// Latest orders list shown beside the sales chart on the overview
export const RecentOrdersCard = () => {
  const { t } = useTranslation();
  const { data: ordersData, isLoading } = useOrders({ limit: LIMIT, page: 1 });
  const orders = (ordersData?.data || []).slice(0, LIMIT);

  return (
    <Card className="col-span-1 lg:col-span-3 flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle>{t('overview.recent_orders', 'Recent Orders')}</CardTitle>
          <CardDescription>{t('orders.subtitle', 'Latest orders placed in the store.')}</CardDescription>
        </div>
        <Link to="/dashboard/orders" className="shrink-0 text-xs font-medium text-primary hover:underline">
          {t('common.view_all', 'View all')}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {isLoading ? (
          Array.from({ length: LIMIT }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const status = String(order.orderStatus || order.paymentStatus || '').toLowerCase();
            return (
              <div key={order.id || order.orderNumber} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] || '#8b5cf6' }}
                  title={status}
                />
                <Link
                  to={`/dashboard/orders/${order.id || order.orderNumber}`}
                  className="shrink-0 font-mono text-xs text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <span className="flex-1 truncate text-muted-foreground" title={order.customerName}>
                  {order.customerName}
                </span>
                <span className="shrink-0 font-semibold">৳{Number(order.totalAmount || 0).toLocaleString()}</span>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground">{t('overview.no_recent_orders', 'No orders found.')}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrdersCard;
