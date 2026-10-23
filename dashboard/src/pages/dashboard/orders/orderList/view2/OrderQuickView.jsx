import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, ExternalLink, Loader2, Mail, MapPin, Package, Pencil, Phone, Printer, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/dateHelper';
import { getStatusOptionClass } from '@/utils/statusColors';
import {
  formatFullAddress,
  getBillingInfo,
  getPaymentMethodLabel,
  getShippingInfo,
  getWhatsAppLink,
  handleCopyText,
  WhatsAppIcon,
} from '@/utils/orderDetailsHelper';
import {
  LIGHT_BUTTON_CLASS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_UPDATE_OPTIONS,
  PRIMARY_BUTTON_CLASS,
} from '../constants';
import { StatusChip } from './StatusChip';

const taka = (value) => `৳${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Line({ label, value, className }) {
  return (
    <div className={cn('flex justify-between gap-3', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// Small round icon link/button next to the phone number
const contactBtn =
  'inline-flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors';

// Status select inside the quick view; trigger shows the colored chip
function StatusSelect({ kind, label, value, options, onChange, disabled }) {
  const { t } = useTranslation();
  const selected = options.find((opt) => String(opt.value).toLowerCase() === String(value || '').toLowerCase());
  const selectedLabel = selected ? (selected.labelKey ? t(selected.labelKey, selected.label) : selected.label) : value;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      <Select value={value} onValueChange={(v) => v && onChange(v)} disabled={disabled}>
        {/* Same dot + colored text as the options, instead of a bordered chip inside the bordered trigger */}
        <SelectTrigger className="h-9 w-full px-3 data-[size=default]:h-9" aria-label={label}>
          <span className={cn('flex min-w-0 items-center gap-2 text-sm font-medium', getStatusOptionClass(value))}>
            <span className="size-2 shrink-0 rounded-full bg-current" />
            <span className="truncate">{selectedLabel}</span>
          </span>
        </SelectTrigger>
        <SelectContent side="bottom">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className={cn('font-medium', getStatusOptionClass(opt.value))}>
              <span className={cn('size-1.5 shrink-0 rounded-full bg-current', getStatusOptionClass(opt.value))} />
              {opt.labelKey ? t(opt.labelKey, opt.label) : opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Right-side sheet with an order's summary and status controls
export function OrderQuickView({ list }) {
  const { t } = useTranslation();
  const { orderActions, isReadOnly } = list;
  const current = orderActions.quickViewOrder;
  // Keep showing the last order while the sheet animates closed
  const lastOrderRef = useRef(null);
  if (current) lastOrderRef.current = current;
  const order = current ?? lastOrderRef.current;

  const [orderStatus, setOrderStatus] = useState('Pending');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [returnFee, setReturnFee] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset the form whenever another order is opened or the order changes on the server
  useEffect(() => {
    if (!order) return;
    setOrderStatus(order.orderStatus || 'Pending');
    setPaymentStatus(order.paymentStatus || 'Pending');
    setReturnFee('');
    setOrderNotes(order.orderNotes || '');
  }, [order?.id, order?.orderStatus, order?.paymentStatus, order?.orderNotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = Boolean(current);

  const billing = order ? getBillingInfo(order) : {};
  const shipping = order ? getShippingInfo(order) : {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const totals = order?.totals || {};
  const subtotal = totals.subtotal ?? order?.subtotal ?? 0;
  const shippingFee = totals.shippingFee ?? order?.shippingFee ?? order?.shippingTotalAmount ?? 0;
  const discount = order?.discountTotalAmount ?? totals.discount ?? 0;
  const grandTotal = totals.total ?? order?.totalAmount ?? 0;
  const rawPaid = order?.paymentDetails?.paidAmount ?? order?.paidAmount;
  const paidAmount =
    rawPaid !== undefined && rawPaid !== null
      ? Number(rawPaid)
      : String(order?.paymentStatus).toLowerCase() === 'paid'
        ? grandTotal
        : 0;
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  const phone = shipping.phone || billing.phone || '';
  const email = billing.email || '';
  const address = formatFullAddress(shipping) || formatFullAddress(billing);
  const method = getPaymentMethodLabel(order?.paymentMethod);

  const isReturn = orderStatus === 'Return';
  const hasChanges =
    order &&
    (orderStatus !== (order.orderStatus || 'Pending') ||
      (!isReturn && paymentStatus !== (order.paymentStatus || 'Pending')) ||
      orderNotes.trim() !== (order.orderNotes || '').trim());

  const save = async () => {
    setIsSaving(true);
    await orderActions.updateStatus(order, { orderStatus, paymentStatus, returnFee, orderNotes });
    setIsSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && orderActions.closeQuickView()}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {order && (
          <>
            <SheetHeader className="border-b p-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg font-semibold">#{order.orderNumber}</SheetTitle>
                <StatusChip kind="order" status={order.orderStatus} />
              </div>
              <SheetDescription>
                {t('orders.placed_on', 'Placed on')} {formatDateTime(order.createdAt || order.date)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <Section title={t('orders.customer', 'Customer')}>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-medium text-foreground">{shipping.fullName || billing.fullName || order.customerName}</p>
                  <div className="mt-3 space-y-2.5">
                    {phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="size-4 shrink-0 text-muted-foreground" />
                        <a href={`tel:${phone}`} className="font-medium text-primary hover:underline">{phone}</a>
                        <span className="ml-auto flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyText(phone, 'Phone number')}
                            className={cn(contactBtn, 'border-border bg-muted text-muted-foreground hover:text-foreground')}
                            title="Copy phone number"
                          >
                            <Copy className="size-3" />
                          </button>
                          <a
                            href={getWhatsAppLink(phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(contactBtn, 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400')}
                            title="Message on WhatsApp"
                          >
                            <WhatsAppIcon className="size-3" />
                          </a>
                        </span>
                      </div>
                    )}
                    {email && (
                      <a href={`mailto:${email}`} className="flex items-center gap-2.5 hover:underline">
                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{email}</span>
                      </a>
                    )}
                    {address && (
                      <p className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span>{address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Section>

              <Section title={`${t('orders.items', 'Items')} (${items.reduce((n, i) => n + (Number(i.quantity) || 1), 0)})`}>
                <div className="divide-y rounded-lg border">
                  {items.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                      {t('common.no_data', 'No item breakdown recorded for this order.')}
                    </p>
                  ) : (
                    items.map((item, idx) => {
                      const price = item.unitPrice ?? item.price ?? 0;
                      const qty = Number(item.quantity) || 1;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Package className="size-4 text-muted-foreground" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.size ? `${item.size} · ` : ''}
                              {qty} × {taka(price)}
                            </p>
                          </div>
                          <p className="text-sm font-medium tabular-nums">{taka(price * qty)}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </Section>

              <Section title={t('orders.payment', 'Payment')}>
                <div className="space-y-2 rounded-lg border p-4 text-sm">
                  <Line label={t('common.subtotal', 'Subtotal')} value={taka(subtotal)} />
                  <Line label={t('orders.delivery_charge', 'Shipping')} value={Number(shippingFee) === 0 ? t('orders.free', 'Free') : taka(shippingFee)} />
                  {Number(discount) > 0 && (
                    <Line label={t('common.discount', 'Discount')} value={`− ${taka(discount)}`} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                  {order.couponCode && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Tag className="size-3" /> {order.couponCode}
                    </div>
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold">
                    <span>{t('common.total', 'Total')}</span>
                    <span className="tabular-nums">{taka(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('orders.paid_short', 'Paid')}: {taka(paidAmount)}</span>
                    <span className={dueAmount > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'font-semibold text-emerald-600 dark:text-emerald-400'}>
                      {t('orders.due_short', 'Due')}: {taka(dueAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">{method ? `via ${method}` : ''}</span>
                    <StatusChip kind="payment" status={order.paymentStatus} />
                  </div>
                </div>
              </Section>

              {isReadOnly && order.orderNotes && (
                <Section title={t('orders.order_notes', 'Order Notes')}>
                  <p className="whitespace-pre-wrap text-sm text-amber-600 dark:text-amber-400">{order.orderNotes}</p>
                </Section>
              )}

              {!isReadOnly && (
                <Section title={t('orders.update_status', 'Update status')}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatusSelect
                      kind="order"
                      label={t('orders.order_status', 'Order Status')}
                      value={orderStatus}
                      options={ORDER_STATUS_OPTIONS}
                      onChange={setOrderStatus}
                      disabled={isSaving}
                    />
                    {isReturn ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">
                          Return Fee <span className="text-destructive">*</span>
                        </p>
                        <Input
                          type="number"
                          value={returnFee}
                          onChange={(e) => setReturnFee(e.target.value)}
                          placeholder="Enter return fee"
                          className="h-9"
                        />
                      </div>
                    ) : (
                      <StatusSelect
                        kind="payment"
                        label={t('orders.payment_status', 'Payment Status')}
                        value={paymentStatus}
                        options={PAYMENT_UPDATE_OPTIONS}
                        onChange={setPaymentStatus}
                        disabled={isSaving}
                      />
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <label htmlFor="quick-order-notes" className="text-xs font-medium">
                      {t('orders.order_notes', 'Order Notes')}
                    </label>
                    <textarea
                      id="quick-order-notes"
                      rows={2}
                      maxLength={1000}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      disabled={isSaving}
                      placeholder="e.g. Call before delivery"
                      className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <Button
                    onClick={save}
                    disabled={isSaving || !hasChanges}
                    className={cn('mt-3 h-9 w-full gap-2 text-sm', PRIMARY_BUTTON_CLASS)}
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {isSaving ? t('common.saving', 'Saving...') : t('common.save_changes', 'Save Changes')}
                  </Button>
                </Section>
              )}

              <button
                type="button"
                onClick={() => orderActions.viewDetails(order)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {t('common.details', 'View full details')} <ExternalLink className="size-3.5" />
              </button>
            </div>

            <div className="flex gap-2 border-t p-4">
              <Button
                variant="outline"
                onClick={() => orderActions.openInvoice(order)}
                className={cn('h-9 flex-1 gap-2 text-sm', LIGHT_BUTTON_CLASS)}
              >
                <Printer className="size-4" /> {t('orders.print_invoice', 'Print Invoice')}
              </Button>
              {!isReadOnly && (
                <Button onClick={() => orderActions.edit(order)} className={cn('h-9 flex-1 gap-2 text-sm', PRIMARY_BUTTON_CLASS)}>
                  <Pencil className="size-4" /> {t('common.edit', 'Edit order')}
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default OrderQuickView;
