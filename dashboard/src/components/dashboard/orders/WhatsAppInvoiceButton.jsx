import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { baseURL, getApiBaseUrl } from '@/lib/api-client';
import { shareInvoiceOnWhatsApp } from '@/utils/invoiceImage';

// Turns any order's invoice into an image and sends it to the customer's WhatsApp
export function WhatsAppInvoiceButton({ order, label = 'Send via WhatsApp', showLabelClass = '', iconClass = 'h-4 w-4', ...buttonProps }) {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    if (!order || sending) return;
    const apiBase = (baseURL || getApiBaseUrl() || 'https://admin.surokkha.store').replace(/\/$/, '');
    const orderIdentifier = order._id || order.id || order.did || order.orderNumber;
    const phone = order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone || order.phone || '';
    setSending(true);
    try {
      const result = await shareInvoiceOnWhatsApp({
        invoiceUrl: `${apiBase}/api/v1/orders/${orderIdentifier}/invoice`,
        phone,
        orderNumber: order.orderNumber,
        message: `Invoice for order #${order.orderNumber || ''}`,
      });
      if (result === 'downloaded') toast.success('Invoice image downloaded — attach it in the WhatsApp chat.');
    } catch (err) {
      toast.error(err?.message || 'Could not create invoice image.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Button type="button" variant="outline" disabled={sending} onClick={handleClick} title={label} {...buttonProps}>
      {sending ? <Loader2 className={`${iconClass} animate-spin`} /> : <MessageCircle className={`${iconClass} text-emerald-600`} />}
      <span className={showLabelClass}>{label}</span>
    </Button>
  );
}

export default WhatsAppInvoiceButton;
