import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  User,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Edit3,
  Layers,
  PhoneCall,
  Copy,
} from 'lucide-react';
import { apiClient, baseURL } from '@/lib/api-client';
import clientConfig from '@/clientConfig';
import { SendOrderInvoiceModal } from '@/components/dashboard/orders/SendOrderInvoiceModal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatBDT } from '@/utils/orderHelper';
import {
  checkIsInStoreOrder,
  getBillingInfo,
  getShippingInfo,
  formatFullAddress,
  getWhatsAppLink,
  WhatsAppIcon,
  handleCopyText,
} from '@/utils/orderDetailsHelper';
import PathaoCourierCard from '@/components/dashboard/orders/PathaoCourierCard';
import { formatDateTime } from '@/utils/dateHelper';

// Renders an expanded accordion panel containing full order details and inline status management
export const OrderAccordionDetail = ({ order }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState(order.orderStatus || 'Processing');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'Pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);

  useEffect(() => {
    setOrderStatus(order.orderStatus || 'Processing');
    setPaymentStatus(order.paymentStatus || 'Pending');
  }, [order.orderStatus, order.paymentStatus]);

  const isInStore = checkIsInStoreOrder(order);
  const billing = getBillingInfo(order);
  const shipping = getShippingInfo(order);

  const items = Array.isArray(order.items) ? order.items : [];
  const totals = order.totals || {};
  const subtotal = totals.subtotal ?? order.subtotal ?? 0;
  const shippingFee = totals.shippingFee ?? order.shippingFee ?? order.shippingTotalAmount ?? 0;
  const discount = order.discountTotalAmount ?? totals.discount ?? 0;
  const grandTotal = totals.total ?? order.totalAmount ?? 0;

  const rawPaid = order.paymentDetails?.paidAmount ?? order.paidAmount;
  const paidAmount = rawPaid !== undefined && rawPaid !== null
    ? Number(rawPaid)
    : (String(order.paymentStatus).toLowerCase() === 'paid' ? grandTotal : 0);
  const pendingAmount = Math.max(0, grandTotal - paidAmount);

  const phoneNum = billing.phone || order.phone || '';
  const cleanPhone = phoneNum.replace(/^(\+?880?|0)/, '');
  const emailAddr = billing.email || order.email || '';

  const billingAddressText = formatFullAddress(billing);
  const shippingAddressText = formatFullAddress(shipping);

  const hasStatusChanged =
    orderStatus.toLowerCase() !== (order.orderStatus || 'Processing').toLowerCase() ||
    paymentStatus.toLowerCase() !== (order.paymentStatus || 'Pending').toLowerCase();

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const payload = {
        status: orderStatus.toLowerCase(),
      };
      if (orderStatus.toLowerCase() === 'return') {
        payload.paymentStatus = 'returned';
      } else {
        payload.paymentStatus = paymentStatus.toLowerCase();
      }

      await apiClient.put(`/api/v1/orders/${order.id}`, payload);

      logActivity({
        type: 'updated',
        description: `Order #${order.orderNumber} status changed to "${orderStatus}" and payment to "${paymentStatus}" by "${user?.name || 'Admin'}"`,
      });

      toast.success(t('orders.order_updated_success', `Order #${order.orderNumber} updated successfully.`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Opens the printable invoice endpoint in a new browser tab
  const handleOpenInvoice = () => {
    const apiBase = (baseURL || getApiBaseUrl() || 'https://admin.surokkha.store').replace(/\/$/, '');
    const orderIdentifier = order._id || order.id || order.did || order.orderNumber;
    window.open(`${apiBase}/api/v1/orders/${orderIdentifier}/invoice`, '_blank', 'noopener,noreferrer');
  };

  // Navigates to the full standalone order details page
  const handleViewFullPage = () => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  // Navigates to the order edit mode
  const handleEditOrder = () => {
    navigate(`/dashboard/orders/${order.id}?edit=true`);
  };

  const locale = i18n.language?.startsWith('bn') ? 'bn-BD' : undefined;

  return (
    <div className="p-4 md:p-6 bg-muted/20 border-t border-b border-border/80 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to={`/dashboard/orders/${order.id}`}
            className="text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors"
          >
            {t('orders.order_id', 'Order')} #{order.orderNumber}
          </Link>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(order.createdAt || order.date)}
          </span>
          {order.couponCode && (
            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono font-bold text-[11px] py-0.5 px-2">
              <Tag className="h-3 w-3 text-emerald-500" />
              {t('categories_brands.coupon_code', 'Coupon')}: {order.couponCode}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PathaoCourierCard
            order={order}
            triggerOnly
            triggerButtonVariant="outline"
            triggerButtonClassName="h-8 text-xs bg-background"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer bg-background"
            onClick={handleOpenInvoice}
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            {t('orders.print_invoice', 'Print Invoice')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer bg-background"
            onClick={() => setSendEmailModalOpen(true)}
          >
            {/* <Mail className="h-3.5 w-3.5 text-muted-foreground" /> */}
            {t('orders.send_invoice_email', 'Email invoice')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer bg-background"
            onClick={handleEditOrder}
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            {t('common.edit', 'Edit Order')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer"
            onClick={handleViewFullPage}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('common.details', 'Full Details')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                {t('orders.items', 'Ordered Items')} ({items.length})
              </h4>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-muted/60 border border-border/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[170px]" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.size && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                              <Layers className="h-2.5 w-2.5 mr-0.5" />
                              {item.size}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatBDT(item.unitPrice ?? item.price ?? 0)} × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-bold text-foreground shrink-0 pt-0.5">
                      {formatBDT((item.unitPrice ?? item.price ?? 0) * (item.quantity || 1))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {t('common.no_data', 'No item breakdown recorded for this order.')}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">{t('common.quantity', 'Total Quantity')}</span>
            <span className="font-bold text-foreground">
              {items.reduce((acc, curr) => acc + (curr.quantity || 1), 0)} {t('orders.items', 'items')}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                {isInStore ? t('orders.customer_info', 'Customer Info') : t('orders.shipping_address', 'Billing & Shipping')}
              </h4>
              {isInStore && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {t('orders.in_store', 'In-Store')}
                </Badge>
              )}
            </div>

            {isInStore ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{t('orders.customer_name', 'Customer Name')}</span>
                    <span className="font-semibold text-foreground">{billing.fullName || t('orders.customer', 'Walk-in Customer')}</span>
                  </div>
                </div>

                {phoneNum && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">{t('common.phone', 'Phone')}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:+880${cleanPhone}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          +880{cleanPhone}
                        </a>
                        <a
                          href={`tel:+880${cleanPhone}`}
                          className="inline-flex items-center justify-center h-5 w-5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0"
                          title="Call Phone"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PhoneCall className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                          title="Copy Phone Number"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(phoneNum, 'Phone number');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <a
                          href={getWhatsAppLink(phoneNum)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-5 w-5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                          title="Message on WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {emailAddr && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">{t('common.email', 'Email')}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`mailto:${emailAddr}`}
                          className="font-medium text-foreground hover:underline truncate block max-w-[170px]"
                        >
                          {emailAddr}
                        </a>
                        <a
                          href={`mailto:${emailAddr}`}
                          className="inline-flex items-center justify-center h-5 w-5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all hover:scale-105 shrink-0"
                          title="Send Email"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                          title="Copy Email"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(emailAddr, 'Email');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{t('common.status', 'Order Channel')}</span>
                    <span className="text-foreground font-medium">{t('orders.pos_title', 'In-Store / POS Sale')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs max-h-[220px] overflow-y-auto pr-1">
                {/* Billing Details */}
                <div className="space-y-1.5 border-b border-border/40 pb-2.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3 w-3 text-primary" /> {t('orders.customer_info', 'Billing Address')}
                  </span>
                  <div className="pl-4 space-y-1">
                    <p className="font-semibold text-foreground">{billing.fullName || 'N/A'}</p>
                    {phoneNum && (
                      <div className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{t('common.phone', 'Phone')}:</span>
                        <a href={`tel:+880${cleanPhone}`} className="text-primary hover:underline font-medium">+880{cleanPhone}</a>
                        <a
                          href={`tel:+880${cleanPhone}`}
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0 ml-0.5"
                          title="Call Phone"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PhoneCall className="h-2.5 w-2.5" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                          title="Copy Phone Number"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(phoneNum, 'Phone number');
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                        <a
                          href={getWhatsAppLink(phoneNum)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                          title="Message on WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    {emailAddr && (
                      <div className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{t('common.email', 'Email')}:</span>
                        <a href={`mailto:${emailAddr}`} className="text-foreground hover:underline font-medium truncate max-w-[150px]">{emailAddr}</a>
                        <a
                          href={`mailto:${emailAddr}`}
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all hover:scale-105 shrink-0 ml-0.5"
                          title="Send Email"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-2.5 w-2.5" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                          title="Copy Email"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(emailAddr, 'Email');
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-muted-foreground leading-tight">
                      {t('common.address', 'Address')}: <span className="text-foreground">{billingAddressText || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Truck className="h-3 w-3 text-primary" /> {t('orders.shipping_address', 'Shipping Address')}
                  </span>
                  <div className="pl-4 space-y-1">
                    <p className="font-semibold text-foreground">{shipping.fullName || billing.fullName || 'N/A'}</p>
                    {(shipping.phone || phoneNum) && (
                      <div className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{t('common.phone', 'Phone')}:</span>
                        <a href={`tel:${shipping.phone || phoneNum}`} className="text-primary hover:underline font-medium">{shipping.phone || phoneNum}</a>
                        <a
                          href={`tel:${shipping.phone || phoneNum}`}
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0 ml-0.5"
                          title="Call Phone"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PhoneCall className="h-2.5 w-2.5" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                          title="Copy Phone Number"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(shipping.phone || phoneNum, 'Phone number');
                          }}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                        <a
                          href={getWhatsAppLink(shipping.phone || phoneNum)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                          title="Message on WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                    <p className="text-muted-foreground leading-tight">
                      {t('common.address', 'Destination')}: <span className="text-foreground">{shippingAddressText || billingAddressText || 'N/A'}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {t('orders.delivery_charge', 'Delivery')}: <span className="text-foreground">{shippingFee === 0 ? t('settings.free_delivery_min', 'Free Delivery') : t('orders.delivery_charge', 'Standard Delivery')}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> {t('orders.payment_method', 'Payment Method')}:
            </span>
            <span className="font-bold text-foreground capitalize">
              {order.paymentMethod || t('orders.cash_on_delivery', 'Cash on Delivery')}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/70 p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('orders.payment_status', 'Status & Billing')}
              </h4>
            </div>

            <div className="space-y-1.5 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('common.subtotal', 'Subtotal')}:</span>
                <span className="font-medium text-foreground">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('orders.delivery_charge', 'Shipping')}:</span>
                <span className="font-medium text-foreground">{formatBDT(shippingFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{t('common.discount', 'Discount')}:</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/40">
                <span>{t('common.total', 'Total Amount')}:</span>
                <span className="text-primary font-bold">{formatBDT(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-muted-foreground">{t('orders.advance_paid', 'Paid')}: {formatBDT(paidAmount)}</span>
                <span className={`font-semibold ${pendingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {t('orders.due_amount', 'Pending')}: {formatBDT(pendingAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    {t('orders.order_status', 'Order Status')}
                  </label>
                  <Select value={orderStatus} onValueChange={(val) => val && setOrderStatus(val)}>
                    <SelectTrigger className="h-8 text-xs cursor-pointer w-full bg-background">
                      <SelectValue placeholder={t('orders.order_status', 'Order Status')} />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="bg-popover border shadow-md">
                      <SelectItem value="Processing" className="cursor-pointer text-xs">{t('orders.status_processing', 'Processing')}</SelectItem>
                      <SelectItem value="Shipped" className="cursor-pointer text-xs">{t('orders.status_shipped', 'Shipped')}</SelectItem>
                      <SelectItem value="Completed" className="cursor-pointer text-xs">{t('orders.status_delivered', 'Completed')}</SelectItem>
                      <SelectItem value="Cancelled" className="cursor-pointer text-xs text-destructive">{t('orders.status_canceled', 'Cancelled')}</SelectItem>
                      <SelectItem value="Return" className="cursor-pointer text-xs">Return</SelectItem>
                      <SelectItem value="Fake" className="cursor-pointer text-xs text-destructive font-semibold">Fake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderStatus !== 'Return' && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      {t('orders.payment_status', 'Payment Status')}
                    </label>
                    <Select value={paymentStatus} onValueChange={(val) => val && setPaymentStatus(val)}>
                      <SelectTrigger className="h-8 text-xs cursor-pointer w-full bg-background">
                        <SelectValue placeholder={t('orders.payment_status', 'Payment Status')} />
                      </SelectTrigger>
                      <SelectContent side="bottom" className="bg-popover border shadow-md">
                        <SelectItem value="Paid" className="cursor-pointer text-xs">{t('orders.status_paid', 'Paid')}</SelectItem>
                        <SelectItem value="Pending" className="cursor-pointer text-xs">{t('orders.status_pending', 'Pending')}</SelectItem>
                        <SelectItem value="Failed" className="cursor-pointer text-xs text-destructive">{t('common.error', 'Failed')}</SelectItem>
                        <SelectItem value="Partial" className="cursor-pointer text-xs">{t('orders.status_partial', 'Partial')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <Button
              className={`w-full h-8 text-xs font-semibold cursor-pointer transition-all shadow-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 ${hasStatusChanged ? 'ring-2 ring-primary/40' : ''
                }`}
              onClick={handleUpdateStatus}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  {t('common.updating', 'Updating Status...')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {hasStatusChanged ? t('common.save_changes', 'Save New Status') : t('orders.change_status', 'Update Status')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <SendOrderInvoiceModal
        open={sendEmailModalOpen}
        onOpenChange={setSendEmailModalOpen}
        order={order}
      />
    </div>
  );
};
