import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck, PackagePlus, Plus, Save, Trash2, Truck, Wallet } from 'lucide-react';

import { usePurchase, usePurchaseMutations, useVendors, useVendorMutations, taka } from '@/hooks/use-purchases';
import { useStockItems } from '@/hooks/use-stock-items';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { PaymentFields, PurchaseStatusBadge, fmtDate, today } from '@/components/dashboard/inventory/purchaseParts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NEW_VENDOR = '__new__';
const UNIT = 'unit';
const key = () => Math.random().toString(36).slice(2);
const emptyLine = () => ({ key: key(), stockItemId: '', pack: UNIT, packs: '', packPrice: '' });
const emptyPayment = (amount = '') => ({ key: key(), paymentTypeId: '', amount, reference: '', paidAt: today() });

// Pack choices for a line: single units plus the item's pack sizes
const packOptions = (item) => [
  { value: UNIT, label: item?.unit || 'pcs', unitsPerPack: 1 },
  ...(item?.packs || []).map((p, i) => ({ value: String(i), label: p.label, unitsPerPack: p.unitsPerPack })),
];
const perPackOf = (item, pack) => packOptions(item).find((o) => o.value === pack)?.unitsPerPack || 1;
const packChoice = (o) => (o.value === UNIT ? o.label : `${o.label} (${o.unitsPerPack})`);

// Turns a saved line back into form state, matching its pack size to the item's options
const toFormLine = (l, items) => {
  const item = items.find((i) => i.id === String(l.stockItemId));
  const match = packOptions(item).find((o) => o.unitsPerPack === l.unitsPerPack && (o.value === UNIT || o.label === l.packLabel));
  return {
    key: key(),
    stockItemId: String(l.stockItemId),
    pack: match?.value ?? UNIT,
    packs: String(match ? l.packs : l.units),
    packPrice: String(match ? l.packPrice : l.unitCost),
  };
};

// Create or edit a purchase: vendor, items in packs or units, payments, then save as draft / ordered / received
const PurchaseEditorPage = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingExisting } = usePurchase(editId);
  const { data: stockData, isLoading: loadingItems } = useStockItems({ status: 'active' });
  const { data: vendors = [] } = useVendors();
  const { paymentMethods } = usePaymentMethods({ status: 'Active' });
  const { create, update, addPayment } = usePurchaseMutations();
  const vendorMut = useVendorMutations();
  const items = stockData?.data || [];

  const [vendorId, setVendorId] = useState('');
  const [newVendor, setNewVendor] = useState({ name: '', phone: '' });
  const [orderDate, setOrderDate] = useState(today());
  const [lines, setLines] = useState([emptyLine()]);
  const [payments, setPayments] = useState([]);
  const [discount, setDiscount] = useState('');
  const [shipping, setShipping] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  // Fills the form once the purchase and stock items have loaded
  useEffect(() => {
    if (!editId || loaded || !existing || loadingItems) return;
    setVendorId(existing.vendorId ? String(existing.vendorId) : NEW_VENDOR);
    if (!existing.vendorId) setNewVendor({ name: existing.vendorName, phone: existing.vendorPhone || '' });
    setOrderDate(String(existing.orderDate || '').slice(0, 10) || today());
    setLines(existing.lines.map((l) => toFormLine(l, items)));
    setDiscount(existing.discount ? String(existing.discount) : '');
    setShipping(existing.shipping ? String(existing.shipping) : '');
    setNotes(existing.notes || '');
    setLoaded(true);
  }, [editId, loaded, existing, loadingItems, items]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const computed = useMemo(() => {
    const rows = lines.map((l) => {
      const item = itemById.get(l.stockItemId);
      const perPack = perPackOf(item, l.pack);
      const qty = Number(l.packs) || 0;
      const total = Math.round(qty * (Number(l.packPrice) || 0) * 100) / 100;
      const units = Math.round(qty * perPack);
      return { ...l, item, perPack, units, total, unitCost: units ? total / units : 0 };
    });
    const subtotal = rows.reduce((s, r) => s + r.total, 0);
    const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(shipping) || 0));
    const paid = (existing?.paidAmount || 0) + payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { rows, subtotal, total, paid, due: Math.max(0, total - paid) };
  }, [lines, itemById, discount, shipping, payments, existing]);

  const setLine = (k, patch) => setLines((ls) => ls.map((l) => (l.key === k ? { ...l, ...patch } : l)));
  const setPayment = (k, next) => setPayments((ps) => ps.map((p) => (p.key === k ? next : p)));
  const validPayments = () => payments.filter((p) => Number(p.amount) > 0);

  // Request body from the form; units per pack come from the chosen pack size
  const buildBody = (status) => {
    const body = {
      orderDate,
      lines: computed.rows
        .filter((r) => r.stockItemId)
        .map((r) => ({
          stockItemId: r.stockItemId,
          packLabel: r.pack === UNIT ? '' : packOptions(r.item).find((o) => o.value === r.pack)?.label,
          unitsPerPack: r.perPack,
          packs: Number(r.packs),
          packPrice: Number(r.packPrice) || 0,
        })),
      discount: Number(discount) || 0,
      shipping: Number(shipping) || 0,
      notes,
    };
    if (status) body.status = status;
    if (vendorId && vendorId !== NEW_VENDOR) body.vendorId = vendorId;
    else Object.assign(body, { vendorName: newVendor.name, vendorPhone: newVendor.phone });
    return body;
  };

  // Validates, saves (adding a new vendor first when asked) and opens the saved purchase
  const submit = async (status) => {
    setError('');
    if (!vendorId || (vendorId === NEW_VENDOR && !newVendor.name.trim())) return setError('Choose or add a vendor.');
    if (!computed.rows.some((r) => r.stockItemId && r.units > 0)) return setError('Add at least one item with a quantity.');
    if (computed.rows.some((r) => r.stockItemId && !(r.units > 0))) return setError('Every item needs a quantity.');
    if (validPayments().some((p) => !p.paymentTypeId)) return setError('Choose a method for each payment.');
    if (computed.paid > computed.total + 0.009) return setError('Paid amount is more than the total.');
    setSaving(true);
    try {
      const body = buildBody(status);
      if (vendorId === NEW_VENDOR) {
        const v = await vendorMut.create.mutateAsync({ name: newVendor.name, phone: newVendor.phone });
        setVendorId(v.id);
        delete body.vendorName;
        delete body.vendorPhone;
        body.vendorId = v.id;
      }
      const pays = validPayments().map(({ key: _k, ...p }) => ({ ...p, amount: Number(p.amount) }));
      let saved;
      if (existing) {
        saved = await update.mutateAsync({ id: existing.id, ...body });
        for (const p of pays) saved = await addPayment.mutateAsync({ id: existing.id, ...p });
      } else {
        saved = await create.mutateAsync({ ...body, payments: pays });
      }
      navigate(`/inventory/purchases?open=${saved.id}`);
    } catch {
      // The mutation already showed the error toast
    } finally {
      setSaving(false);
    }
  };

  if (editId && (loadingExisting || !loaded)) {
    if (!loadingExisting && !existing) return <p className="p-6 text-sm text-red-600">Purchase not found.</p>;
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }
  if (existing?.status === 'cancelled') return <p className="p-6 text-sm text-muted-foreground">A cancelled purchase cannot be edited.</p>;

  const isReceived = existing?.status === 'received';
  const vendorItems = [...vendors.map((v) => ({ value: v.id, label: `${v.name}${v.phone ? ` · ${v.phone}` : ''}` })), { value: NEW_VENDOR, label: '+ New vendor' }];
  // Item choices, keeping a saved line's item visible even if it has been made inactive since
  const itemChoices = (r) => [
    ...items.map((i) => ({ value: i.id, label: `${i.shortName}${i.name ? ` · ${i.name}` : ''} (${Number(i.quantity || 0)} ${i.unit})` })),
    ...(r.stockItemId && !r.item ? [{ value: r.stockItemId, label: existing?.lines.find((l) => String(l.stockItemId) === r.stockItemId)?.shortName || 'Unknown item' }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon-lg" aria-label="Back to purchases" render={<Link to="/inventory/purchases" />}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {existing ? `Edit ${existing.purchaseNumber}` : 'New Purchase'}
            {existing && <PurchaseStatusBadge status={existing.status} />}
          </h1>
          <p className="text-sm text-muted-foreground">What you bought, from whom and at what price. Receiving it adds the units to Stock Items.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> Vendor</CardTitle>
              <CardDescription>Pick a saved vendor or add a new one. Manage the list under Vendors.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Vendor <span className="text-red-500">*</span></Label>
                <Select value={vendorId} onValueChange={setVendorId} items={vendorItems}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choose vendor" /></SelectTrigger>
                  <SelectContent>{vendorItems.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Order date</Label>
                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </div>
              {vendorId === NEW_VENDOR && (
                <>
                  <div className="space-y-1.5">
                    <Label>Vendor name <span className="text-red-500">*</span></Label>
                    <Input value={newVendor.name} onChange={(e) => setNewVendor((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. Rahim Traders" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={newVendor.phone} onChange={(e) => setNewVendor((v) => ({ ...v, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Items</CardTitle>
              <CardDescription>Buy in pack sizes or single units; the cost per unit feeds the stock item's average cost.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!loadingItems && items.length === 0 && (
                <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
                  No stock items yet. Add them under <Link to="/inventory" className="underline">Stock Items</Link> first (short name + pack sizes).
                </p>
              )}
              <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-muted-foreground md:grid">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Bought as</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price each</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {computed.rows.map((r) => (
                <div key={r.key} className="grid grid-cols-12 items-start gap-2 rounded-lg border p-2 md:border-0 md:p-0">
                  <div className="col-span-12 md:col-span-4">
                    <Select value={r.stockItemId} onValueChange={(v) => setLine(r.key, { stockItemId: v, pack: itemById.get(v)?.packs?.length ? '0' : UNIT })} items={itemChoices(r)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Stock item" /></SelectTrigger>
                      <SelectContent>{itemChoices(r).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Select value={r.pack} onValueChange={(v) => setLine(r.key, { pack: v })} items={packOptions(r.item).map((o) => ({ value: o.value, label: packChoice(o) }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{packOptions(r.item).map((o) => <SelectItem key={o.value} value={o.value}>{packChoice(o)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input type="number" min={0} step="any" value={r.packs} onChange={(e) => setLine(r.key, { packs: e.target.value })} placeholder="0" />
                    {r.perPack > 1 && r.units > 0 && <p className="mt-0.5 text-[11px] text-muted-foreground">= {r.units} {r.item?.unit || 'pcs'}</p>}
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input type="number" min={0} step="any" value={r.packPrice} onChange={(e) => setLine(r.key, { packPrice: e.target.value })} placeholder="0" />
                    {r.units > 0 && r.total > 0 && r.perPack > 1 && <p className="mt-0.5 text-[11px] text-muted-foreground">{taka(r.unitCost)} / {r.item?.unit || 'pcs'}</p>}
                  </div>
                  <div className="col-span-12 flex items-center justify-end gap-1 md:col-span-2">
                    <span className="text-sm font-semibold">{taka(r.total)}</span>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove item" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((l) => l.key !== r.key))}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> {existing ? 'Add payments' : 'Payments made'}</CardTitle>
              <CardDescription>Money already paid to the vendor. You can also add payments later from the purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {existing?.payments?.length > 0 && (
                <div className="space-y-1 rounded-md bg-muted/40 p-3 text-sm">
                  {existing.payments.map((p) => (
                    <div key={p._id} className="flex justify-between">
                      <span className="text-muted-foreground">{fmtDate(p.paidAt)} · {p.method}{p.reference ? ` (${p.reference})` : ''}</span>
                      <span className="font-medium">{taka(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {payments.map((p) => (
                <div key={p.key} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1"><PaymentFields value={p} onChange={(next) => setPayment(p.key, next)} methods={paymentMethods} /></div>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove payment" onClick={() => setPayments((ps) => ps.filter((x) => x.key !== p.key))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setPayments((ps) => [...ps, emptyPayment(computed.due ? String(Math.round(computed.due * 100) / 100) : '')])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add payment
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{taka(computed.subtotal)}</span></div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Shipping / carrying</span>
                <Input type="number" min={0} step="any" value={shipping} onChange={(e) => setShipping(e.target.value)} className="w-28 text-right" placeholder="0" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" min={0} step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-28 text-right" placeholder="0" />
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{taka(computed.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{taka(computed.paid)}</span></div>
              <div className="flex justify-between font-medium"><span>Due</span><span className={computed.due > 0 ? 'text-red-600' : 'text-emerald-600'}>{taka(computed.due)}</span></div>
              <div className="space-y-1.5 pt-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this purchase" />
              </div>
              {error && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-600">{error}</p>}
              <div className="space-y-2 pt-2">
                {isReceived ? (
                  <Button size="lg" className="w-full" disabled={saving} onClick={() => submit()}>
                    <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving…' : 'Save changes (stock updates)'}
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="w-full" disabled={saving} onClick={() => submit('received')}>
                      <PackageCheck className="mr-1.5 h-4 w-4" /> {saving ? 'Saving…' : 'Save & receive into stock'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="lg" variant="outline" disabled={saving} onClick={() => submit('ordered')}>Save as ordered</Button>
                      <Button size="lg" variant="outline" disabled={saving} onClick={() => submit('draft')}>Save draft</Button>
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  Draft: nothing in the books. Ordered: bill added, stock not yet. Received: bill added and units go into Stock Items.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchaseEditorPage;
