import { toast } from 'sonner';
import { taka } from '@/hooks/use-purchases';
import { apiClient } from '@/lib/api-client';
import { clientConfig } from '@/clientConfig';
import { toWhatsAppNumber } from '@/utils/invoiceImage';

const STATUS = { draft: 'Draft', ordered: 'Ordered', received: 'Received', cancelled: 'Cancelled' };
const PAYMENT = { pending: 'Unpaid', partial: 'Partly paid', paid: 'Paid' };
const day = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const brand = () => clientConfig?.brandName || 'Store';

// Quantity as bought: "5 Packet (50 pcs)" or "12 pcs"
const qtyText = (l) => (l.unitsPerPack > 1 ? `${l.packs} ${l.packLabel || 'pack'} (${l.units} ${l.unit || 'pcs'})` : `${l.units} ${l.unit || 'pcs'}`);

// Plain-text purchase for WhatsApp: every item, totals, each payment, then paid and due
export const purchaseWhatsAppText = (p) => {
  const due = Math.max(0, p.total - p.paidAmount);
  const lines = [
    `*${brand()} - Purchase ${p.purchaseNumber}*`,
    `Vendor: ${p.vendorName}`,
    `Order date: ${day(p.orderDate)}${p.receivedAt ? ` | Received: ${day(p.receivedAt)}` : ''}`,
    `Status: ${STATUS[p.status] || p.status}`,
    '',
    '*Items*',
    ...p.lines.map((l, i) => `${i + 1}. ${l.shortName}${l.name ? ` (${l.name})` : ''} - ${qtyText(l)} x ${taka(l.packPrice)} = ${taka(l.total)}`),
    '',
    `Items total: ${taka(p.subtotal)}`,
    ...(p.shipping > 0 ? [`Shipping / carrying: ${taka(p.shipping)}`] : []),
    ...(p.discount > 0 ? [`Discount: -${taka(p.discount)}`] : []),
    `*Total: ${taka(p.total)}*`,
  ];
  if (p.payments.length) {
    lines.push('', '*Payments*', ...p.payments.map((x) => `${day(x.paidAt)} - ${x.method}${x.reference ? ` (${x.reference})` : ''}: ${taka(x.amount)}`));
  }
  lines.push(
    '',
    `Paid: ${taka(p.paidAmount)}`,
    `*Due (pending): ${taka(due)}*`,
    `Payment status: ${PAYMENT[p.paymentStatus] || p.paymentStatus}`,
  );
  if (p.notes) lines.push('', `Note: ${p.notes}`);
  return lines.join('\n');
};

// Opens WhatsApp to the vendor's number (or the contact picker when there is none) with the purchase text
export const sendPurchaseOnWhatsApp = (p) => {
  const number = toWhatsAppNumber(p.vendorPhone);
  const url = `https://wa.me/${number}?text=${encodeURIComponent(purchaseWhatsAppText(p))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Opens the A4 purchase receipt (same design as the order invoice) in a new tab, ready to print or save as PDF
export const openPurchaseReceipt = async (id) => {
  // Opened before the request so the browser does not block it as a pop-up
  const win = window.open('', '_blank');
  if (!win) {
    toast.error('Allow pop-ups for this site to print the receipt');
    return;
  }
  win.document.write('<p style="font-family:sans-serif;padding:40px;color:#7a6670">Loading receipt…</p>');
  try {
    const { data } = await apiClient.get(`/api/v1/purchases/${id}/receipt`, { responseType: 'text' });
    win.document.open();
    win.document.write(data);
    win.document.close();
  } catch (e) {
    win.close();
    toast.error(e?.response?.data?.message || 'Could not open the receipt');
  }
};
