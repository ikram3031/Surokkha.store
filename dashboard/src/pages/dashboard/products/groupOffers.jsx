import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
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
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

const EMPTY_DISCOUNT = { discountType: 'percentage', discountValue: '' };

// Hard-coded product names (not in the catalog); one click adds the name, then set its price per piece
const PRESET_PRODUCTS = [
  'MO ULTRA RIBBED',
  'MO ULTRA THIN',
  'DUREX BUBBLEGUM',
  'DUREX EXTRA TIME',
  'SKORE NOTOUT',
  'MO DOTTED PLEASURE',
];

const initialForm = (offer) =>
  offer
    ? {
        name: offer.name || '',
        slug: offer.slug || '',
        description: offer.description || '',
        isActive: offer.isActive !== false,
        products: (offer.products || []).map((p) => ({
          name: p.name || '',
          unitPrice: String(p.unitPrice ?? ''),
          imageUrl: p.imageUrl || '',
        })),
        minOrderAmount: String(offer.minOrderAmount ?? 250),
        minPerProduct: String(offer.minPerProduct ?? 2),
        pricingMode: offer.pricingMode || 'fixed',
        fixedDiscount: {
          discountType: offer.fixedDiscount?.discountType || 'percentage',
          discountValue: String(offer.fixedDiscount?.discountValue ?? ''),
        },
        conditions: (offer.conditions || []).map((c) => ({
          minOrderAmount: String(c.minOrderAmount),
          discountType: c.discountType,
          discountValue: String(c.discountValue),
        })),
      }
    : {
        name: '',
        slug: '',
        description: '',
        isActive: true,
        products: [],
        minOrderAmount: '250',
        minPerProduct: '2',
        pricingMode: 'fixed',
        fixedDiscount: { ...EMPTY_DISCOUNT },
        conditions: [],
      };

const describeDiscount = (d) =>
  d.discountType === 'percentage' ? `${d.discountValue}% off` : `৳${d.discountValue} off`;

// A discount value + type pair, shared by the "fixed" row and every condition row
function DiscountFields({ value, onChange, disabled }) {
  return (
    <>
      <Select value={value.discountType} onValueChange={(v) => onChange({ ...value, discountType: v })} disabled={disabled}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="percentage">Percentage (%)</SelectItem>
          <SelectItem value="fixed">Fixed (৳)</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        step="any"
        min="0"
        placeholder="Value"
        className="w-[110px]"
        value={value.discountValue}
        onChange={(e) => onChange({ ...value, discountValue: e.target.value })}
        disabled={disabled}
      />
    </>
  );
}

function GroupOfferDialog({ open, onOpenChange, offerToEdit }) {
  const isEdit = !!offerToEdit;
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => initialForm(offerToEdit));
  const [saving, setSaving] = useState(false);

  const patch = (changes) => setForm((f) => ({ ...f, ...changes }));

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(offerToEdit));
  }, [open, offerToEdit]);

  const hasProduct = (name) => form.products.some((p) => p.name.trim().toLowerCase() === name.toLowerCase());
  const addProduct = (name = '') => patch({ products: [...form.products, { name, unitPrice: '', imageUrl: '' }] });
  const setProduct = (i, value) => patch({ products: form.products.map((p, idx) => (idx === i ? { ...p, ...value } : p)) });
  const removeProduct = (i) => patch({ products: form.products.filter((_, idx) => idx !== i) });

  const setCondition = (i, value) => patch({ conditions: form.conditions.map((c, idx) => (idx === i ? { ...c, ...value } : c)) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required.');
    const products = form.products
      .map((p) => ({ name: p.name.trim(), unitPrice: parseFloat(p.unitPrice), imageUrl: p.imageUrl.trim() }))
      .filter((p) => p.name);
    if (products.length < 2) return toast.error('Add at least 2 products.');
    if (products.some((p) => !(p.unitPrice > 0))) return toast.error('Every product needs a price per piece.');

    const discounts = form.pricingMode === 'fixed' ? [form.fixedDiscount] : form.conditions;
    if (form.pricingMode === 'conditional' && discounts.length === 0) return toast.error('Add at least one condition.');
    for (const d of discounts) {
      const v = parseFloat(d.discountValue);
      if (isNaN(v) || v <= 0) return toast.error('Every discount needs a value greater than 0.');
      if (d.discountType === 'percentage' && v > 100) return toast.error('Percentage discount cannot exceed 100%.');
    }
    if (form.pricingMode === 'conditional' && form.conditions.some((c) => isNaN(parseFloat(c.minOrderAmount))))
      return toast.error('Every condition needs a minimum order amount.');

    const body = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      isActive: form.isActive,
      products,
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      minPerProduct: parseInt(form.minPerProduct, 10) || 2,
      pricingMode: form.pricingMode,
      fixedDiscount: { ...form.fixedDiscount, discountValue: parseFloat(form.fixedDiscount.discountValue) || 0 },
      conditions: form.conditions.map((c) => ({
        minOrderAmount: parseFloat(c.minOrderAmount) || 0,
        discountType: c.discountType,
        discountValue: parseFloat(c.discountValue) || 0,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) await apiClient.put(`/api/v1/group-offers/${offerToEdit.id}`, body);
      else await apiClient.post('/api/v1/group-offers', body);
      toast.success(`Group offer "${body.name}" saved.`);
      queryClient.invalidateQueries({ queryKey: ['group-offers'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save group offer.'));
    } finally {
      setSaving(false);
    }
  };

  const label = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Group Offer' : 'Create Group Offer'}</DialogTitle>
          <DialogDescription>
            Customers pick pieces from the selected products. A picked product starts at the minimum pieces and
            grows by 1.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={label}>Name</label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Mix & Match Condoms" disabled={saving} />
            </div>
            <div className="space-y-1">
              <label className={label}>Slug (optional)</label>
              <Input value={form.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="auto from name" disabled={saving} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={label}>Description</label>
            <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} disabled={saving} />
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className={label}>Min order amount (৳)</label>
              <Input type="number" min="0" value={form.minOrderAmount} onChange={(e) => patch({ minOrderAmount: e.target.value })} disabled={saving} />
            </div>
            <div className="space-y-1">
              <label className={label}>Min pieces per product</label>
              <Input type="number" min="1" value={form.minPerProduct} onChange={(e) => patch({ minPerProduct: e.target.value })} disabled={saving} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className={label}>Active</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => patch({ isActive: v })} disabled={saving} />
            </div>
          </div>

          {/* Products */}
          <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
            <span className={`${label} block border-b pb-1`}>Products ({form.products.length} added)</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PRODUCTS.map((name) => (
                <Button key={name} type="button" variant="outline" size="sm" disabled={saving || hasProduct(name)} onClick={() => addProduct(name)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> {name}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {form.products.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="flex-1" placeholder="Product name" value={p.name} onChange={(e) => setProduct(i, { name: e.target.value })} disabled={saving} />
                  <Input type="number" min="0" step="any" className="w-[130px]" placeholder="৳ / piece" value={p.unitPrice} onChange={(e) => setProduct(i, { unitPrice: e.target.value })} disabled={saving} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)} disabled={saving}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.products.length === 0 && <span className="text-[10px] text-muted-foreground block text-center">Add a name above or type your own</span>}
              <Button type="button" variant="outline" size="sm" onClick={() => addProduct()} disabled={saving}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add product manually
              </Button>
            </div>
          </div>

          {/* Offer: Fixed Discount / Conditional */}
          <div className="space-y-3 border rounded-lg p-3">
            <span className={`${label} block`}>Offer</span>
            <div className="flex gap-6">
              {[
                ['fixed', 'Fixed Discount'],
                ['conditional', 'Conditional'],
              ].map(([value, text]) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.pricingMode === value} onChange={() => patch({ pricingMode: value })} className="rounded border-border" disabled={saving} />
                  {text}
                </label>
              ))}
            </div>

            {form.pricingMode === 'fixed' ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Discount</span>
                <DiscountFields value={form.fixedDiscount} onChange={(v) => patch({ fixedDiscount: v })} disabled={saving} />
              </div>
            ) : (
              <div className="space-y-2">
                {form.conditions.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/30 p-2">
                    <span className="text-sm text-muted-foreground">Min order amount</span>
                    <Input type="number" min="0" className="w-[110px]" value={c.minOrderAmount} onChange={(e) => setCondition(i, { minOrderAmount: e.target.value })} disabled={saving} />
                    <span className="text-sm text-muted-foreground">Discount</span>
                    <DiscountFields value={c} onChange={(v) => setCondition(i, v)} disabled={saving} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => patch({ conditions: form.conditions.filter((_, idx) => idx !== i) })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => patch({ conditions: [...form.conditions, { minOrderAmount: '', ...EMPTY_DISCOUNT }] })} disabled={saving}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add new condition
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="cancel" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Group Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Group Offers: pick-your-own piece bundles with fixed or order-amount-conditional discounts
const GroupOffersPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['group-offers'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/group-offers');
      return res.data?.data ?? [];
    },
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/v1/group-offers/${toDelete.id}`);
      toast.success('Group offer deleted.');
      queryClient.invalidateQueries({ queryKey: ['group-offers'] });
      setToDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete group offer.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Group Offers</h2>
          <p className="text-sm text-muted-foreground mt-1">Bundle products by the piece and discount the whole group.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="shadow cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Group Offer
        </Button>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No group offers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Name</th>
                <th>Products</th>
                <th>Min order</th>
                <th>Offer</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">
                    {o.name}
                    <div className="text-xs font-normal text-muted-foreground">/group-offer/{o.slug}</div>
                  </td>
                  <td>{(o.products || []).length}</td>
                  <td>৳{o.minOrderAmount}</td>
                  <td>
                    {o.pricingMode === 'fixed'
                      ? describeDiscount(o.fixedDiscount || {})
                      : (o.conditions || []).map((c) => `≥৳${c.minOrderAmount}: ${describeDiscount(c)}`).join(' · ')}
                  </td>
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

      <GroupOfferDialog open={dialogOpen} onOpenChange={setDialogOpen} offerToEdit={editing} />

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={deleting}
        title="Delete group offer"
        description={`Delete "${toDelete?.name ?? ''}"? This cannot be undone.`}
      />
    </div>
  );
};

export default GroupOffersPage;
