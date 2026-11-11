import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

const ALL_CATEGORIES = '__all__';

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const initialForm = (offer) => ({
  name: offer?.name || '',
  isActive: offer ? offer.isActive !== false : true,
  discountPercent: offer?.discountPercent ? String(offer.discountPercent) : '',
  freeDelivery: !!offer?.freeDelivery,
  validFrom: toDateInput(offer?.validFrom),
  validTo: toDateInput(offer?.validTo),
  products: offer?.products || [],
});

// Short label for what an offer gives, e.g. "10% off · Free delivery"
const describeOffer = (o) =>
  [o.discountPercent > 0 ? `${o.discountPercent}% off` : '', o.freeDelivery ? 'Free delivery' : ''].filter(Boolean).join(' · ');

// One catalog row (product or item) in the shape the picker needs
const toCatalogRow = (p, kind) => {
  const id = String(p._id || p.id || '');
  const cats = (Array.isArray(p.categories) ? p.categories : [p.category]).filter((c) => c && typeof c === 'object');
  const firstVariant = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0] : null;
  return {
    id,
    kind,
    name: p.name || 'Untitled',
    price: Number(p.price ?? firstVariant?.price ?? 0),
    image: resolveImageUrl(p.thumbnailUrl || p.imageUrl || (Array.isArray(p.gallery) ? p.gallery[0] : '') || ''),
    categories: cats.map((c) => c.name).filter(Boolean),
  };
};

// Every active product and item, for picking the offer's products
const useCatalog = (enabled) =>
  useQuery({
    queryKey: ['direct-offer-catalog'],
    enabled,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [prodRes, itemRes] = await Promise.all([
        apiClient.post('/api/v1/dash/products', { limit: 1000, isActive: true, sort: 'createdAt', order: 'desc' }),
        apiClient.get('/api/v1/items', { params: { skip: 0, limit: 1000 } }).catch(() => ({ data: { data: [] } })),
      ]);
      const itemBody = itemRes.data;
      const rawItems = Array.isArray(itemBody) ? itemBody : itemBody?.data || [];
      const products = (prodRes.data?.data || []).filter((p) => p.isActive !== false).map((p) => toCatalogRow(p, 'Product'));
      const items = rawItems.filter((i) => i.isActive !== false && i.type !== 'group').map((i) => toCatalogRow(i, 'Item'));
      return [...products, ...items].filter((r) => r.id);
    },
  });

// Create / edit dialog: discount, free delivery, dates and the product selection
const DirectOfferDialog = ({ open, onOpenChange, offerToEdit }) => {
  const isEdit = !!offerToEdit;
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => initialForm(offerToEdit));
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [onlySelected, setOnlySelected] = useState(false);
  const { data: catalog = [], isLoading } = useCatalog(open);

  const patch = (changes) => setForm((f) => ({ ...f, ...changes }));

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(offerToEdit));
    setQuery('');
    setCategory(ALL_CATEGORIES);
    setOnlySelected(false);
  }, [open, offerToEdit]);

  const selected = useMemo(() => new Set(form.products), [form.products]);
  const categories = useMemo(() => [...new Set(catalog.flatMap((r) => r.categories))].sort(), [catalog]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q)) &&
        (category === ALL_CATEGORIES || r.categories.includes(category)) &&
        (!onlySelected || selected.has(r.id))
    );
  }, [catalog, query, category, onlySelected, selected]);

  const allShownSelected = shown.length > 0 && shown.every((r) => selected.has(r.id));

  const toggle = (id) => patch({ products: selected.has(id) ? form.products.filter((p) => p !== id) : [...form.products, id] });

  const toggleShown = () => {
    const ids = new Set(shown.map((r) => r.id));
    patch({ products: allShownSelected ? form.products.filter((p) => !ids.has(p)) : [...new Set([...form.products, ...ids])] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const discountPercent = parseFloat(form.discountPercent) || 0;
    if (!form.name.trim()) return toast.error('Name is required.');
    if (discountPercent < 0 || discountPercent > 100) return toast.error('Discount must be between 0 and 100%.');
    if (!(discountPercent > 0) && !form.freeDelivery) return toast.error('Give a percentage discount, free delivery, or both.');
    if (form.products.length === 0) return toast.error('Select at least one product.');
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) return toast.error('End date must be after the start date.');

    const body = {
      name: form.name.trim(),
      isActive: form.isActive,
      discountPercent,
      freeDelivery: form.freeDelivery,
      validFrom: form.validFrom ? new Date(`${form.validFrom}T00:00:00`).toISOString() : null,
      validTo: form.validTo ? new Date(`${form.validTo}T23:59:59`).toISOString() : null,
      products: form.products,
    };

    setSaving(true);
    try {
      if (isEdit) await apiClient.put(`/api/v1/direct-offers/${offerToEdit.id}`, body);
      else await apiClient.post('/api/v1/direct-offers', body);
      toast.success(`Direct offer "${body.name}" saved.`);
      queryClient.invalidateQueries({ queryKey: ['direct-offers'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save direct offer.'));
    } finally {
      setSaving(false);
    }
  };

  const label = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';
  const percent = parseFloat(form.discountPercent) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Direct Offer' : 'Create Direct Offer'}</DialogTitle>
          <DialogDescription>
            The selected products show the discounted price on both stores, and any order that contains one of them
            gets free delivery when that is on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="space-y-1">
              <label className={label}>Name</label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Eid Sale" disabled={saving} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className={label}>Active</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => patch({ isActive: v })} disabled={saving} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className={label}>Discount (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="any"
                placeholder="0 = no discount"
                value={form.discountPercent}
                onChange={(e) => patch({ discountPercent: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className={label}>Free delivery</span>
              <Switch checked={form.freeDelivery} onCheckedChange={(v) => patch({ freeDelivery: v })} disabled={saving} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={label}>Starts (optional)</label>
              <Input type="date" value={form.validFrom} onChange={(e) => patch({ validFrom: e.target.value })} disabled={saving} />
            </div>
            <div className="space-y-1">
              <label className={label}>Ends (optional)</label>
              <Input type="date" value={form.validTo} onChange={(e) => patch({ validTo: e.target.value })} disabled={saving} />
            </div>
          </div>

          <div className="space-y-3 border rounded-lg p-3 bg-muted/10">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className={label}>Products ({form.products.length} selected)</span>
              {form.products.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => patch({ products: [] })} disabled={saving}>
                  Clear selection
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" className="pl-8" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={category} onValueChange={(v) => setCategory(v ?? ALL_CATEGORIES)}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" checked={allShownSelected} onChange={toggleShown} disabled={saving || shown.length === 0} />
                Select all shown ({shown.length})
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
                Show selected only
              </label>
            </div>

            <div className="max-h-[320px] overflow-y-auto rounded-md border bg-background divide-y">
              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading products...</p>
              ) : shown.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No products match.</p>
              ) : (
                shown.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" className="rounded border-border" checked={selected.has(r.id)} onChange={() => toggle(r.id)} disabled={saving} />
                    {r.image ? (
                      <img src={r.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.kind}
                        {r.categories.length > 0 ? ` · ${r.categories.join(', ')}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-xs whitespace-nowrap">
                      {percent > 0 && r.price > 0 ? (
                        <>
                          <span className="text-muted-foreground line-through mr-1">৳{r.price}</span>
                          <span className="font-semibold">৳{Math.round(r.price * (1 - Math.min(percent, 100) / 100))}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">৳{r.price}</span>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Direct Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Shows an offer's date window, e.g. "12 Nov – 30 Nov" or "Always"
const describeDates = (o) => {
  const fmt = (v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!o.validFrom && !o.validTo) return 'Always';
  return `${o.validFrom ? fmt(o.validFrom) : '…'} – ${o.validTo ? fmt(o.validTo) : '…'}`;
};

// Direct Offers: a percentage discount and/or free delivery on many selected products at once
const DirectOffersPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['direct-offers'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/direct-offers');
      return res.data?.data ?? [];
    },
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/v1/direct-offers/${toDelete.id}`);
      toast.success('Direct offer deleted.');
      queryClient.invalidateQueries({ queryKey: ['direct-offers'] });
      setToDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete direct offer.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Direct Offers</h2>
          <p className="text-sm text-muted-foreground mt-1">Discount many products at once, or give them free delivery.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="shadow cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Direct Offer
        </Button>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No direct offers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Name</th>
                <th>Products</th>
                <th>Offer</th>
                <th>Dates</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{o.name}</td>
                  <td>{(o.products || []).length}</td>
                  <td>{describeOffer(o)}</td>
                  <td className="whitespace-nowrap">{describeDates(o)}</td>
                  <td>{o.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(o);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(o)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DirectOfferDialog open={dialogOpen} onOpenChange={setDialogOpen} offerToEdit={editing} />

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
        title="Delete direct offer"
        description={`Delete "${toDelete?.name ?? ''}"? This cannot be undone.`}
      />
    </div>
  );
};

export default DirectOffersPage;
