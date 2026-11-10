import { taka } from '@/hooks/use-purchases';
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

// A4 purchase receipt, hidden on screen and cloned into the print frame by printDocument
export const PurchasePrintSlip = ({ p, slipRef }) => {
  const due = Math.max(0, p.total - p.paidAmount);
  const cell = 'border-b border-gray-200 px-2 py-1.5';
  const contact = [clientConfig?.phone || clientConfig?.supportPhone, clientConfig?.supportEmail].filter(Boolean).join(' · ');
  return (
    <div ref={slipRef} id="printable-purchase-canvas" className="hidden bg-white text-[12px] text-gray-900">
      <div>
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3">
          <div>
            <p className="text-xl font-bold">{brand()}</p>
            {contact && <p className="text-gray-600">{contact}</p>}
            {clientConfig?.domain && <p className="text-gray-600">{clientConfig.domain}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase tracking-wide">Purchase Receipt</p>
            <p className="font-semibold">{p.purchaseNumber}</p>
            <p className="text-gray-600">{STATUS[p.status]} · {PAYMENT[p.paymentStatus]}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-gray-500">Vendor</p>
            <p className="font-semibold">{p.vendorName}</p>
            {p.vendorPhone && <p>{p.vendorPhone}</p>}
            {p.vendorEmail && <p>{p.vendorEmail}</p>}
          </div>
          <div className="text-right">
            <p><span className="text-gray-500">Order date:</span> {day(p.orderDate)}</p>
            <p><span className="text-gray-500">Received:</span> {day(p.receivedAt)}</p>
            {p.bill?.did && <p><span className="text-gray-500">Bill:</span> {p.bill.did}</p>}
          </div>
        </div>

        <table className="mt-5 w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-600">
              <th className={cell}>#</th>
              <th className={cell}>Item</th>
              <th className={`${cell} text-right`}>Qty</th>
              <th className={`${cell} text-right`}>Price each</th>
              <th className={`${cell} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l, i) => (
              <tr key={i}>
                <td className={cell}>{i + 1}</td>
                <td className={cell}>
                  <span className="font-semibold">{l.shortName}</span>
                  {l.name && <span className="text-gray-600"> · {l.name}</span>}
                </td>
                <td className={`${cell} text-right`}>{qtyText(l)}</td>
                <td className={`${cell} text-right`}>{taka(l.packPrice)}</td>
                <td className={`${cell} text-right font-semibold`}>{taka(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-3 w-64 space-y-1">
          <div className="flex justify-between"><span className="text-gray-600">Items</span><span>{taka(p.subtotal)}</span></div>
          {p.shipping > 0 && <div className="flex justify-between"><span className="text-gray-600">Shipping / carrying</span><span>{taka(p.shipping)}</span></div>}
          {p.discount > 0 && <div className="flex justify-between"><span className="text-gray-600">Discount</span><span>-{taka(p.discount)}</span></div>}
          <div className="flex justify-between border-t border-gray-800 pt-1 text-[13px] font-bold"><span>Total</span><span>{taka(p.total)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Paid</span><span>{taka(p.paidAmount)}</span></div>
          <div className="flex justify-between font-semibold"><span>Due</span><span>{taka(due)}</span></div>
        </div>

        {p.payments.length > 0 && (
          <div className="mt-5">
            <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Payments</p>
            <table className="w-full border-collapse">
              <tbody>
                {p.payments.map((x) => (
                  <tr key={x._id}>
                    <td className={cell}>{day(x.paidAt)}</td>
                    <td className={cell}>{x.method}{x.reference ? ` (${x.reference})` : ''}</td>
                    <td className={`${cell} text-right`}>{taka(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {p.notes && (
          <div className="mt-5">
            <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Notes</p>
            <p className="whitespace-pre-line">{p.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-16 text-center text-gray-600">
        <div className="border-t border-gray-400 pt-1">Received by</div>
        <div className="border-t border-gray-400 pt-1">Vendor signature</div>
      </div>
    </div>
  );
};
