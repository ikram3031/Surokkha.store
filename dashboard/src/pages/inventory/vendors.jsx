import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useVendors, useVendorMutations, taka } from '@/hooks/use-purchases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };

// Add / edit one vendor
const VendorDialog = ({ vendor, onOpenChange, onSave, saving }) => {
  const [form, setForm] = useState(EMPTY);
  const [lastId, setLastId] = useState(null);
  const openKey = vendor ? vendor.id || 'new' : null;
  if (openKey !== lastId) {
    setLastId(openKey);
    setForm(vendor?.id ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, vendor[k] || ''])) } : EMPTY);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={Boolean(vendor)} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vendor?.id ? 'Edit vendor' : 'New vendor'}</DialogTitle>
          <DialogDescription>Saved purchases keep the name and phone they were recorded with.</DialogDescription>
        </DialogHeader>
        <form
          id="vendor-form"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim()) onSave(form);
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Rahim Traders" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={set('address')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={set('notes')} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="vendor-form" disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Vendors stock is bought from, with what each has been bought for and what is still owed
const VendorsPage = () => {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const { data: rows = [], isLoading, isError } = useVendors({ q: q.trim() || undefined });
  const { create, update, remove } = useVendorMutations();

  const save = (body) => {
    const done = { onSuccess: () => setEditing(null) };
    if (editing?.id) update.mutate({ id: editing.id, ...body }, done);
    else create.mutate(body, done);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">Who you buy stock from. Pick them on a purchase; totals and dues come from ordered and received purchases.</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="mr-1.5 h-4 w-4" />New vendor</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All vendors</CardTitle>
            <CardDescription>{rows.length} active</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-56 pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Bought for</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={6} className="py-8 text-center text-red-600">Could not load vendors.</TableCell></TableRow>}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No vendors yet. Add one here or while recording a purchase.</TableCell></TableRow>
              )}
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-semibold">{v.name}</div>
                    {v.address && <div className="text-xs text-muted-foreground">{v.address}</div>}
                  </TableCell>
                  <TableCell>{v.phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    {v.purchaseCount ? <Link className="underline-offset-4 hover:underline" to={`/inventory/purchases?q=${encodeURIComponent(v.name)}`}>{v.purchaseCount}</Link> : 0}
                  </TableCell>
                  <TableCell className="text-right">{taka(v.purchaseTotal)}</TableCell>
                  <TableCell className={`text-right ${v.due > 0 ? 'font-medium text-red-600' : ''}`}>{taka(v.due)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Remove" className="text-destructive hover:text-destructive" onClick={() => setRemoving(v)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VendorDialog vendor={editing} onOpenChange={() => setEditing(null)} onSave={save} saving={create.isPending || update.isPending} />

      <Dialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>The vendor is hidden from the list. Purchases already recorded with them stay as they are.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Keep</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })}>
              {remove.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorsPage;
