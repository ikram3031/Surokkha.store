import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Truck, Zap, Loader2, CheckCircle2, Copy, Minus, Plus, FilePlus2, ListChecks, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { useCourierEnabled } from '@/hooks/use-couriers';
import { PathaoPickupStore } from '@/components/dashboard/orders/pathaoParcel';
import { ACTION_BTN, money } from './pathaoUtils';

const WEIGHTS = ['0.5', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const ITEM_TYPES = [
  { value: '2', label: 'Parcel' },
  { value: '1', label: 'Document' },
];

const EMPTY_FORM = {
  merchantOrderId: '',
  phone: '',
  secondaryPhone: '',
  name: '',
  address: '',
  city: '',
  zone: '',
  area: '',
  weight: '0.5',
  quantity: 1,
  amount: '',
  description: '',
  instruction: '',
};

// BD numbers as Pathao wants them: 01XXXXXXXXX
const normalizePhone = (raw) => {
  let p = String(raw || '').replace(/\D/g, '');
  if (p.startsWith('880')) p = p.slice(2);
  if (p && !p.startsWith('0')) p = `0${p}`;
  return p;
};

const get = async (url) => (await apiClient.get(url)).data?.data || [];

const Field = ({ label, htmlFor, children, hint }) => (
  <div className="min-w-0 space-y-1.5">
    <label htmlFor={htmlFor} className="text-xs font-semibold">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const MODES = [
  { value: 'new', label: 'Create new', icon: FilePlus2 },
  { value: 'existing', label: 'Select existing order', icon: ListChecks },
];

// Loose match of a store thana to a Pathao zone name ("Mohammadpur" ~ "Mohammadpur Thana")
const matchZone = (zones, thana) => {
  const t = String(thana || '').toLowerCase().trim();
  if (!t) return null;
  return zones.find((z) => {
    const n = String(z.zone_name || '').toLowerCase().trim();
    return n === t || n.includes(t) || t.includes(n);
  }) || null;
};

// One-line summary of an order for the picker
const orderOption = (o) => ({
  value: o.id,
  label: `#${o.orderNumber} · ${o.name || 'No name'}`,
  sublabel: `${o.phone || ''} · ${money(o.amountToCollect)} · ${o.status}`,
});

const CostRow = ({ label, value, negative }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={negative && Number(value) > 0 ? 'text-red-500' : ''}>{negative && Number(value) > 0 ? `-${money(value)}` : money(value || 0)}</span>
  </div>
);

// Create a Same Day Pathao consignment directly, like the merchant panel's "Create New Delivery"
export default function PathaoSameDayPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pathaoEnabled = useCourierEnabled('pathao');
  const [form, setForm] = useState(EMPTY_FORM);
  const [itemType, setItemType] = useState('2');
  const [mode, setMode] = useState('new');
  const [linkedOrder, setLinkedOrder] = useState(null);
  const [created, setCreated] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const { data: config } = useQuery({
    queryKey: ['pathao-config-sync'],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/config')).data?.data,
  });
  const sameDayType = Number(config?.sameDayDeliveryType) || 12;
  const storeId = config?.storeId ? String(config.storeId) : '';

  const { data: undispatched = [], isFetching: undispatchedLoading } = useQuery({
    queryKey: ['pathao-undispatched'],
    queryFn: () => get('/api/v1/courier/pathao/orders/undispatched?limit=100'),
    enabled: mode === 'existing',
    staleTime: 30000,
  });
  const { data: cities = [] } = useQuery({ queryKey: ['pathao-cities'], queryFn: () => get('/api/v1/courier/pathao/cities'), staleTime: 3600000 });
  const { data: zones = [], isFetching: zonesLoading } = useQuery({
    queryKey: ['pathao-zones', form.city],
    queryFn: () => get(`/api/v1/courier/pathao/zones/${form.city}`),
    enabled: Boolean(form.city),
    staleTime: 3600000,
  });
  const { data: areas = [], isFetching: areasLoading } = useQuery({
    queryKey: ['pathao-areas', form.zone],
    queryFn: () => get(`/api/v1/courier/pathao/areas/${form.zone}`),
    enabled: Boolean(form.zone),
    staleTime: 3600000,
  });

  // Dhaka as the city since Same Day runs inside Dhaka
  useEffect(() => {
    if (!form.city && cities.length) {
      const dhaka = cities.find((c) => String(c.city_name).toLowerCase() === 'dhaka');
      if (dhaka) set({ city: String(dhaka.city_id) });
    }
  }, [cities, form.city]);

  const orderItems = useMemo(() => undispatched.map(orderOption), [undispatched]);

  // Picked order's thana selects the Pathao zone once Dhaka's zones are loaded
  useEffect(() => {
    if (!linkedOrder || form.zone || !zones.length) return;
    const z = matchZone(zones, linkedOrder.thana) || matchZone(zones, linkedOrder.district);
    if (z) set({ zone: String(z.zone_id), area: '' });
  }, [linkedOrder, zones, form.zone]);

  // Fills the form from an order that hasn't been sent to a courier yet
  const pickOrder = (id) => {
    const o = undispatched.find((x) => x.id === id) || null;
    setLinkedOrder(o);
    if (!o) {
      setForm((f) => ({ ...EMPTY_FORM, city: f.city }));
      return;
    }
    setForm((f) => ({
      ...EMPTY_FORM,
      city: f.city,
      merchantOrderId: o.orderNumber,
      phone: normalizePhone(o.phone),
      name: o.name,
      address: o.address,
      quantity: o.quantity || 1,
      amount: String(o.amountToCollect ?? ''),
    }));
  };

  // Switching mode starts from a clean form
  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setLinkedOrder(null);
    setForm((f) => ({ ...EMPTY_FORM, city: f.city }));
  };
  const cityItems = useMemo(() => cities.map((c) => ({ value: String(c.city_id), label: c.city_name })), [cities]);
  const zoneItems = useMemo(() => zones.map((z) => ({ value: String(z.zone_id), label: z.zone_name })), [zones]);
  const areaItems = useMemo(() => areas.map((a) => ({ value: String(a.area_id), label: a.area_name })), [areas]);

  const priceArgs = { storeId, itemType, weight: form.weight, city: form.city, zone: form.zone, sameDayType };
  const { data: price, isFetching: priceLoading, error: priceError } = useQuery({
    queryKey: ['pathao-same-day-price', priceArgs],
    queryFn: async () =>
      (await apiClient.post('/api/v1/courier/pathao/price-plan', {
        store_id: Number(storeId),
        item_type: Number(itemType),
        delivery_type: sameDayType,
        item_weight: Number(form.weight),
        recipient_city: Number(form.city),
        recipient_zone: Number(form.zone),
      })).data?.data,
    enabled: Boolean(storeId && form.city && form.zone),
    retry: false,
  });

  const amount = Number(form.amount) || 0;
  const codFee = price?.cod_enabled ? Math.round(amount * Number(price?.cod_percentage || 0)) : 0;
  const deliveryFee = Number(price?.price ?? 0);
  const totalCost = Number(price?.final_price ?? deliveryFee) + codFee;

  const createMutation = useMutation({
    mutationFn: async () => {
      const ref = linkedOrder ? linkedOrder.orderNumber : form.merchantOrderId.trim();
      const res = await apiClient.post('/api/v1/courier/pathao/orders/create', {
        ...(linkedOrder ? { orderId: linkedOrder.id, merchant_order_id: ref } : ref ? { orderId: ref, merchant_order_id: ref } : {}),
        store_id: Number(storeId),
        recipient_name: form.name.trim(),
        recipient_phone: normalizePhone(form.phone),
        recipient_secondary_phone: normalizePhone(form.secondaryPhone) || undefined,
        recipient_address: form.address.trim(),
        recipient_city: Number(form.city),
        recipient_zone: Number(form.zone),
        recipient_area: form.area ? Number(form.area) : undefined,
        delivery_type: sameDayType,
        item_type: Number(itemType),
        item_quantity: Number(form.quantity) || 1,
        item_weight: Number(form.weight),
        amount_to_collect: amount,
        item_description: form.description.trim(),
        special_instruction: form.instruction.trim(),
        keepItemDescription: true,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      const p = data?.pathao || {};
      setCreated({ consignmentId: p.consignment_id, merchantOrderId: p.merchant_order_id, deliveryFee: p.delivery_fee, linkedOrder: data?.order?.orderNumber });
      toast.success(`Same Day order created${p.consignment_id ? `: ${p.consignment_id}` : ''}`);
      setForm((f) => ({ ...EMPTY_FORM, city: f.city }));
      setLinkedOrder(null);
      ['pathao-summary', 'pathao-parcels', 'pathao-undispatched', 'orders'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create Pathao order')),
  });

  const phoneOk = normalizePhone(form.phone).length === 11;
  const secondaryOk = !form.secondaryPhone || normalizePhone(form.secondaryPhone).length === 11;
  const canSubmit =
    pathaoEnabled && storeId && (mode === 'new' || linkedOrder) && phoneOk && secondaryOk && form.name.trim().length >= 3 &&
    form.address.trim().length >= 10 && form.city && form.zone && form.amount !== '' && !createMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) createMutation.mutate();
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-8 w-8 text-red-500" />
          {t('nav.pathao_same_day', 'Same Day Order')}
        </h2>
        <p className="text-muted-foreground text-sm">Create a Same Day delivery on Pathao. Pick-up entry closes at 12:00 PM; inside Dhaka only.</p>
      </div>

      {!pathaoEnabled && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Pathao is turned off in courier settings, so new orders can't be created.
        </div>
      )}

      {created && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm flex flex-wrap items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>
            Created consignment <b className="font-mono">{created.consignmentId || '—'}</b>
            {created.merchantOrderId && <> · Merchant ID <span className="font-mono">{created.merchantOrderId}</span></>}
            {created.deliveryFee != null && <> · Fee {money(created.deliveryFee)}</>}
            {created.linkedOrder && <> · Linked to order #{created.linkedOrder}</>}
          </span>
          {created.consignmentId && (
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" onClick={() => copy(created.consignmentId)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy ID
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-sm">Basic information</CardTitle>
              <PathaoPickupStore config={config} className="h-8 max-w-full text-xs" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="inline-flex flex-wrap rounded-md border p-0.5" role="tablist" aria-label="Order source">
                {MODES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => switchMode(value)}
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${mode === value ? 'bg-secondary text-secondary-foreground dark:bg-primary dark:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              {mode === 'existing' && (
                <Field label="Order" hint="Only orders not sent to any courier yet (pending, processing, hold).">
                  <SearchableCombobox
                    value={linkedOrder?.id || ''}
                    onChange={(v) => pickOrder(v ? String(v) : '')}
                    options={orderItems}
                    placeholder={undispatchedLoading ? 'Loading orders…' : 'Search order #, name or phone'}
                    emptyMessage="No order is waiting to be sent."
                    isLoading={undispatchedLoading}
                    ariaLabel="Existing order"
                  />
                </Field>
              )}
              {linkedOrder && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/dashboard/orders/${linkedOrder.id}`} className="font-semibold underline">#{linkedOrder.orderNumber}</Link>
                    <span className="capitalize text-muted-foreground">{linkedOrder.status}</span>
                    <span className="text-muted-foreground">Total {money(linkedOrder.total)} · Paid {money(linkedOrder.paid)}</span>
                    <button type="button" onClick={() => pickOrder('')} className="ml-auto cursor-pointer text-muted-foreground hover:text-foreground" aria-label="Clear order"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="text-muted-foreground">{linkedOrder.items.map((i) => `${i.name}${i.size && !i.name.includes(`(${i.size})`) ? ` (${i.size})` : ''} ×${i.quantity}`).join(', ')}</div>
                  {linkedOrder.district && !/dhaka/i.test(linkedOrder.district) && (
                    <div className="text-amber-600 dark:text-amber-400">This order's district is {linkedOrder.district}. Same Day runs inside Dhaka only.</div>
                  )}
                  <div className="text-muted-foreground">After saving, the parcel is linked to this order and the order is marked shipped.</div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product Type">
                  <Select value={itemType} onValueChange={setItemType} items={ITEM_TYPES}>
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue>{(v) => ITEM_TYPES.find((i) => i.value === String(v))?.label || 'Parcel'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Merchant Order ID" htmlFor="sd-ref" hint={linkedOrder ? 'From the selected order.' : 'Optional. A matching store order gets linked and marked shipped.'}>
                  <Input id="sd-ref" value={form.merchantOrderId} readOnly={Boolean(linkedOrder)} onChange={(e) => set({ merchantOrderId: e.target.value })} placeholder="Type ID (Optional)" />
                </Field>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Recipient Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Recipient's Phone" htmlFor="sd-phone">
                  <Input id="sd-phone" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01XXXXXXXXX" aria-invalid={form.phone !== '' && !phoneOk} />
                </Field>
                <Field label="Recipient's Secondary Phone" htmlFor="sd-phone2">
                  <Input id="sd-phone2" inputMode="tel" value={form.secondaryPhone} onChange={(e) => set({ secondaryPhone: e.target.value })} placeholder="Enter phone number" aria-invalid={!secondaryOk} />
                </Field>
                <Field label="Recipient's Name" htmlFor="sd-name">
                  <Input id="sd-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name" />
                </Field>
                <Field label="Recipient's Address" htmlFor="sd-address">
                  <Textarea id="sd-address" rows={3} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="House, road, area (min 10 characters)" />
                </Field>
                <Field label="Delivery Area">
                  <div className="grid gap-2">
                    <SearchableCombobox value={form.city} onChange={(v) => set({ city: v ? String(v) : '', zone: '', area: '' })} options={cityItems} placeholder="City" clearable={false} ariaLabel="City" />
                    <SearchableCombobox value={form.zone} onChange={(v) => set({ zone: v ? String(v) : '', area: '' })} options={zoneItems} placeholder={form.city ? 'Zone' : 'City first'} disabled={!form.city} isLoading={zonesLoading} clearable={false} ariaLabel="Zone" />
                    <SearchableCombobox value={form.area} onChange={(v) => set({ area: v ? String(v) : '' })} options={areaItems} placeholder="Area (optional)" disabled={!form.zone} isLoading={areasLoading} ariaLabel="Area" />
                  </div>
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Delivery Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Delivery Type">
                  <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border px-3 text-sm">
                    <Zap className="h-4 w-4 shrink-0 text-red-500" /> <span className="truncate">Same Day Delivery</span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">#{sameDayType}</span>
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Total Weight (kg)">
                    <Select value={form.weight} onValueChange={(v) => set({ weight: v })} items={WEIGHTS.map((w) => ({ value: w, label: w }))}>
                      <SelectTrigger className="h-9 text-sm w-full"><SelectValue>{(v) => `${v} kg`}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {WEIGHTS.map((w) => <SelectItem key={w} value={w}>{w} kg</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Quantity">
                    <div className="flex h-9 items-center rounded-md border">
                      <button type="button" className="cursor-pointer px-3 h-full" aria-label="Decrease quantity" onClick={() => set({ quantity: Math.max(1, form.quantity - 1) })}><Minus className="h-3.5 w-3.5" /></button>
                      <span className="flex-1 text-center text-sm">{form.quantity}</span>
                      <button type="button" className="cursor-pointer px-3 h-full" aria-label="Increase quantity" onClick={() => set({ quantity: form.quantity + 1 })}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </Field>
                </div>
                <Field label="Amount to Collect" htmlFor="sd-amount" hint="Including delivery charge. Use 0 for prepaid.">
                  <Input id="sd-amount" type="number" min="0" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="Enter the amount including delivery charge" />
                </Field>
                <Field label="Item Description & Price" htmlFor="sd-desc" hint="Leave empty to send a neutral “Gift combo” label.">
                  <Textarea id="sd-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. gift pack" />
                </Field>
                <Field label="Special Instructions" htmlFor="sd-note">
                  <Textarea id="sd-note" rows={3} value={form.instruction} onChange={(e) => set({ instruction: e.target.value })} placeholder="Type here" />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-3">
            <Button type="submit" className={ACTION_BTN} disabled={!canSubmit}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Save
            </Button>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => pickOrder("")}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Cost Of Delivery {priceLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {priceError ? (
                <p className="text-xs text-red-500">{getApiErrorMessage(priceError, 'Pathao could not price this delivery.')} Check the Same Day code in Pathao settings.</p>
              ) : !form.zone ? (
                <p className="text-xs text-muted-foreground">Select a zone to see the charge.</p>
              ) : null}
              <CostRow label="Delivery Fee" value={deliveryFee} />
              <CostRow label="COD Fee" value={codFee} />
              <CostRow label="Discount" value={price?.discount} negative />
              <CostRow label="Promo Discount" value={price?.promo_discount} negative />
              <CostRow label="Additional Charge" value={price?.additional_charge} />
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Cost</span>
                <span>{money(price ? totalCost : 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p><b className="text-foreground">Same Day / On-Demand / Express pick-up entry last time 12:00 PM.</b> Max size 2 CFT; Friday and govt. holidays closed.</p>
              <p>Parcel body info must match the entry (merchant name, customer phone last 4 digits / merchant order ID).</p>
              <p>Same Day delivery takes about 8 hours inside Dhaka.</p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
