import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Layers, Plus, Trash2, Search, Loader2, PenLine, Package, Boxes, Warehouse, Check, ImageIcon, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaPickerModal } from '@/components/dashboard/media-picker-modal';
import { apiClient, baseURL } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { useCategories, useBrands } from '@/lib/category-cache';
import { useAuth } from '@/lib/auth-context';
import { isReadOnlyRole } from '@/lib/rbac';
import { clientConfig } from '@/clientConfig';
import { effectivePrice } from '@/utils/orderHelper';
import { taka } from './combos';
import { useStockItems } from '@/hooks/use-stock-items';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';

const ACTION_BTN = 'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';
const API_BASE = (baseURL || '').replace(/\/$/, '');
const DISCOUNTS = [
  { value: 'none', label: 'No discount' },
  { value: 'percentage', label: '% off' },
  { value: 'fixed', label: '৳ off' },
];
const EMPTY = { name: '', slug: '', sku: '', description: '', longDescription: '', imageUrl: '', gallery: [], isActive: true, showInMetaCatalog: false, categories: [], brand: [], pieces: [], discountType: 'none', discountValue: '' };

// Relative upload paths need the API host to show
const fullUrl = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`);

const slugify = (text) => String(text || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Totals exactly as the server computes them
const totalsOf = (pieces, discountType, discountValue) => {
  const total = round2(pieces.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0), 0));
  const v = Math.max(0, Number(discountValue) || 0);
  const discount = discountType === 'percentage' ? round2((total * Math.min(v, 100)) / 100) : discountType === 'fixed' ? round2(Math.min(v, total)) : 0;
  return { total, discount, price: round2(total - discount), count: pieces.reduce((s, p) => s + (Number(p.quantity) || 0), 0) };
};

// Catalog entry -> piece; variants start on their first size
const pieceFromEntry = (entry, source) => {
  const variant = entry.type === 'variant' && entry.variants?.length ? entry.variants[0] : null;
  const src = variant || entry;
  return {
    key: `${source}-${entry.id || entry._id}-${Date.now()}`,
    source,
    refId: String(entry.id || entry._id),
    name: entry.name,
    size: variant ? variant.size : '',
    variants: entry.type === 'variant' ? entry.variants || [] : [],
    quantity: 1,
    unitPrice: effectivePrice(Number(src.price) || 0, src.offerPrice ?? null),
    imageUrl: entry.imageUrl || entry.thumbnailUrl || '',
    stockAmount: null,
    problem: entry.isActive === false ? 'not active' : entry.stockStatus === 'outofstock' ? 'out of stock' : null,
  };
};

// Search box over products and items; onPick gets a ready piece
const CatalogPicker = ({ open, onOpenChange, onPick }) => {
  const [q, setQ] = useState('');
  const term = q.trim();
  const { data, isFetching } = useQuery({
    queryKey: ['combo-catalog-search', term],
    queryFn: async () => {
      const params = { q: term || undefined, limit: 15 };
      const [p, i] = await Promise.all([
        apiClient.get('/api/v1/products', { params }).catch(() => ({ data: {} })),
        apiClient.get('/api/v1/items', { params }).catch(() => ({ data: {} })),
      ]);
      return { products: p.data?.data || [], items: (i.data?.data || []).filter((x) => !['group', 'combo'].includes(x.type)) };
    },
    enabled: open,
    staleTime: 15000,
  });
  const rows = [...(data?.products || []).map((e) => ({ e, source: 'product' })), ...(data?.items || []).map((e) => ({ e, source: 'item' }))];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a piece from the catalog</DialogTitle>
          <DialogDescription>Stock goes down through the product's inventory link when the group sells. The price per piece starts at today's price and can be changed.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input autoFocus className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products and items" />
        </div>
        <div className="max-h-80 min-w-0 divide-y overflow-y-auto rounded-md border">
          {isFetching && rows.length === 0 && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
          {!isFetching && rows.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nothing found.</p>}
          {rows.map(({ e, source }) => {
            const out = e.stockStatus === 'outofstock' || e.isActive === false;
            return (
              <button
                key={`${source}-${e.id || e._id}`}
                type="button"
                className="flex w-full min-w-0 cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
                onClick={() => onPick(pieceFromEntry(e, source))}
              >
                {e.imageUrl ? <img src={fullUrl(e.imageUrl)} alt="" className="h-9 w-9 shrink-0 rounded border object-cover" /> : <div className="h-9 w-9 shrink-0 rounded border bg-muted" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {source === 'item' ? 'Item' : 'Product'} · {e.type === 'variant' ? `${e.variants?.length || 0} sizes` : taka(effectivePrice(Number(e.price) || 0, e.offerPrice ?? null))}
                  </span>
                </span>
                {out && <Badge variant="outline" className="border-red-500 text-[10px] text-red-600">{e.isActive === false ? 'Inactive' : 'Out of stock'}</Badge>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Inventory item -> piece; the price per piece is typed in
const pieceFromStock = (s) => ({
  key: `stock-${s.id}-${Date.now()}`,
  source: 'stock',
  refId: s.id,
  name: s.name || s.shortName,
  size: '',
  variants: [],
  quantity: 1,
  unitPrice: '',
  imageUrl: '',
  stockAmount: Number(s.quantity) || 0,
  problem: Number(s.quantity) <= 0 ? 'out of stock' : null,
});

// Tick several inventory items and add them to the group at once
const InventoryPicker = ({ open, onOpenChange, onPick }) => {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState([]);
  const { data, isFetching } = useStockItems({ status: 'active', search: q.trim() });
  const rows = data?.data || [];
  const toggle = (s) => setPicked((cur) => (cur.some((x) => x.id === s.id) ? cur.filter((x) => x.id !== s.id) : [...cur, s]));
  const close = (v) => {
    if (!v) { setPicked([]); setQ(''); }
    onOpenChange(v);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add pieces from inventory</DialogTitle>
          <DialogDescription>Tick every piece in the group. Their stock goes down when the group sells.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input autoFocus className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory" />
        </div>
        <div className="max-h-80 min-w-0 divide-y overflow-y-auto rounded-md border">
          {isFetching && rows.length === 0 && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
          {!isFetching && rows.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nothing found.</p>}
          {rows.map((s) => {
            const on = picked.some((x) => x.id === s.id);
            const qty = Number(s.quantity) || 0;
            return (
              <button key={s.id} type="button" onClick={() => toggle(s)} className={`flex w-full min-w-0 cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-muted ${on ? 'bg-primary/5' : ''}`}>
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{on && <Check className="h-3 w-3" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.shortName}{s.name ? ` · ${s.name}` : ''}</span>
                  <span className={`block text-xs ${qty <= 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{qty} {s.unit || 'pcs'} in stock</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button type="button" className={ACTION_BTN} disabled={picked.length === 0} onClick={() => { onPick(picked.map(pieceFromStock)); close(false); }}>
            Add {picked.length || ''} piece{picked.length === 1 ? '' : 's'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Toggle chips for categories or brands
const Chips = ({ options, selected, onChange, empty }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.length === 0 && <span className="text-xs text-muted-foreground">{empty}</span>}
    {options.map((o) => {
      const on = selected.includes(o.value);
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
          className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

// Create / edit a group product; ?copy=<id> starts a new one from an existing group
const ComboEditor = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const copyId = params.get('copy');
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const readOnly = isReadOnlyRole(user?.role);
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [picker, setPicker] = useState(false);
  const [stockPicker, setStockPicker] = useState(false);
  const [media, setMedia] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedFor, setLoadedFor] = useState(null);
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const sourceId = id || copyId;
  const { data: source, isLoading } = useQuery({
    queryKey: ['combo', sourceId],
    queryFn: async () => (await apiClient.get(`/api/v1/combos/${sourceId}`)).data?.data,
    enabled: Boolean(sourceId),
  });

  useEffect(() => {
    if (!source || loadedFor === sourceId) return;
    setLoadedFor(sourceId);
    const copying = !id;
    setForm({
      name: copying ? `${source.name} (Copy)` : source.name,
      slug: copying ? slugify(`${source.name} (Copy)`) : source.slug,
      sku: copying ? '' : source.sku,
      description: source.description,
      longDescription: source.longDescription || '',
      imageUrl: source.imageUrl,
      gallery: source.gallery || [],
      isActive: source.isActive,
      showInMetaCatalog: source.showInMetaCatalog === true,
      categories: (source.categories || []).map((c) => c.slug || c.did || c.id).filter(Boolean),
      brand: source.brand || [],
      discountType: source.discountType,
      discountValue: source.discountType === 'none' ? '' : String(source.discountValue),
      pieces: source.pieces.map((p, i) => ({ ...p, key: `p-${i}`, variants: [] })),
    });
    setSlugTouched(!copying);
  }, [source, sourceId, id, loadedFor]);

  // Variant sizes of saved catalog pieces, so their size can still be changed
  const variantRefs = useMemo(() => form.pieces.filter((p) => p.source !== 'custom' && p.size && !p.variants?.length).map((p) => `${p.source}:${p.refId}`), [form.pieces]);
  useEffect(() => {
    if (!variantRefs.length) return;
    let alive = true;
    Promise.all(
      variantRefs.map(async (ref) => {
        const [src, rid] = ref.split(':');
        const res = await apiClient.get(`/api/v1/${src === 'item' ? 'items' : 'products'}/${rid}`).catch(() => null);
        return [ref, res?.data?.data?.variants || []];
      })
    ).then((pairs) => {
      if (!alive) return;
      const byRef = new Map(pairs);
      setForm((f) => ({ ...f, pieces: f.pieces.map((p) => (byRef.has(`${p.source}:${p.refId}`) ? { ...p, variants: byRef.get(`${p.source}:${p.refId}`) } : p)) }));
    });
    return () => {
      alive = false;
    };
  }, [variantRefs.join('|')]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setPiece = (key, patch) => setForm((f) => ({ ...f, pieces: f.pieces.map((p) => (p.key === key ? { ...p, ...patch } : p)) }));
  const totals = totalsOf(form.pieces, form.discountType, form.discountValue);

  const categoryOptions = categories.map((c) => ({ value: c.slug || c.did, label: c.name }));
  const brandOptions = brands.map((b) => ({ value: b.did, label: b.name }));

  // Adds a catalog piece; the same product and size again just adds a piece
  const pick = (piece) => {
    setForm((f) => {
      const same = f.pieces.find((p) => p.source === piece.source && p.refId === piece.refId && p.size === piece.size);
      if (same) return { ...f, pieces: f.pieces.map((p) => (p === same ? { ...p, quantity: Number(p.quantity) + 1 } : p)) };
      return { ...f, pieces: [...f.pieces, piece] };
    });
    setPicker(false);
  };

  // Adds inventory pieces; one already in the group just gets one more
  const pickStock = (pieces) => {
    setForm((f) => {
      let next = f.pieces;
      for (const piece of pieces) {
        const same = next.find((p) => p.source === 'stock' && p.refId === piece.refId);
        next = same ? next.map((p) => (p === same ? { ...p, quantity: Number(p.quantity) + 1 } : p)) : [...next, piece];
      }
      return { ...f, pieces: next };
    });
  };

  // Typed-in piece that is not in the catalog (no stock)
  const addCustom = () => set({ pieces: [...form.pieces, { key: `c-${Date.now()}`, source: 'custom', refId: null, name: '', size: '', quantity: 1, unitPrice: '', imageUrl: '' }] });

  // Picking another size also takes that size's price
  const chooseSize = (p, size) => {
    const v = p.variants.find((x) => x.size === size);
    setPiece(p.key, { size, ...(v ? { unitPrice: effectivePrice(Number(v.price) || 0, v.offerPrice ?? null) } : {}) });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        discountValue: form.discountType === 'none' ? 0 : Number(form.discountValue) || 0,
        pieces: form.pieces.map(({ source: s, refId, name, size, quantity, unitPrice, imageUrl }) => ({ source: s, refId, name, size, quantity: Number(quantity), unitPrice: unitPrice === '' ? '' : Number(unitPrice), imageUrl })),
      };
      if (isNew) await apiClient.post('/api/v1/combos', body);
      else await apiClient.put(`/api/v1/combos/${id}`, body);
      toast.success(isNew ? 'Group product created' : 'Group product saved');
      qc.invalidateQueries({ queryKey: ['combos'] });
      qc.invalidateQueries({ queryKey: ['combo'] });
      navigate('/dashboard/products/combos');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save the group product'));
    } finally {
      setSaving(false);
    }
  };

  if (sourceId && isLoading) {
    return <div className="page-container flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  return (
    <form onSubmit={save} className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" render={<Link to="/dashboard/products/combos" />}><ChevronLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Layers className="h-6 w-6 text-primary" /> {isNew ? (copyId ? 'Duplicate group product' : 'New group product') : `Edit ${source?.name || ''}`}</h2>
            <p className="text-sm text-muted-foreground">Set pieces sold together. One discount on the whole group.</p>
          </div>
        </div>
        {!readOnly && (
          <Button type="submit" className={ACTION_BTN} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{isNew ? 'Create group' : 'Save'}
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold" htmlFor="combo-name">Name *</label>
                <Input id="combo-name" required value={form.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="e.g. Couple Night Combo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="combo-slug">Slug</label>
                <Input id="combo-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" htmlFor="combo-sku">SKU (optional)</label>
                <Input id="combo-sku" value={form.sku} onChange={(e) => set({ sku: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold" htmlFor="combo-desc">Short description</label>
                <Textarea id="combo-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold">Long description (optional)</label>
                <RichTextEditor
                  placeholder="Write a detailed description for the product page..."
                  value={form.longDescription}
                  onChange={(val) => set({ longDescription: val })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Pieces in the group</CardTitle>
                <CardDescription>How many of each, and the price of one piece.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setStockPicker(true)}><Warehouse className="mr-1 h-3.5 w-3.5" /> From inventory</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPicker(true)}><Plus className="mr-1 h-3.5 w-3.5" /> From products / items</Button>
                <Button type="button" size="sm" variant="outline" onClick={addCustom}><PenLine className="mr-1 h-3.5 w-3.5" /> Custom piece</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.pieces.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No pieces yet. Add from inventory, from your products and items, or type a custom piece.</p>}
              {form.pieces.map((p) => {
                const lineTotal = round2((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0));
                const short = p.source !== 'custom' && p.stockAmount !== null && p.stockAmount !== undefined && p.stockAmount < Number(p.quantity);
                return (
                  <div key={p.key} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border p-2">
                    {p.imageUrl ? <img src={fullUrl(p.imageUrl)} alt="" className="h-10 w-10 shrink-0 rounded border object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted">{p.source === 'custom' ? <PenLine className="h-4 w-4 text-muted-foreground" /> : p.source === 'stock' ? <Warehouse className="h-4 w-4 text-muted-foreground" /> : p.source === 'item' ? <Boxes className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />}</div>}
                    <div className="min-w-[10rem] flex-1">
                      {p.source === 'custom' ? (
                        <Input value={p.name} onChange={(e) => setPiece(p.key, { name: e.target.value })} placeholder="Piece name" className="h-8" />
                      ) : (
                        <div className="truncate text-sm font-medium" title={p.name}>{p.name}</div>
                      )}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">{p.source === 'custom' ? 'Custom · no stock' : p.source === 'stock' ? 'Inventory' : p.source === 'item' ? 'Item' : 'Product'}</Badge>
                        {p.variants?.length > 0 && (
                          <select className="h-6 rounded border bg-background px-1 text-[11px]" value={p.size} onChange={(e) => chooseSize(p, e.target.value)}>
                            {p.variants.map((v) => <option key={v.size} value={v.size}>{v.size}</option>)}
                          </select>
                        )}
                        {!p.variants?.length && p.size && <span>Size {p.size}</span>}
                        {p.stockAmount !== null && p.stockAmount !== undefined && p.source !== 'custom' && <span>{p.stockAmount} in stock</span>}
                        {p.problem && <span className="inline-flex items-center gap-0.5 text-red-600"><AlertTriangle className="h-3 w-3" />{p.problem}</span>}
                        {!p.problem && (short || p.warning) && <span className="text-amber-600">{p.warning || 'not enough for one group'}</span>}
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Input type="number" min={1} step={1} className="h-8 w-16" value={p.quantity} onChange={(e) => setPiece(p.key, { quantity: e.target.value === '' ? '' : Math.max(1, Math.round(Number(e.target.value) || 1)) })} /> pcs ×
                    </label>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      ৳<Input type="number" min={0} step="any" className="h-8 w-24" value={p.unitPrice} onChange={(e) => setPiece(p.key, { unitPrice: e.target.value })} />
                    </label>
                    <span className="w-20 text-right text-sm font-semibold">{taka(lineTotal)}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove piece" onClick={() => set({ pieces: form.pieces.filter((x) => x.key !== p.key) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Price</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="inline-flex flex-wrap rounded-md border p-0.5">
                {DISCOUNTS.map((d) => (
                  <button key={d.value} type="button" onClick={() => set({ discountType: d.value })} className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium ${form.discountType === d.value ? 'bg-secondary text-secondary-foreground dark:bg-primary dark:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              {form.discountType !== 'none' && (
                <label className="flex items-center gap-2 text-sm">
                  <Input type="number" min={0} max={form.discountType === 'percentage' ? 100 : undefined} step="any" className="w-28" value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} placeholder={form.discountType === 'percentage' ? '10' : '50'} />
                  <span className="text-muted-foreground">{form.discountType === 'percentage' ? '% off the whole group' : '৳ off the whole group'}</span>
                </label>
              )}
              <div className="space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pieces total ({totals.count} pcs)</span><span>{taka(totals.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className={totals.discount > 0 ? 'text-emerald-600' : ''}>{totals.discount > 0 ? `−${taka(totals.discount)}` : taka(0)}</span></div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Group price</span><span>{taka(totals.price)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Status &amp; feature image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.isActive} onCheckedChange={(v) => set({ isActive: v })} /> Active</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.showInMetaCatalog} onCheckedChange={(v) => set({ showInMetaCatalog: v })} /> Show in Meta catalog</label>
              <div className="flex items-center gap-3">
                {form.imageUrl ? (
                  <div className="relative">
                    <img src={fullUrl(form.imageUrl)} alt="" className="h-20 w-20 rounded-md border object-cover" />
                    <button type="button" aria-label="Remove picture" onClick={() => set({ imageUrl: '' })} className="absolute -right-1.5 -top-1.5 cursor-pointer rounded-full border bg-background p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed bg-muted/40"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div className="space-y-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => setMedia(true)}>Choose picture</Button>
                  <p className="text-[11px] text-muted-foreground">Empty uses the first piece's picture.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gallery images</CardTitle>
              <CardDescription>Extra pictures on the product page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.gallery.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.gallery.map((url) => (
                    <div key={url} className="relative">
                      <img src={fullUrl(url)} alt="" className="h-16 w-16 rounded-md border object-cover" />
                      <button type="button" aria-label="Remove image" onClick={() => set({ gallery: form.gallery.filter((g) => g !== url) })} className="absolute -right-1.5 -top-1.5 cursor-pointer rounded-full border bg-background p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => setGalleryMedia(true)}>{form.gallery.length ? 'Change gallery' : 'Add gallery images'}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Category{hasBrand ? ' & brand' : ''}</CardTitle>
              <CardDescription>No category picked = Combo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Chips options={categoryOptions} selected={form.categories} onChange={(v) => set({ categories: v })} empty="No categories yet." />
              {hasBrand && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-semibold">Brand</p>
                  <Chips options={brandOptions} selected={form.brand} onChange={(v) => set({ brand: v })} empty="No brands yet." />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CatalogPicker open={picker} onOpenChange={setPicker} onPick={pick} />
      <InventoryPicker open={stockPicker} onOpenChange={setStockPicker} onPick={pickStock} />
      <MediaPickerModal open={media} onOpenChange={setMedia} onSelect={(url) => url && set({ imageUrl: Array.isArray(url) ? url[0] : url })} multiple={false} initialSelected={form.imageUrl} title="Group product picture" productSlug={form.slug} />
      <MediaPickerModal open={galleryMedia} onOpenChange={setGalleryMedia} onSelect={(urls) => set({ gallery: [...new Set((Array.isArray(urls) ? urls : urls ? [urls] : []).filter(Boolean))] })} multiple initialSelected={form.gallery} title="Gallery images" productSlug={form.slug} />
    </form>
  );
};

export default ComboEditor;
