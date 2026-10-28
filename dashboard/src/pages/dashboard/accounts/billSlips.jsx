import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, HandCoins, PlusCircle, Printer, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBillings } from '@/hooks/use-billings';

const SHOP_KEY = 'billSlips.shop';
const SAVED_KEY = 'billSlips.saved';
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = (v) => `৳${(Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const makeNo = (prefix) => `${prefix}-${todayISO().replace(/-/g, '').slice(2)}-${String(Math.floor(Math.random() * 900) + 100)}`;

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const below100 = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const below1000 = (n) => (n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${below100(n % 100)}` : ''}` : below100(n));

// Indian grouping (Crore / Lakh / Thousand) to match taka amounts
const amountInWords = (value) => {
  let n = Math.floor(Number(value) || 0);
  if (n <= 0) return 'Zero Taka Only';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return `${parts.join(' ')} Taka Only`;
};

const Field = ({ label, children, className = '' }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    {children}
  </label>
);

const TextArea = (props) => (
  <textarea
    {...props}
    className="w-full rounded-md border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]"
  />
);

const emptyItem = () => ({ desc: '', qty: 1, price: '' });

const ShopHeader = ({ shop, title, no, date }) => (
  <div className="flex items-start justify-between border-b-2 border-black pb-3">
    <div>
      <div className="text-2xl font-extrabold tracking-tight">{shop.name || 'Your Shop'}</div>
      {shop.address && <div className="text-[11px] text-gray-600 mt-0.5">{shop.address}</div>}
      {shop.phone && <div className="text-[11px] text-gray-600">Phone: {shop.phone}</div>}
    </div>
    <div className="text-right">
      <div className="text-lg font-bold uppercase tracking-widest">{title}</div>
      <div className="text-[11px] text-gray-600 mt-1">No: <b className="text-black">{no || '—'}</b></div>
      <div className="text-[11px] text-gray-600">Date: <b className="text-black">{fmtDate(date)}</b></div>
    </div>
  </div>
);

const Signatures = ({ left, right }) => (
  <div className="flex justify-between mt-14 text-[11px]">
    <div className="w-40 border-t border-black pt-1 text-center">{left}</div>
    <div className="w-40 border-t border-black pt-1 text-center">{right}</div>
  </div>
);

const ReceiptSheet = ({ shop, r }) => {
  const received = r.direction === 'received';
  return (
    <div className="p-8 text-black text-[13px] leading-relaxed">
      <ShopHeader shop={shop} title="Money Receipt" no={r.no} date={r.date} />
      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <span className="w-36 shrink-0 text-gray-600">{received ? 'Received from' : 'Paid to'}:</span>
          <span className="flex-1 border-b border-dotted border-gray-500 font-semibold">{r.party || ' '}</span>
        </div>
        {(r.phone || r.address) && (
          <div className="flex gap-2">
            <span className="w-36 shrink-0 text-gray-600">Contact:</span>
            <span className="flex-1 border-b border-dotted border-gray-500">{[r.phone, r.address].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        <div className="flex gap-2">
          <span className="w-36 shrink-0 text-gray-600">Sum of taka:</span>
          <span className="flex-1 border-b border-dotted border-gray-500 font-semibold">{amountInWords(r.amount)}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 text-gray-600">On account of:</span>
          <span className="flex-1 border-b border-dotted border-gray-500">{r.purpose || ' '}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-36 shrink-0 text-gray-600">Payment method:</span>
          <span className="flex-1 border-b border-dotted border-gray-500">{r.method || ' '}</span>
        </div>
        {r.notes && (
          <div className="flex gap-2">
            <span className="w-36 shrink-0 text-gray-600">Note:</span>
            <span className="flex-1 border-b border-dotted border-gray-500">{r.notes}</span>
          </div>
        )}
      </div>
      <div className="mt-7 inline-block border-2 border-black px-5 py-2 text-lg font-bold">{money(r.amount)}</div>
      <Signatures
        left={received ? 'Payer signature' : 'Receiver signature'}
        right={received ? `Received by${r.by ? `: ${r.by}` : ''}` : `Paid by${r.by ? `: ${r.by}` : ''}`}
      />
    </div>
  );
};

const InvoiceSheet = ({ shop, v, totals }) => (
  <div className="p-8 text-black text-[13px] leading-relaxed">
    <ShopHeader shop={shop} title="Invoice" no={v.no} date={v.date} />
    <div className="mt-5 flex justify-between gap-6 text-[12px]">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Bill to</div>
        <div className="font-semibold text-sm">{v.party || '—'}</div>
        {v.phone && <div>{v.phone}</div>}
        {v.address && <div className="text-gray-600 max-w-[260px]">{v.address}</div>}
      </div>
      {v.dueDate && (
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Due date</div>
          <div className="font-semibold">{fmtDate(v.dueDate)}</div>
        </div>
      )}
    </div>

    <table className="w-full mt-5 text-[12px] border-collapse">
      <thead>
        <tr className="bg-gray-100 border-y border-black text-left">
          <th className="py-1.5 px-2 w-8">#</th>
          <th className="py-1.5 px-2">Description</th>
          <th className="py-1.5 px-2 text-right w-14">Qty</th>
          <th className="py-1.5 px-2 text-right w-24">Price</th>
          <th className="py-1.5 px-2 text-right w-28">Amount</th>
        </tr>
      </thead>
      <tbody>
        {totals.rows.map((it, i) => (
          <tr key={i} className="border-b border-gray-300">
            <td className="py-1.5 px-2">{i + 1}</td>
            <td className="py-1.5 px-2">{it.desc || '—'}</td>
            <td className="py-1.5 px-2 text-right">{it.qty}</td>
            <td className="py-1.5 px-2 text-right">{money(it.price)}</td>
            <td className="py-1.5 px-2 text-right">{money(it.line)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-4 ml-auto w-64 text-[12px] space-y-1">
      <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{money(totals.subtotal)}</span></div>
      {totals.discount > 0 && <div className="flex justify-between"><span className="text-gray-600">Discount</span><span>- {money(totals.discount)}</span></div>}
      {totals.delivery > 0 && <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{money(totals.delivery)}</span></div>}
      <div className="flex justify-between border-t border-black pt-1 font-bold text-sm"><span>Total</span><span>{money(totals.total)}</span></div>
      {totals.paid > 0 && <div className="flex justify-between"><span className="text-gray-600">Paid</span><span>{money(totals.paid)}</span></div>}
      <div className="flex justify-between font-bold"><span>Balance due</span><span>{money(totals.due)}</span></div>
    </div>

    <div className="mt-3 text-[11px] text-gray-600">In words: <b className="text-black">{amountInWords(totals.total)}</b></div>
    {v.notes && <div className="mt-4 text-[11px] border-t pt-2 text-gray-700"><b>Note:</b> {v.notes}</div>}
    <Signatures left="Customer signature" right="Authorized signature" />
    <div className="mt-8 text-center text-[11px] text-gray-500">Thank you for your business!</div>
  </div>
);

export const BillSlipsPage = () => {
  const [tab, setTab] = useState('receipt');

  const [shop, setShop] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SHOP_KEY)) || { name: 'Surokkha', address: '', phone: '' };
    } catch {
      return { name: 'Surokkha', address: '', phone: '' };
    }
  });
  useEffect(() => {
    try { localStorage.setItem(SHOP_KEY, JSON.stringify(shop)); } catch { /* ignore */ }
  }, [shop]);

  const [r, setR] = useState(() => ({
    direction: 'received', no: makeNo('RC'), date: todayISO(), party: '', phone: '', address: '',
    amount: '', purpose: '', method: 'Cash', by: '', notes: '',
  }));
  const [v, setV] = useState(() => ({
    no: makeNo('INV'), date: todayISO(), dueDate: '', party: '', phone: '', address: '',
    items: [emptyItem()], discount: '', delivery: '', paid: '', notes: '',
  }));

  const setRF = (k) => (e) => setR((s) => ({ ...s, [k]: e.target.value }));
  const setVF = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const setItem = (i, k, val) => setV((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [k]: val } : it)) }));

  const totals = useMemo(() => {
    const rows = v.items.map((it) => {
      const qty = Number(it.qty) || 0;
      const price = Number(it.price) || 0;
      return { desc: it.desc, qty, price, line: qty * price };
    });
    const subtotal = rows.reduce((s, x) => s + x.line, 0);
    const discount = Number(v.discount) || 0;
    const delivery = Number(v.delivery) || 0;
    const total = Math.max(subtotal - discount + delivery, 0);
    const paid = Number(v.paid) || 0;
    return { rows, subtotal, discount, delivery, total, paid, due: Math.max(total - paid, 0) };
  }, [v]);

  const { createBilling, updateBilling, isCreating, isUpdating } = useBillings({ limit: 1 });
  const [syncBill, setSyncBill] = useState(true);
  const [saved, setSaved] = useState(readSaved);
  const [billLinks, setBillLinks] = useState({}); // slip no -> bill id (so re-saving updates, not duplicates)
  const persistSaved = (list) => {
    setSaved(list);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const handleSave = async () => {
    const isReceipt = tab === 'receipt';
    const data = isReceipt ? r : v;
    const total = isReceipt ? Number(r.amount) || 0 : totals.total;
    const paid = isReceipt ? total : totals.paid;
    if (!data.party.trim()) { toast.error('Please enter the party name'); return; }
    if (total <= 0) { toast.error('Please enter an amount'); return; }

    let billId = saved.find((s) => s.no === data.no)?.billId || billLinks[data.no] || null;
    if (syncBill) {
      const payload = {
        title: data.party.trim(),
        vendor: data.party.trim(),
        customerName: data.party.trim(),
        billType: isReceipt ? 'Money Receipt' : 'Invoice',
        billingPhone: data.phone || '',
        baseAmount: total,
        totalAmount: total,
        amount: total,
        paidAmount: paid,
        pendingAmount: Math.max(total - paid, 0),
        billingDate: data.date,
        dueDate: (isReceipt ? data.date : data.dueDate) || data.date,
        billingMethod: isReceipt ? data.method || 'Cash' : 'Invoice',
        paymentFee: { name: '', percent: 0, fixed: 0, amount: 0, isCustom: false },
        status: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending',
        notes: `${isReceipt ? 'Receipt' : 'Invoice'} ${data.no}${data.notes ? ` - ${data.notes}` : ''}`,
      };
      try {
        if (billId) {
          await updateBilling({ id: billId, ...payload });
        } else {
          const created = await createBilling(payload);
          billId = created?.id || created?._id || null;
        }
        if (billId) setBillLinks((s) => ({ ...s, [data.no]: billId }));
      } catch {
        toast.error('Could not sync with Bills, slip not saved');
        return;
      }
    }

    const entry = { no: data.no, type: tab, data: isReceipt ? r : v, total, billId: syncBill ? billId : null, savedAt: new Date().toISOString() };
    persistSaved([entry, ...saved.filter((s) => s.no !== data.no)]);
    toast.success(syncBill ? 'Slip saved and added to Bills' : 'Slip saved (not added to Bills)');
  };

  const openSaved = (s) => {
    setTab(s.type);
    if (s.type === 'receipt') setR(s.data); else setV(s.data);
  };

  const input = 'h-9 text-xs';

  return (
    <div className="page-container flex-1 space-y-5 p-4 md:p-8 pt-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          #slip-sheet, #slip-sheet * { visibility: visible !important; }
          #slip-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/dashboard/accounts/bills"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Receipt & Invoice</h1>
            <p className="text-xs text-muted-foreground">Fill in the left side, the print-ready slip appears on the right.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => setTab('receipt')}
              className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 ${tab === 'receipt' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
            >
              <HandCoins className="h-3.5 w-3.5" /> Money Receipt
            </button>
            <button
              type="button"
              onClick={() => setTab('invoice')}
              className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 ${tab === 'invoice' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
            >
              <FileText className="h-3.5 w-3.5" /> Invoice
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4" checked={syncBill} onChange={(e) => setSyncBill(e.target.checked)} />
            Also add to Bills
          </label>
          <Button variant="outline" onClick={handleSave} disabled={isCreating || isUpdating} className="h-9 text-xs gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button onClick={() => window.print()} className="h-9 text-xs gap-1.5">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        {/* INPUT */}
        <div className="space-y-4 print:hidden">
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold">Shop details (saved on this device)</div>
            <Field label="Shop name"><Input className={input} value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><Input className={input} value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} /></Field>
              <Field label="Address"><Input className={input} value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} /></Field>
            </div>
          </div>

          {saved.length > 0 && (
            <div className="bg-card border rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold">Saved slips</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {saved.map((s) => (
                  <div key={s.no} className="flex items-center justify-between gap-2 text-xs rounded-md border px-2 py-1.5">
                    <button type="button" className="text-left flex-1 truncate hover:underline" onClick={() => openSaved(s)}>
                      <b>{s.no}</b> · {s.data.party} · {money(s.total)}
                      {s.billId ? <span className="ml-1 text-emerald-600">(in Bills)</span> : null}
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => persistSaved(saved.filter((x) => x.no !== s.no))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'receipt' ? (
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="inline-flex rounded-lg border p-0.5 bg-muted/30 text-xs">
                {[['received', 'Money received'], ['paid', 'Money paid']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setR((s) => ({ ...s, direction: val }))}
                    className={`px-3 py-1.5 rounded-md ${r.direction === val ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Receipt no"><Input className={input} value={r.no} onChange={setRF('no')} /></Field>
                <Field label="Date"><Input type="date" className={input} value={r.date} onChange={setRF('date')} /></Field>
              </div>
              <Field label={r.direction === 'received' ? 'Received from (name)' : 'Paid to (name)'}>
                <Input className={input} value={r.party} onChange={setRF('party')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone"><Input className={input} value={r.phone} onChange={setRF('phone')} /></Field>
                <Field label="Address"><Input className={input} value={r.address} onChange={setRF('address')} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (৳)"><Input type="number" min="0" className={input} value={r.amount} onChange={setRF('amount')} /></Field>
                <Field label="Payment method"><Input className={input} value={r.method} onChange={setRF('method')} placeholder="Cash / bKash / Bank" /></Field>
              </div>
              <Field label="On account of (purpose)"><Input className={input} value={r.purpose} onChange={setRF('purpose')} /></Field>
              <Field label={r.direction === 'received' ? 'Received by' : 'Paid by'}><Input className={input} value={r.by} onChange={setRF('by')} /></Field>
              <Field label="Note"><TextArea value={r.notes} onChange={setRF('notes')} /></Field>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Invoice no"><Input className={input} value={v.no} onChange={setVF('no')} /></Field>
                <Field label="Date"><Input type="date" className={input} value={v.date} onChange={setVF('date')} /></Field>
              </div>
              <Field label="Customer name"><Input className={input} value={v.party} onChange={setVF('party')} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone"><Input className={input} value={v.phone} onChange={setVF('phone')} /></Field>
                <Field label="Due date"><Input type="date" className={input} value={v.dueDate} onChange={setVF('dueDate')} /></Field>
              </div>
              <Field label="Address"><Input className={input} value={v.address} onChange={setVF('address')} /></Field>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold">Items</div>
                {v.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_56px_80px_32px] gap-2 items-center">
                    <Input className={input} placeholder="Description" value={it.desc} onChange={(e) => setItem(i, 'desc', e.target.value)} />
                    <Input type="number" min="0" className={input} placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
                    <Input type="number" min="0" className={input} placeholder="Price" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
                    <Button
                      type="button" variant="ghost" size="icon" className="h-8 w-8"
                      disabled={v.items.length === 1}
                      onClick={() => setV((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setV((s) => ({ ...s, items: [...s.items, emptyItem()] }))}>
                  <PlusCircle className="h-3.5 w-3.5" /> Add item
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Discount"><Input type="number" min="0" className={input} value={v.discount} onChange={setVF('discount')} /></Field>
                <Field label="Delivery"><Input type="number" min="0" className={input} value={v.delivery} onChange={setVF('delivery')} /></Field>
                <Field label="Paid"><Input type="number" min="0" className={input} value={v.paid} onChange={setVF('paid')} /></Field>
              </div>
              <Field label="Note"><TextArea value={v.notes} onChange={setVF('notes')} /></Field>
            </div>
          )}
        </div>

        {/* OUTPUT */}
        <div className="overflow-x-auto">
          <div id="slip-sheet" className="bg-white text-black border shadow-md rounded-sm mx-auto w-full max-w-[794px] min-h-[420px]">
            {tab === 'receipt' ? <ReceiptSheet shop={shop} r={r} /> : <InvoiceSheet shop={shop} v={v} totals={totals} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSlipsPage;
