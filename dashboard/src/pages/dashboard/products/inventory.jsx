import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Boxes, Search, Package, AlertTriangle, CheckCircle2, XCircle, SlidersHorizontal, History, Wallet,
} from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const TABS = [
  { key: 'stock', label: 'Stock', icon: Boxes },
  { key: 'history', label: 'History', icon: History },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
];

const MOVEMENT_LABELS = {
  order_deduct: { label: 'Order', tone: 'text-red-600' },
  order_release: { label: 'Order cancelled', tone: 'text-emerald-600' },
  return_restock: { label: 'Order returned', tone: 'text-emerald-600' },
  manual_add: { label: 'Stock added', tone: 'text-emerald-600' },
  manual_remove: { label: 'Stock removed', tone: 'text-red-600' },
  manual_set: { label: 'Stock set', tone: 'text-sky-600' },
  edit: { label: 'Edited on product', tone: 'text-sky-600' },
};

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;
const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const detailPath = (row) => (row.entity === 'item' ? `/dashboard/items/${row.id}` : `/dashboard/products/${row.id}`);

const Pager = ({ pagination, page, setPage }) =>
  pagination && pagination.totalPages > 1 ? (
    <div className="flex items-center justify-end gap-2 py-4">
      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pagination.totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
        disabled={page === pagination.totalPages}
      >
        Next
      </Button>
    </div>
  ) : null;

const StockBadge = ({ amount, threshold }) => {
  if (amount <= 0) {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px]">
        <XCircle className="h-3 w-3" /> Out of stock
      </Badge>
    );
  }
  if (amount < threshold) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-amber-500 text-amber-500">
        <AlertTriangle className="h-3 w-3" /> Low stock
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500 text-emerald-500">
      <CheckCircle2 className="h-3 w-3" /> In stock
    </Badge>
  );
};

const AdjustDialog = ({ row, onClose, onSaved }) => {
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/v1/inventory/adjust', {
        entity: row.entity,
        id: row.id,
        mode,
        quantity: Number(quantity),
        note,
      });
    },
    onSuccess: () => {
      toast.success('Stock updated');
      onSaved();
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update stock'),
  });

  if (!row) return null;

  const qty = Number(quantity) || 0;
  const preview =
    mode === 'add' ? row.stockAmount + qty : mode === 'remove' ? Math.max(0, row.stockAmount - qty) : qty;

  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{row.name}</DialogTitle>
          <DialogDescription>Current stock: {row.stockAmount}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['add', 'Add'],
              ['remove', 'Remove'],
              ['set', 'Set exact'],
            ].map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={mode === key ? 'default' : 'outline'}
                onClick={() => setMode(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder={mode === 'set' ? 'New stock quantity' : 'Quantity'}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input placeholder="Note (e.g. new purchase, damaged)" value={note} onChange={(e) => setNote(e.target.value)} />
          {quantity !== '' && (
            <p className="text-sm text-muted-foreground">
              {row.stockAmount} → <span className="font-semibold text-foreground">{preview}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || quantity === ''}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StockTab = ({ onSummary }) => {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState('product');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [threshold, setThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory', entity, status, q, threshold, page],
    queryFn: async () => {
      const params = new URLSearchParams({ entity, status, threshold: String(threshold), page: String(page), limit: '25' });
      if (q) params.set('search', q);
      const res = await apiClient.get(`/api/v1/inventory?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const rows = data?.data || [];
  const summary = data?.summary;
  useEffect(() => {
    if (summary) onSummary(summary, entity);
  }, [summary, entity, onSummary]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-history'] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ['product', 'Products'],
              ['item', 'Items'],
            ].map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={entity === key ? 'default' : 'outline'}
                onClick={() => {
                  setEntity(key);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            ))}
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v ?? 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.key} value={f.key} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Low below
              <Input
                type="number"
                min="1"
                className="h-8 w-16 text-xs"
                value={threshold}
                onChange={(e) => {
                  setThreshold(Math.max(1, Number(e.target.value) || 1));
                  setPage(1);
                }}
              />
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQ(search.trim());
            }}
            className="flex gap-2"
          >
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or SKU..."
              className="w-full lg:w-64"
            />
            <Button type="submit" size="icon" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">On open orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[110px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-red-500">Error loading inventory.</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nothing found.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          {row.imageUrl ? (
                            <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={detailPath(row)} className="font-medium hover:underline line-clamp-1">
                            {row.name}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">{row.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.offerPrice != null && row.offerPrice < row.price ? formatMoney(row.offerPrice) : formatMoney(row.price)}
                    </TableCell>
                    <TableCell className="text-right text-base font-bold">{row.stockAmount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.committed || '-'}</TableCell>
                    <TableCell>
                      <StockBadge amount={row.stockAmount} threshold={summary?.threshold ?? threshold} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdjusting(row)}>
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {summary?.variantProductsSkipped > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {summary.variantProductsSkipped} variant {entity === 'item' ? 'items' : 'products'} are not tracked here; stock is only kept for simple products.
          </p>
        )}
        <Pager pagination={data?.pagination} page={page} setPage={setPage} />
      </CardContent>
      <AdjustDialog row={adjusting} onClose={() => setAdjusting(null)} onSaved={refresh} />
    </Card>
  );
};

const HistoryTab = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-history', page, q],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (q) params.set('q', q);
      return (await apiClient.get(`/api/v1/inventory/movements?${params.toString()}`)).data;
    },
    keepPreviousData: true,
  });
  const rows = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
          className="flex gap-2"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product, order number or note..."
            className="w-full md:w-72"
          />
          <Button type="submit" size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No stock changes yet.</TableCell>
                </TableRow>
              ) : (
                rows.map((m) => {
                  const meta = MOVEMENT_LABELS[m.type] || { label: m.type, tone: '' };
                                  return (
                    <TableRow key={m._id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{m.name}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${meta.tone}`}>{meta.label}</span>
                        {m.note ? <div className="text-[11px] text-muted-foreground">{m.note}</div> : null}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${m.delta > 0 ? 'text-emerald-600' : m.delta < 0 ? 'text-red-600' : ''}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {m.before} → {m.after}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{m.orderNumber || '-'}</TableCell>
                      <TableCell className="text-xs">{m.createdBy}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <Pager pagination={data?.pagination} page={page} setPage={setPage} />
      </CardContent>
    </Card>
  );
};

// Inventory view: stock levels, staff adjustments, returned goods and the full stock history
export default function InventoryPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('stock');
  const [summaryState, setSummaryState] = useState({ summary: null, entity: 'product' });

  const handleSummary = useCallback((summary, entity) => setSummaryState({ summary, entity }), []);

  const { summary, entity } = summaryState;
  const cards = [
    { label: entity === 'item' ? 'Items' : 'Products', value: summary?.total, icon: Package },
    { label: 'In stock', value: summary?.inStock, icon: CheckCircle2, tone: 'text-emerald-600' },
    { label: 'Low stock', value: summary?.low, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Out of stock', value: summary?.out, icon: XCircle, tone: 'text-red-600' },
    { label: 'Units on hand', value: summary?.units, icon: Boxes },
    { label: 'Stock value', value: summary ? formatMoney(summary.value) : undefined, icon: Wallet },
  ];

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Boxes className="h-8 w-8" />
          {t('nav.inventory', 'Inventory')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Stock goes down when an order is placed, comes back when it is cancelled, marked fake or returned.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <c.icon className={`h-3.5 w-3.5 ${c.tone || ''}`} />
                {c.label}
              </CardDescription>
              <CardTitle className="text-2xl">{c.value ?? '-'}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {TABS.map((tb) => (
          <Button key={tb.key} size="sm" variant={tab === tb.key ? 'default' : 'outline'} className="gap-1.5" onClick={() => setTab(tb.key)}>
            <tb.icon className="h-4 w-4" />
            {tb.label}
          </Button>
        ))}
      </div>

      {tab === 'stock' && <StockTab onSummary={handleSummary} />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}
