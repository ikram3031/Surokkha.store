import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Package, AlertTriangle, Wallet, Plus, Pencil, SlidersHorizontal, Search, Trash2, History } from 'lucide-react';

import { useStockItems, useStockItemMutations } from '@/hooks/use-stock-items';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ACTION_BTN = 'bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

const STATUS_FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'low', label: 'Low stock' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'all', label: 'All' },
];

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'pcs (single piece)' },
  { value: 'pair', label: 'pair' },
  { value: 'ml', label: 'ml' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'litre', label: 'litre' },
  { value: 'meter', label: 'meter' },
];

const ADJUST_MODES = [
  { value: 'add', label: 'Add' },
  { value: 'remove', label: 'Remove' },
  { value: 'set', label: 'Set exact count' },
];

const money = (v) => `৳${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Shows pieces as the biggest pack plus loose pieces, e.g. 53 pcs → "5 Packet + 3 pcs"
export const packBreakdown = (quantity, packs = [], unit = 'pcs') => {
  const big = [...packs].filter((p) => p.unitsPerPack > 1 && p.unitsPerPack <= quantity).sort((a, b) => b.unitsPerPack - a.unitsPerPack)[0];
  if (!big || quantity <= 0) return '';
  const full = Math.floor(quantity / big.unitsPerPack);
  const loose = quantity % big.unitsPerPack;
  if (!full) return '';
  return `${full} ${big.label}${loose ? ` + ${loose} ${unit}` : ''}`;
};

const EMPTY_FORM = { shortName: '', name: '', unit: 'pcs', reorderLevel: 0, notes: '', isActive: true, packs: [{ label: 'Packet', unitsPerPack: 10 }], openingQuantity: 0, openingCost: 0 };

// Add / edit dialog for one stock item, including its pack sizes
const ItemDialog = ({ open, onOpenChange, item, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastKey, setLastKey] = useState(null);
  const key = open ? item?.id || 'new' : null;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setForm(
        item
          ? { ...EMPTY_FORM, ...item, unit: UNIT_OPTIONS.some((u) => u.value === item.unit) ? item.unit : 'pcs', packs: item.packs?.length ? item.packs : [] }
          : EMPTY_FORM
      );
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setPack = (i, k, v) => setForm((f) => ({ ...f, packs: f.packs.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)) }));
  const addPack = () => setForm((f) => ({ ...f, packs: [...f.packs, { label: '', unitsPerPack: '' }] }));
  const removePack = (i) => setForm((f) => ({ ...f, packs: f.packs.filter((_, idx) => idx !== i) }));

  const submit = (e) => {
    e.preventDefault();
    const body = {
      shortName: form.shortName,
      name: form.name,
      unit: form.unit,
      reorderLevel: Number(form.reorderLevel) || 0,
      notes: form.notes,
      isActive: form.isActive,
      packs: form.packs.map((p) => ({ label: p.label, unitsPerPack: Number(p.unitsPerPack) })),
    };
    if (!item) {
      body.openingQuantity = Number(form.openingQuantity) || 0;
      body.openingCost = Number(form.openingCost) || 0;
    }
    onSave(body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{item ? `Edit ${item.shortName}` : 'New stock item'}</DialogTitle>
            <DialogDescription>Stock is always counted in single units. Pack sizes tell purchases how many units one pack adds.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Short name *</Label>
              <Input value={form.shortName} onChange={(e) => set('shortName', e.target.value.toUpperCase())} placeholder="MO" maxLength={40} required />
            </div>
            <div className="space-y-1.5">
              <Label>Counted in</Label>
              <Select value={UNIT_OPTIONS.some((u) => u.value === form.unit) ? form.unit : 'pcs'} onValueChange={(v) => set('unit', v)} items={UNIT_OPTIONS}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{UNIT_OPTIONS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Medicated oil 10ml" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pack sizes</Label>
              <Button type="button" size="sm" variant="outline" onClick={addPack}><Plus className="mr-1 h-3.5 w-3.5" />Add size</Button>
            </div>
            {form.packs.length === 0 && <p className="text-xs text-muted-foreground">No pack sizes: purchases will be entered in single units.</p>}
            {form.packs.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="flex-1" value={p.label} onChange={(e) => setPack(i, 'label', e.target.value)} placeholder="Packet / Box / Carton" />
                <span className="text-sm text-muted-foreground">=</span>
                <Input className="w-24" type="number" min={1} step={1} value={p.unitsPerPack} onChange={(e) => setPack(i, 'unitsPerPack', e.target.value)} />
                <span className="w-10 text-sm text-muted-foreground">{form.unit || 'pcs'}</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => removePack(i)} aria-label="Remove pack size"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Low stock at ({form.unit || 'pcs'})</Label>
              <Input type="number" min={0} value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} />
            </div>
            {item ? (
              <div className="flex items-end gap-2 pb-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} id="si-active" />
                <Label htmlFor="si-active">Active</Label>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Opening stock ({form.unit || 'pcs'})</Label>
                <Input type="number" min={0} value={form.openingQuantity} onChange={(e) => set('openingQuantity', e.target.value)} />
              </div>
            )}
            {!item && Number(form.openingQuantity) > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label>Opening cost per {form.unit || 'pcs'} (optional)</Label>
                <Input type="number" min={0} step="0.01" value={form.openingCost} onChange={(e) => set('openingCost', e.target.value)} />
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className={ACTION_BTN} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Manual stock correction for one item (damage, found, recount)
const AdjustDialog = ({ item, onOpenChange, onSave, saving }) => {
  const [mode, setMode] = useState('add');
  const [packIdx, setPackIdx] = useState('unit');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const unit = item?.unit || 'pcs';
  const per = packIdx === 'unit' ? 1 : Number(item?.packs?.[Number(packIdx)]?.unitsPerPack) || 1;
  const units = Math.round((Number(qty) || 0) * per);

  const close = (v) => {
    if (!v) { setMode('add'); setPackIdx('unit'); setQty(''); setNote(''); }
    onOpenChange(v);
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust {item?.shortName}</DialogTitle>
          <DialogDescription>Now in stock: {item?.quantity ?? 0} {unit}. Purchases come in from Plexivia automatically; use this for damage, loss or a recount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={mode} onValueChange={setMode} items={ADJUST_MODES}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="remove">Remove</SelectItem>
              <SelectItem value="set">Set exact count</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" className="flex-1" />
            {mode !== 'set' && item?.packs?.length > 0 && (
              <Select value={packIdx} onValueChange={setPackIdx} items={[{ value: 'unit', label: unit }, ...item.packs.map((p, i) => ({ value: String(i), label: `${p.label} (${p.unitsPerPack})` }))]}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">{unit}</SelectItem>
                  {item.packs.map((p, i) => <SelectItem key={i} value={String(i)}>{p.label} ({p.unitsPerPack})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          {mode !== 'set' && per > 1 && <p className="text-xs text-muted-foreground">= {units} {unit}</p>}
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" maxLength={300} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button
            className={ACTION_BTN}
            disabled={saving || qty === '' || (mode !== 'set' && units <= 0)}
            onClick={() => onSave({ id: item.id, mode, quantity: mode === 'set' ? Math.round(Number(qty) || 0) : units, note }, () => close(false))}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Small figure card at the top of the page
const StatCard = ({ icon: Icon, label, value, tone = '' }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="rounded-md bg-muted p-2"><Icon className={`h-5 w-5 ${tone}`} /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// Inventory workspace home: unit-level stock items
const StockItemsPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const params = useMemo(() => ({ search: search.trim() || undefined, status }), [search, status]);
  const { data, isLoading, isError } = useStockItems(params);
  const { create, update, adjust } = useStockItemMutations();
  const rows = data?.data || [];
  const summary = data?.summary || {};

  const save = (body) => {
    const done = { onSuccess: () => setEditing(null) };
    if (editing?.item) update.mutate({ id: editing.item.id, ...body }, done);
    else create.mutate(body, done);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stock Items</h1>
          <p className="text-sm text-muted-foreground">What you actually hold, counted in single units. Purchases recorded in Plexivia add here automatically.</p>
        </div>
        <Button className={ACTION_BTN} onClick={() => setEditing({ item: null })}><Plus className="mr-1.5 h-4 w-4" />New stock item</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Active items" value={summary.items ?? 0} />
        <StatCard icon={Package} label="Units on hand" value={Number(summary.units || 0).toLocaleString('en-US')} />
        <StatCard icon={Wallet} label="Stock value (avg cost)" value={money(summary.value)} />
        <StatCard icon={AlertTriangle} label="Low stock" value={summary.low ?? 0} tone={summary.low ? 'text-amber-600' : ''} />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>{rows.length} shown</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-56 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search short name / name" />
            </div>
            <Select value={status} onValueChange={setStatus} items={STATUS_FILTERS.map((s) => ({ value: s.key, label: s.label }))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_FILTERS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short name</TableHead>
                <TableHead>Pack sizes</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">Avg cost</TableHead>
                <TableHead className="text-right">Last cost</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={7} className="py-8 text-center text-red-600">Could not load stock items.</TableCell></TableRow>}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No stock items yet. Add one, e.g. short name MO with a Packet of 10.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id} className={r.isActive ? '' : 'opacity-60'}>
                  <TableCell>
                    <div className="font-semibold">{r.shortName}</div>
                    {r.name && <div className="text-xs text-muted-foreground">{r.name}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.packs.length ? r.packs.map((p) => `${p.label} = ${p.unitsPerPack}`).join(', ') : <span className="text-muted-foreground">units only</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.isActive && r.isLow && <Badge variant="outline" className="border-amber-500 text-amber-600">Low</Badge>}
                      <span className={`font-semibold ${r.quantity < 0 ? 'text-red-600' : ''}`}>{r.quantity} {r.unit}</span>
                    </div>
                    {packBreakdown(r.quantity, r.packs, r.unit) && <div className="text-xs text-muted-foreground">{packBreakdown(r.quantity, r.packs, r.unit)}</div>}
                  </TableCell>
                  <TableCell className="text-right">{money(r.avgCost)}</TableCell>
                  <TableCell className="text-right">{money(r.lastCost)}</TableCell>
                  <TableCell className="text-right">{money(r.stockValue)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Adjust stock" onClick={() => setAdjusting(r)}><SlidersHorizontal className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="History" render={<Link to={`/inventory/movements?refId=${r.id}&name=${encodeURIComponent(r.shortName)}`} />}><History className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing({ item: r })}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ItemDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        item={editing?.item || null}
        onSave={save}
        saving={create.isPending || update.isPending}
      />
      <AdjustDialog
        item={adjusting}
        onOpenChange={(v) => !v && setAdjusting(null)}
        onSave={(body, done) => adjust.mutate(body, { onSuccess: () => { done(); setAdjusting(null); } })}
        saving={adjust.isPending}
      />
    </div>
  );
};

export default StockItemsPage;
