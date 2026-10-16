import { Fragment, useState, useEffect } from 'react';
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
import { MoreHorizontal, AlertCircle, Tag, Truck, Mail, Eye, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';
import styles from '@/styles/styles.json';
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
import { getStatusOptionClass } from '@/utils/statusColors';

// Renders the orders table with expandable accordion rows, filtering, batch selection, and inline actions
const PAGE_SIZE = 15;

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
    limit: PAGE_SIZE,
    orderType,
  });

  const orders = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;
  const totalOrders = responseData?.meta?.total ?? 0;

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

  // Status pill tones come from styles/styles.json
  const BADGE_TONES = styles.badge.status.tones;

  const renderStatusBadge = (tone, label) => (
    <Badge className={`${styles.badge.status.base} ${BADGE_TONES[tone]}`}>
      {label}
    </Badge>
  );

  // Resolves the visual badge representation for payment status
  const getPaymentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
        return renderStatusBadge('delivered', t('orders.status_paid', 'Paid'));
      case 'pending':
        return renderStatusBadge('pending', t('orders.status_pending', 'Pending'));
      case 'partial':
        return renderStatusBadge('processing', t('orders.status_partial', 'Partial'));
      case 'returned':
        return renderStatusBadge('cancelled', t('orders.status_returned', 'Returned'));
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return renderStatusBadge('cancelled', t('common.error', 'Failed'));
      default:
        return renderStatusBadge('pending', status || '—');
    }
  };

  // Resolves the visual badge representation for fulfillment status
  const getFulfillmentBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'delivered':
      case 'completed':
        return renderStatusBadge('delivered', t('orders.status_delivered', 'Completed'));
      case 'shipped':
        return renderStatusBadge('shipped', t('orders.status_shipped', 'Shipped'));
      case 'confirmed':
        return renderStatusBadge('processing', t('orders.status_confirmed', 'Confirmed'));
      case 'processing':
        return renderStatusBadge('processing', t('orders.status_processing', 'Processing'));
      case 'cancelled':
      case 'canceled':
        return renderStatusBadge('cancelled', t('orders.status_canceled', 'Cancelled'));
      case 'fake':
        return renderStatusBadge('fake', 'Fake');
      case 'return':
      case 'returned':
        return renderStatusBadge('cancelled', t('orders.status_returned', 'Returned'));
      case 'hold':
        return renderStatusBadge('hold', t('orders.status_hold', 'Hold'));
      case 'pending':
      case 'unfulfilled':
        return renderStatusBadge('pending', t('orders.status_pending', 'Pending'));
      default:
        return renderStatusBadge('pending', status || '—');
    }
  };

  const formatTime = (value) => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getCustomerPhone = (order) =>
    order.billingInfo?.phone || order.shippingInfo?.phone || order.customer?.phone || '';

  const getItemCount = (order) =>
    Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : 0;

  const CHECKBOX_CLS = 'h-4 w-4 cursor-pointer rounded accent-primary [color-scheme:light]';

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
      <Table className="[&_th]:h-9 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-1.5 [&_td]:text-[13px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[44px] pl-4 pr-2">
              <input
                type="checkbox"
                aria-label="Select all orders on this page"
                className={CHECKBOX_CLS}
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
            <TableHead className="w-[40px] px-1 text-center">#</TableHead>
            <TableHead className="w-[150px]">{t('orders.order_id', 'Order ID')}</TableHead>
            <TableHead className="w-[200px]">{t('orders.customer_name', 'Customer')}</TableHead>
            <TableHead className="w-[120px]">{t('common.date', 'Date')}</TableHead>
            <TableHead className="w-[130px] text-right pr-6">{t('orders.order_amount', 'Amount')}</TableHead>
            <TableHead className="w-[120px]">{t('orders.payment_status', 'Payment')}</TableHead>
            <TableHead className="w-[130px]">{t('common.status', 'Status')}</TableHead>
            <TableHead className="w-[60px] text-right pr-3">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[44px] pl-4 pr-2">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell className="px-1"><Skeleton className="h-4 w-5 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="pr-6"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : orders && orders.length > 0 ? (
            orders.map((order, index) => {
              const isExpanded = expandedOrderIds.includes(order.id);
              const isSelected = selectedIds.includes(order.id);
              const phone = getCustomerPhone(order);
              const itemCount = getItemCount(order);
              return (
                <Fragment key={order.id}>
                  <TableRow
                    className={`cursor-pointer transition-colors shadow-[inset_3px_0_0_transparent] ${
                      isExpanded
                        ? 'bg-primary/10! shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15!'
                        : isSelected
                          ? 'bg-primary/5! hover:bg-primary/10!'
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
                        aria-label={`Select order ${order.orderNumber}`}
                        className={CHECKBOX_CLS}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectedIdsChange([...selectedIds, order.id]);
                          } else {
                            onSelectedIdsChange(selectedIds.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="w-[40px] px-1 text-center tabular-nums text-xs text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell
                      className="max-w-[160px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        className="font-mono text-[13px] font-semibold truncate block text-primary hover:underline underline-offset-2"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </Link>
                      {order.courier?.consignmentId ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#082F49] px-1.5 py-px text-[10px] font-semibold text-[#38BDF8] ring-1 ring-inset ring-[#0369A1]" title={`Pathao consignment: ${order.courier.consignmentId}`}>
                          <Truck className="h-2.5 w-2.5" />
                          Pathao
                        </span>
                      ) : itemCount > 0 && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block font-medium text-foreground" title={order.customerName}>{order.customerName}</span>
                      {phone && (
                        <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{phone}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="block text-foreground">{formatDate(order.date)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{formatTime(order.date)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right pr-6">
                      <span className="font-semibold tabular-nums text-foreground">
                        ৳{Number(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {order.couponCode && (
                        <span className="mt-1 ml-auto flex w-fit items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <Tag className="h-2.5 w-2.5" />
                          {order.couponCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                    <TableCell>{getFulfillmentBadge(order.orderStatus)}</TableCell>
                    <TableCell
                      className="text-right pr-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:bg-gray-200 hover:text-foreground">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(order)} className="cursor-pointer whitespace-nowrap">
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                            {t('common.details', 'View Details')}
                          </DropdownMenuItem>
                          {!isReadOnly && (
                            <DropdownMenuItem onClick={() => handleEditOrderClick(order)} className="cursor-pointer whitespace-nowrap">
                              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                              {t('common.edit', 'Edit Order')}
                            </DropdownMenuItem>
                          )}
                          {!isReadOnly && (
                            <DropdownMenuItem onClick={() => handleOpenStatusModal(order)} className="cursor-pointer whitespace-nowrap">
                              <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                              {t('orders.change_status', 'Change Status')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setSendInvoiceTarget(order)} className="cursor-pointer whitespace-nowrap">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Email Invoice</span>
                          </DropdownMenuItem>
                          {!isReadOnly && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer whitespace-nowrap"
                                onClick={() => setDeleteTarget({ id: order.id, orderNumber: order.orderNumber })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common.delete', 'Delete Order')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="hover:bg-background! bg-background! hover:text-foreground! hover:[&_td]:text-foreground! shadow-[inset_3px_0_0_var(--primary)]">
                      <TableCell colSpan={9} className="p-0! whitespace-normal">
                        <OrderAccordionDetail order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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
      {!isLoading && totalOrders > 0 && (
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + orders.length}</span> of{' '}
          <span className="font-semibold text-foreground">{totalOrders}</span> orders
        </div>
      )}

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
                  <SelectItem value="Pending" className={` ${getStatusOptionClass('Pending')}`.trim()}>{t('orders.status_pending', 'Pending')}</SelectItem>
                  <SelectItem value="Processing" className={` ${getStatusOptionClass('Processing')}`.trim()}>{t('orders.status_processing', 'Processing')}</SelectItem>
                  <SelectItem value="Hold" className={` ${getStatusOptionClass('Hold')}`.trim()}>{t('orders.status_hold', 'Hold')}</SelectItem>
                  <SelectItem value="Shipped" className={` ${getStatusOptionClass('Shipped')}`.trim()}>{t('orders.status_shipped', 'Shipped')}</SelectItem>
                  <SelectItem value="Completed" className={` ${getStatusOptionClass('Completed')}`.trim()}>{t('orders.status_delivered', 'Completed')}</SelectItem>
                  <SelectItem value="Cancelled" className={` ${getStatusOptionClass('Cancelled')}`.trim()}>{t('orders.status_canceled', 'Cancelled')}</SelectItem>
                  <SelectItem value="Return" className={` ${getStatusOptionClass('Return')}`.trim()}>Return</SelectItem>
                  <SelectItem value="Fake" className={`cursor-pointer ${getStatusOptionClass('Fake')}`.trim()}>Fake</SelectItem>
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
                    <SelectItem value="Pending" className={` ${getStatusOptionClass('Pending')}`.trim()}>{t('orders.status_pending', 'Pending')}</SelectItem>
                    <SelectItem value="Paid" className={` ${getStatusOptionClass('Paid')}`.trim()}>{t('orders.status_paid', 'Paid')}</SelectItem>
                    <SelectItem value="Partial" className={` ${getStatusOptionClass('Partial')}`.trim()}>{t('orders.status_partial', 'Partial')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="cancel" onClick={() => setStatusTarget(null)} disabled={isUpdatingStatus}>
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
