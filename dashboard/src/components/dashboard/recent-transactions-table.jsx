import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/use-orders';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

// Renders the recent orders table snippet on the dashboard overview
export const RecentTransactionsTable = () => {
  const { t } = useTranslation();
  const { data: ordersData, isLoading } = useOrders({ limit: 5, page: 1 });
  const orders = ordersData?.data || [];

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'paid':
      case 'completed':
      case 'delivered':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
            {t('orders.status_delivered', 'Completed')}
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent">
            {t('orders.status_processing', 'Processing')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">
            {t('orders.status_pending', 'Pending')}
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-transparent">
            {t('orders.status_shipped', 'Shipped')}
          </Badge>
        );
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return (
          <Badge variant="destructive" className="bg-destructive hover:bg-destructive/90 text-white border-transparent">
            {t('orders.status_canceled', 'Cancelled')}
          </Badge>
        );
      case 'returned':
        return (
          <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-transparent">
            {t('orders.status_returned', 'Returned')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || t('orders.status_pending', 'Pending')}</Badge>;
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>{t('overview.recent_orders', 'Recent Orders')}</CardTitle>
          <CardDescription>{t('orders.subtitle', 'Latest orders placed in the store.')}</CardDescription>
        </div>
        <Link
          to="/dashboard/orders"
          className="text-xs text-primary hover:underline font-medium"
        >
          {t('common.view_all', 'View all')}
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('orders.order_id', 'Order ID')}</TableHead>
              <TableHead>{t('orders.customer', 'Customer')}</TableHead>
              <TableHead>{t('common.status', 'Status')}</TableHead>
              <TableHead className="text-right">{t('common.amount', 'Amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.slice(0, 5).map((tx) => (
                <TableRow key={tx.id || tx.orderNumber}>
                  <TableCell className="font-medium text-xs font-mono">
                    <Link to={`/dashboard/orders/${tx.id || tx.orderNumber}`} className="hover:underline text-primary">
                      {tx.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs" title={tx.customerName}>
                    {tx.customerName}
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.orderStatus || tx.paymentStatus)}</TableCell>
                  <TableCell className="text-right font-semibold text-xs">
                    ৳{Number(tx.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                  {t('overview.no_recent_orders', 'No orders found.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
