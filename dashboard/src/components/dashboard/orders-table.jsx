import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/hooks/use-orders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertCircle, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';
import { OrderAccordionDetail } from '@/components/dashboard/order-accordion-detail';

// Renders the orders table with expandable accordion rows, filtering, batch selection, and inline actions
export const OrdersTable = ({
  searchQuery,
  statusFilter,
  paymentFilter,
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
  orderType = 'online',
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: responseData, isLoading, isError, error } = useOrders({
    search: searchQuery,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    paymentStatus: paymentFilter !== 'All' ? paymentFilter : undefined,
    page,
    limit: 15,
    orderType,
  });

  const orders = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  const [expandedOrderIds, setExpandedOrderIds] = useState([]);

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [targetOrderStatus, setTargetOrderStatus] = useState('Not Found');
  const [targetPaymentStatus, setTargetPaymentStatus] = useState('Not Found');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Toggles row expansion for displaying detailed order accordion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Opens the quick status update dialog for a selected order
  const handleOpenStatusModal = (order) => {
    setStatusTarget(order);
    setTargetOrderStatus(order.orderStatus || 'Not found');
    setTargetPaymentStatus(order.paymentStatus || 'Not found');
  };

  // Submits the quick status changes from the modal
  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await apiClient.put(`/api/v1/orders/${statusTarget.id}`, {
        status: targetOrderStatus.toLowerCase(),
        paymentStatus: targetPaymentStatus.toLowerCase(),
      });
      toast.success(t('orders.order_updated_success', `Status for order #${statusTarget.orderNumber} updated successfully.`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', statusTarget.id] });
      setStatusTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Permanently deletes an individual order
  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/orders/${deleteTarget.id}`);
      toast.success(t('common.deleted', `Order ${deleteTarget.orderNumber} deleted successfully.`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete order.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigates directly to the edit mode for the order
  const handleEditOrderClick = (order) => {
    navigate(`/dashboard/orders/${order.id}?edit=true`);
  };

  // Navigates to the full standalone order details page
  const handleViewDetails = (order) => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  // Resolves the visual badge representation for payment status
  const getPaymentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">{t('orders.status_paid', 'Paid')}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:text-amber-400">{t('orders.status_pending', 'Pending')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('common.error', 'Failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Resolves the visual badge representation for fulfillment status
  const getFulfillmentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">{t('orders.status_delivered', 'Completed')}</Badge>;
      case 'shipped':
        return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-600 hover:bg-indigo-500/30 dark:text-indigo-400">{t('orders.status_shipped', 'Shipped')}</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400">{t('orders.status_processing', 'Processing')}</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge variant="destructive">{t('orders.status_canceled', 'Cancelled')}</Badge>;
      case 'returned':
        return <Badge variant="destructive" className="bg-pink-500/20 text-pink-600">{t('orders.status_returned', 'Returned')}</Badge>;
      case 'pending':
      case 'unfulfilled':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:text-amber-400">{t('orders.status_pending', 'Pending')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
        <AlertDescription>
          {t('common.error', 'Failed to fetch orders.')} {error instanceof Error ? error.message : ''}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = orders.length > 0 && orders.every(order => selectedIds.includes(order.id));
  const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : undefined;

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36px] pl-3 pr-0"></TableHead>
            <TableHead className="w-[44px] px-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                checked={isAllPageSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    const pageIds = orders.map(order => order.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = orders.map(order => order.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[150px]">{t('orders.order_id', 'Order ID')}</TableHead>
            <TableHead className="w-[180px]">{t('orders.customer_name', 'Customer Name')}</TableHead>
            <TableHead className="w-[110px]">{t('common.date', 'Date')}</TableHead>
            <TableHead className="w-[120px]">{t('common.total', 'Total Amount')}</TableHead>
            <TableHead className="w-[100px]">{t('orders.payment_status', 'Payment')}</TableHead>
            <TableHead className="w-[120px]">{t('common.status', 'Status')}</TableHead>
            <TableHead className="w-[60px] text-right">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[36px] pl-3 pr-0">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell className="w-[44px] px-2">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : orders && orders.length > 0 ? (
            orders.map((order) => {
              const isExpanded = expandedOrderIds.includes(order.id);
              return (
                <div key={order.id} className="contents">
                  <TableRow
                    className={`cursor-pointer transition-colors ${
                      isExpanded
                        ? 'bg-muted/40 font-medium border-l-4 border-l-primary'
                        : 'hover:bg-muted/20'
                    }`}
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <TableCell className="w-[36px] pl-3 pr-0 text-muted-foreground">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted/50 transition-transform"
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrderExpansion(order.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell
                      className="w-[44px] px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectedIdsChange([...selectedIds, order.id]);
                          } else {
                            onSelectedIdsChange(selectedIds.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell
                      className="max-w-[150px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        className="font-semibold truncate block text-primary hover:underline hover:text-primary/80 transition-colors"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="truncate block" title={order.customerName}>{order.customerName}</span>
                    </TableCell>
                    <TableCell className="w-[110px] text-muted-foreground whitespace-nowrap">
                      {new Date(order.date).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="w-[120px] font-medium whitespace-nowrap">
                      <span>৳{Number(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {order.couponCode && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          <Tag className="h-2.5 w-2.5" />
                          {order.couponCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="w-[100px]">{getPaymentBadge(order.paymentStatus)}</TableCell>
                    <TableCell className="w-[120px]">{getFulfillmentBadge(order.orderStatus)}</TableCell>
                    <TableCell
                      className="text-right w-[60px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            {t('common.details', 'View Details')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOrderClick(order)}>
                            {t('common.edit', 'Edit Order')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenStatusModal(order)}>
                            {t('orders.change_status', 'Change Status')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => setDeleteTarget({ id: order.id, orderNumber: order.orderNumber })}
                          >
                            {t('common.delete', 'Delete Order')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="hover:bg-transparent border-b bg-muted/10">
                      <TableCell colSpan={9} className="p-0">
                        <OrderAccordionDetail order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </div>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                {t('overview.no_recent_orders', 'No orders found.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Change Status')}</DialogTitle>
            <DialogDescription>
              {t('orders.order_details', 'Update order and payment status for')} <span className="font-semibold text-foreground">{statusTarget?.orderNumber}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t('orders.order_status', 'Order Status')}</label>
              <Select value={targetOrderStatus} onValueChange={(val) => setTargetOrderStatus(val || "Not found")}>
                <SelectTrigger className="w-full h-9 cursor-pointer">
                  <SelectValue placeholder={t('orders.order_status', 'Order status')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Processing">{t('orders.status_processing', 'Processing')}</SelectItem>
                  <SelectItem value="Shipped">{t('orders.status_shipped', 'Shipped')}</SelectItem>
                  <SelectItem value="Completed">{t('orders.status_delivered', 'Completed')}</SelectItem>
                  <SelectItem value="Cancelled">{t('orders.status_canceled', 'Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t('orders.payment_status', 'Payment Status')}</label>
              <Select value={targetPaymentStatus} onValueChange={(val) => setTargetPaymentStatus(val || "Pending")}>
                <SelectTrigger className="w-full h-9 cursor-pointer">
                  <SelectValue placeholder={t('orders.payment_status', 'Payment status')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Pending">{t('orders.status_pending', 'Pending')}</SelectItem>
                  <SelectItem value="Paid">{t('orders.status_paid', 'Paid')}</SelectItem>
                  <SelectItem value="Partial">{t('orders.status_partial', 'Partial')}</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={isUpdatingStatus}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? t('common.saving', 'Saving...') : t('common.save_changes', 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteOrder}
        isDeleting={isDeleting}
        title={t('common.delete', 'Delete Order')}
        description={`${t('common.confirm_delete', 'Are you sure you want to delete order')} ${deleteTarget?.orderNumber ?? ''}?`}
      />
    </div>
  );
};
