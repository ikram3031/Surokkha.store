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
import { Input } from '@/components/ui/input';
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
import { MoreHorizontal, AlertCircle, Tag, Truck, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';
import { SendOrderInvoiceModal } from '@/components/dashboard/orders/SendOrderInvoiceModal';
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
import { formatDate } from '@/utils/dateHelper';

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
  isReadOnly = false,
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
  const [targetReturnFee, setTargetReturnFee] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [sendInvoiceTarget, setSendInvoiceTarget] = useState(null);

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
    setTargetReturnFee('');
  };

  // Submits the quick status changes from the modal
  const handleUpdateStatus = async () => {
    if (!statusTarget) return;

    if (targetOrderStatus === 'Return' && (!targetReturnFee || targetReturnFee === '')) {
      toast.error('Return fee is required');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const payload = {
        status: targetOrderStatus.toLowerCase(),
      };

      if (targetOrderStatus === 'Return') {
        payload.returnFee = Number(targetReturnFee);
        payload.paymentStatus = 'returned';
      } else {
        if (targetPaymentStatus && targetPaymentStatus !== 'Not found' && targetPaymentStatus !== 'N/A') {
          payload.paymentStatus = targetPaymentStatus.toLowerCase();
        }
      }

      await apiClient.put(`/api/v1/orders/${statusTarget.id}`, payload);
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

  // Fixed-width badge helper classes with unified palette:
  // Green (#64a338): delivered/complete/paid (white text)
  // Yellow (#ffcc00): processing/pending/partial (dark text)
  // Red (#e03b24): cancelled/deleted/failed (white text)
  // Blue (#3865a3): shipped (white text)
  // Sky (#87a2c7): confirmed (dark text)
  const BADGE_FIXED_CLS = "w-24 justify-center text-center truncate border-transparent select-none";

  // Formats a taka amount without decimals for compact table cells
  const formatAmount = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Resolves the visual badge representation for payment status
  const getPaymentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#64a338] hover:bg-[#578e31] text-white`}>{t('orders.status_paid', 'Paid')}</Badge>;
      case 'pending':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#ffcc00] hover:bg-[#e6b800] text-slate-950 font-medium`}>{t('orders.status_pending', 'Pending')}</Badge>;
      case 'partial':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#f28c28] hover:bg-[#d97a1f] text-white font-medium`}>{t('orders.status_partial', 'Partial')}</Badge>;
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#e03b24] hover:bg-[#c9321d] text-white`}>{t('common.error', 'Failed')}</Badge>;
      default:
        return <Badge variant="outline" className={`${BADGE_FIXED_CLS}`}>{status}</Badge>;
    }
  };

  // Resolves the visual badge representation for fulfillment status
  const getFulfillmentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#64a338] hover:bg-[#578e31] text-white`}>{t('orders.status_delivered', 'Completed')}</Badge>;
      case 'shipped':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#3865a3] hover:bg-[#2f558a] text-white`}>{t('orders.status_shipped', 'Shipped')}</Badge>;
      case 'confirmed':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#87a2c7] hover:bg-[#7693b9] text-slate-950 font-medium`}>{t('orders.status_confirmed', 'Confirmed')}</Badge>;
      case 'processing':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#ffcc00] hover:bg-[#e6b800] text-slate-950 font-medium`}>{t('orders.status_processing', 'Processing')}</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#e03b24] hover:bg-[#c9321d] text-white`}>{t('orders.status_canceled', 'Cancelled')}</Badge>;
      case 'fake':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-semibold`}>Fake</Badge>;
      case 'return':
      case 'Return':
      case 'returned':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#e03b24] hover:bg-[#c9321d] text-white`}>{t('orders.status_returned', 'Returned')}</Badge>;
      case 'pending':
      case 'unfulfilled':
        return <Badge className={`${BADGE_FIXED_CLS} bg-[#ffcc00] hover:bg-[#e6b800] text-slate-950 font-medium`}>{t('orders.status_pending', 'Pending')}</Badge>;
      default:
        return <Badge variant="outline" className={`${BADGE_FIXED_CLS}`}>{status}</Badge>;
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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[44px] pl-4 pr-2">
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
            <TableHead className="w-[120px]">{t('orders.order_amount', 'Order Amount')}</TableHead>
            <TableHead className="w-[120px]">{t('orders.payment_status', 'Payment')}</TableHead>
            <TableHead className="w-[120px]">{t('common.status', 'Status')}</TableHead>
            <TableHead className="w-[60px] text-right">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[44px] pl-4 pr-2">
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
                        ? 'bg-primary/10 font-medium border-l-4 border-l-primary'
                        : ''
                    }`}
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <TableCell
                      className="w-[44px] pl-4 pr-2"
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
                      {order.courier?.consignmentId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-0.5 font-medium" title={`Pathao Consignment: ${order.courier.consignmentId}`}>
                          <Truck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          {order.courier.consignmentId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="truncate block" title={order.customerName}>{order.customerName}</span>
                    </TableCell>
                    <TableCell className="w-[110px] text-muted-foreground whitespace-nowrap">
                      {formatDate(order.date)}
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
                    <TableCell className="w-[120px]">
                      {getPaymentBadge(order.paymentStatus)}
                      {String(order.paymentStatus).toLowerCase() === 'partial' && Number(order.paidAmount || 0) > 0 && (
                        <span className="block text-[10px] leading-tight mt-1 whitespace-nowrap">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('orders.paid_short', 'Paid')} ৳{formatAmount(order.paidAmount)}</span>
                          <span className="text-muted-foreground"> · </span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{t('orders.due_short', 'Due')} ৳{formatAmount(order.paymentDetails?.pendingAmount ?? Math.max(0, Number(order.totalAmount || 0) - Number(order.paidAmount || 0)))}</span>
                        </span>
                      )}
                    </TableCell>
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
                          {!isReadOnly && (
                            <DropdownMenuItem onClick={() => handleEditOrderClick(order)}>
                              {t('common.edit', 'Edit Order')}
                            </DropdownMenuItem>
                          )}
                          {!isReadOnly && (
                            <DropdownMenuItem onClick={() => handleOpenStatusModal(order)}>
                              {t('orders.change_status', 'Change Status')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setSendInvoiceTarget(order)} className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{t('orders.send_invoice_email', 'Send Invoice')}</span>
                          </DropdownMenuItem>
                          {!isReadOnly && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => setDeleteTarget({ id: order.id, orderNumber: order.orderNumber })}
                              >
                                {t('common.delete', 'Delete Order')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="hover:bg-background! bg-background! hover:text-foreground! hover:[&_td]:text-foreground! border-b">
                      <TableCell colSpan={8} className="p-0">
                        <OrderAccordionDetail order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </div>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
                  <SelectItem value="Return">Return</SelectItem>
                  <SelectItem value="Fake" className="cursor-pointer text-destructive font-semibold">Fake</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetOrderStatus === 'Return' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Return Fee <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter return fee"
                  value={targetReturnFee}
                  onChange={(e) => setTargetReturnFee(e.target.value)}
                />
              </div>
            )}

            {targetOrderStatus !== 'Return' && (
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
                  </SelectContent>
                </Select>
              </div>
            )}
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

      <SendOrderInvoiceModal
        open={!!sendInvoiceTarget}
        onOpenChange={(open) => !open && setSendInvoiceTarget(null)}
        order={sendInvoiceTarget}
      />
    </>
  );
};
