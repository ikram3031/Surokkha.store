import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Plus, Link2, Pencil } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { StockItemPicker, StockQtyInput } from '@/components/dashboard/inventory/StockItemPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACTION_BTN = 'bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

const LINK_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unlinked', label: 'Not linked' },
  { value: 'linked', label: 'Linked' },
];

const COPY = {
  product: { title: 'Products', single: 'Product', add: '/dashboard/products/new', edit: (id) => `/dashboard/products/${id}`, noun: 'product' },
  item: { title: 'Items', single: 'Item', add: '/dashboard/items/new', edit: (id) => `/dashboard/items/${id}`, noun: 'item' },
};

// Stock left for a linked piece, shown next to the picker
const StockHint = ({ piece }) => {
  if (!piece) return <span className="text-xs text-muted-foreground">Stock not tracked</span>;
  const qty = Number(piece.quantity || 0);
  return <span className={`text-xs ${qty <= 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{qty} {piece.unit || 'pcs'} in stock</span>;
};

// One catalog row: a picker for a simple product, one picker per variation for a variable product
const LinkRow = ({ row, entity, onSave, saving }) => (
  <TableRow>
    <TableCell className="align-top">
      <div className="flex items-center gap-3">
        {row.image ? <img src={row.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" /> : <div className="h-10 w-10 shrink-0 rounded bg-muted" />}
        <div className="min-w-0">
          <div className="font-medium">{row.name}</div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <Badge variant="outline">{row.type === 'variant' ? 'Variable' : 'Simple'}</Badge>
            {!row.isActive && <Badge variant="outline">Hidden</Badge>}
            {row.stockStatus === 'outofstock' && <Badge variant="outline" className="text-red-600">Out of stock</Badge>}
          </div>
        </div>
      </div>
    </TableCell>
    <TableCell className="align-top">
      {row.type === 'variant' ? (
        <div className="space-y-2">
          {row.variants.length === 0 && <span className="text-xs text-muted-foreground">No variations</span>}
          {row.variants.map((v) => (
            <div key={v.size} className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm">{v.size}</span>
              <StockItemPicker
                className="w-72"
                value={v.stockItem?.id || null}
                disabled={saving}
                onChange={(id) => onSave(row, { variants: [{ size: v.size, stockItem: id }] })}
              />
              <StockHint piece={v.stockItem} />
              <StockQtyInput stockItemId={v.stockItem?.id || null} value={v.stockQty} disabled={saving} onCommit={(n) => onSave(row, { variants: [{ size: v.size, stockQty: n }] })} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <StockItemPicker className="w-72" value={row.stockItem?.id || null} disabled={saving} onChange={(id) => onSave(row, { stockItem: id })} />
          <StockHint piece={row.stockItem} />
          <StockQtyInput stockItemId={row.stockItem?.id || null} value={row.stockQty} disabled={saving} onCommit={(n) => onSave(row, { stockQty: n })} />
        </div>
      )}
    </TableCell>
    <TableCell className="text-right align-top">
      <Button variant="ghost" size="icon" nativeButton={false} render={<Link to={COPY[entity].edit(row.id)} />} title="Edit"><Pencil className="h-4 w-4" /></Button>
    </TableCell>
  </TableRow>
);

// Inventory → Products / Items: link every product (or each variation) to the inventory piece it sells
export default function CatalogLinks({ entity = 'product' }) {
  const copy = COPY[entity];
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [link, setLink] = useState('all');
  const params = { entity, search, link };

  const { data, isLoading } = useQuery({
    queryKey: ['stock-links', params],
    queryFn: async () => (await apiClient.get('/api/v1/stock-items/catalog', { params })).data,
    staleTime: 10000,
  });
  const rows = data?.data || [];
  const summary = data?.summary || {};

  const save = useMutation({
    mutationFn: ({ row, body }) => apiClient.put(`/api/v1/stock-items/catalog/${entity}/${row.id}`, body),
    onSuccess: () => {
      toast.success('Inventory link saved');
      qc.invalidateQueries({ queryKey: ['stock-links'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Could not save the link'),
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">Link each {copy.noun} (or each variation) to the inventory piece it sells. Orders take stock only from linked {copy.noun}s; the rest are not tracked.</p>
        </div>
        <Button className={ACTION_BTN} nativeButton={false} render={<Link to={copy.add} />}><Plus className="mr-1.5 h-4 w-4" />Add {copy.noun}</Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" />Inventory links</CardTitle>
            <CardDescription>{summary.linked ?? 0} of {summary.total ?? 0} linked</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-56 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${copy.noun}s`} />
            </div>
            <Select value={link} onValueChange={setLink} items={LINK_FILTERS}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{LINK_FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.single}</TableHead>
                <TableHead>Inventory item</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Nothing found.</TableCell></TableRow>}
              {rows.map((row) => <LinkRow key={row.id} row={row} entity={entity} saving={save.isPending} onSave={(r, body) => save.mutate({ row: r, body })} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
