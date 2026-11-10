import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, MessageCircle, PackageCheck, Pencil, Printer, Trash2, Wallet } from 'lucide-react';
import { printDocument } from '@/lib/print-engine/printEngine';
import { PurchasePrintSlip, sendPurchaseOnWhatsApp } from './purchaseShare';

import { usePurchase, usePurchaseMutations, lineText, taka } from '@/hooks/use-purchases';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const STATUS_LABEL = { draft: 'Draft', ordered: 'Ordered', received: 'Received', cancelled: 'Cancelled' };
const STATUS_STYLE = {
  draft: 'border-slate-400 text-slate-600 dark:text-slate-300',
  ordered: 'border-sky-500 text-sky-600',
  received: 'border-emerald-500 text-emerald-600',
  cancelled: 'border-red-500 text-red-600',
};
const PAY_STYLE = { pending: 'text-red-600', partial: 'text-amber-600', paid: 'text-emerald-600' };
const PAY_LABEL = { pending: 'Unpaid', partial: 'Partly paid', paid: 'Paid' };

export const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '-');
export const today = () => new Date().toISOString().slice(0, 10);

export const PurchaseStatusBadge = ({ status }) => (
  <Badge variant="outline" className={STATUS_STYLE[status] || ''}>{STATUS_LABEL[status] || status}</Badge>
);

export const PaymentStatusText = ({ status, className = '' }) => (
  <span className={`text-xs font-medium ${PAY_STYLE[status] || ''} ${className}`}>{PAY_LABEL[status] || status}</span>
);

// One label / value row inside the detail dialog
const Line = ({ label, value, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 py-1 text-sm ${className}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-lg border p-3">
    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    {children}
  </div>
);

// Method / amount / reference / date fields for one payment to the vendor
export const PaymentFields = ({ value, onChange, methods }) => (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
    <div className="space-y-1">
      <Label className="text-xs">Method</Label>
      <Select value={value.paymentTypeId} onValueChange={(v) => onChange({ ...value, paymentTypeId: v })} items={methods.map((m) => ({ value: m.id, label: m.name }))}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Choose method" /></SelectTrigger>
        <SelectContent>{methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Amount</Label>
      <Input type="number" min={0} step="any" value={value.amount} onChange={(e) => onChange({ ...value, amount: e.target.value })} placeholder="0" />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">TrxID / reference</Label>
      <Input value={value.reference} onChange={(e) => onChange({ ...value, reference: e.target.value })} placeholder="Optional" />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Paid on</Label>
      <Input type="date" value={value.paidAt} onChange={(e) => onChange({ ...value, paidAt: e.target.value })} />
    </div>
  </div>
);

// Quick view of one purchase: items, payments, details and the receive / pay / cancel actions
export const PurchaseDetailDialog = ({ purchaseId, onOpenChange }) => {
  const { data: p, isLoading } = usePurchase(purchaseId);
  const { receive, addPayment, removePayment, cancel } = usePurchaseMutations();
  const { paymentMethods } = usePaymentMethods({ status: 'Active' });
  const [payForm, setPayForm] = useState(null);
  const [cancelReason, setCancelReason] = useState(null);
  const slipRef = useRef(null);
  const busy = receive.isPending || addPayment.isPending || removePayment.isPending || cancel.isPending;

  const close = (open) => {
    if (open) return;
    setPayForm(null);
    setCancelReason(null);
    onOpenChange(false);
  };

  const due = p ? Math.max(0, p.total - p.paidAmount) : 0;
  const open = p && p.status !== 'cancelled';

  return (
    <Dialog open={Boolean(purchaseId)} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{p ? `${p.purchaseNumber} · ${p.vendorName}` : 'Purchase'}</DialogTitle>
          <DialogDescription>
            {p ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <PurchaseStatusBadge status={p.status} />
                <PaymentStatusText status={p.paymentStatus} />
              </span>
            ) : isLoading ? 'Loading…' : 'Not found'}
          </DialogDescription>
        </DialogHeader>

        {p && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => printDocument({ element: slipRef.current, docId: p.purchaseNumber, docType: 'Purchase', clientName: p.vendorName })}>
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" title={p.vendorPhone ? `Send to ${p.vendorPhone}` : 'No vendor phone saved: WhatsApp will ask for a contact'} onClick={() => sendPurchaseOnWhatsApp(p)}>
                <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
              </Button>
            </div>
            {open && (
              <div className="flex flex-wrap gap-2">
                {(p.status === 'draft' || p.status === 'ordered') && (
                  <Button disabled={busy} onClick={() => receive.mutate({ id: p.id })}>
                    <PackageCheck className="mr-1 h-4 w-4" /> {receive.isPending ? 'Receiving…' : 'Mark received'}
                  </Button>
                )}
                {p.paymentStatus !== 'paid' && (
                  <Button variant="outline" disabled={busy} onClick={() => { setCancelReason(null); setPayForm({ paymentTypeId: '', amount: String(Math.round(due * 100) / 100), reference: '', paidAt: today() }); }}>
                    <Wallet className="mr-1 h-4 w-4" /> Add payment
                  </Button>
                )}
                <Button variant="outline" render={<Link to={`/inventory/purchases/${p.id}/edit`} />}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button variant="cancel" disabled={busy} onClick={() => { setPayForm(null); setCancelReason(''); }}>
                  <Ban className="mr-1 h-4 w-4" /> Cancel purchase
                </Button>
              </div>
            )}

            {payForm && (
              <form
                className="space-y-3 rounded-lg border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!payForm.paymentTypeId) return;
                  addPayment.mutate({ id: p.id, ...payForm, amount: Number(payForm.amount) }, { onSuccess: () => setPayForm(null) });
                }}
              >
                <PaymentFields value={payForm} onChange={setPayForm} methods={paymentMethods} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPayForm(null)}>Close</Button>
                  <Button type="submit" disabled={addPayment.isPending || !payForm.paymentTypeId || !(Number(payForm.amount) > 0)}>
                    {addPayment.isPending ? 'Saving…' : 'Save payment'}
                  </Button>
                </div>
              </form>
            )}

            {cancelReason !== null && (
              <form
                className="space-y-2 rounded-lg border border-destructive/40 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  cancel.mutate({ id: p.id, reason: cancelReason }, { onSuccess: () => setCancelReason(null) });
                }}
              >
                <p className="text-sm">
                  Cancelling voids the Product Purchase bill{p.status === 'received' ? ' and takes the received units back out of stock' : ''}. This cannot be undone.
                </p>
                <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason (optional)" />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCancelReason(null)}>Keep</Button>
                  <Button type="submit" variant="destructive" disabled={cancel.isPending}>{cancel.isPending ? 'Cancelling…' : 'Cancel purchase'}</Button>
                </div>
              </form>
            )}

            <Section title="Items">
              {p.lines.map((l, i) => (
                <Line key={i} label={`${lineText(l)} @ ${taka(l.packPrice)}`} value={taka(l.total)} />
              ))}
              {p.shipping > 0 && <Line label="Shipping / carrying" value={taka(p.shipping)} />}
              {p.discount > 0 && <Line label="Discount" value={`-${taka(p.discount)}`} />}
              <Line label="Total" value={taka(p.total)} className="border-t pt-2 font-semibold" />
            </Section>

            <Section title="Payments">
              {p.payments.length === 0 && <p className="py-1 text-sm text-muted-foreground">No payments yet.</p>}
              {p.payments.map((x) => (
                <div key={x._id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span className="text-muted-foreground">{fmtDate(x.paidAt)} · {x.method}{x.reference ? ` (${x.reference})` : ''}</span>
                  <span className="flex items-center gap-1">
                    {taka(x.amount)}
                    {open && (
                      <Button size="icon-sm" variant="ghost" title="Remove payment" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => removePayment.mutate({ id: p.id, paymentId: x._id })}>
                        <Trash2 />
                      </Button>
                    )}
                  </span>
                </div>
              ))}
              <Line label="Due" value={taka(due)} className={`border-t pt-2 font-semibold ${due > 0 ? 'text-red-600' : ''}`} />
            </Section>

            <Section title="Details">
              <Line label="Vendor phone" value={p.vendorPhone || '-'} />
              <Line label="Order date" value={fmtDate(p.orderDate)} />
              <Line label="Received" value={fmtDate(p.receivedAt)} />
              <Line label="Stock" value={p.stock ? `${p.stock.status === 'cancelled' ? 'Taken back out' : `${p.stock.totalUnits} units in stock`}` : 'Not in stock yet'} />
              <Line label="Bill" value={p.bill ? `${p.bill.did} (${p.bill.status})` : '-'} />
              <Line label="Created by" value={p.createdBy || '-'} />
              {p.notes && <Line label="Notes" value={<span className="whitespace-pre-line">{p.notes}</span>} />}
            </Section>

            <PurchasePrintSlip p={p} slipRef={slipRef} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
