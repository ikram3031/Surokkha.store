import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import { useStockItemMovements, useStockItemMutations } from '@/hooks/use-stock-items';
import { UndoMovementButton } from '@/components/dashboard/inventory/stockCount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MOVEMENT_LABELS = {
  purchase_receive: { label: 'Purchase received', tone: 'text-emerald-600' },
  purchase_adjust: { label: 'Purchase corrected', tone: 'text-sky-600' },
  purchase_cancel: { label: 'Purchase cancelled', tone: 'text-red-600' },
  manual_add: { label: 'Added by hand', tone: 'text-emerald-600' },
  manual_remove: { label: 'Removed by hand', tone: 'text-red-600' },
  manual_set: { label: 'Recount', tone: 'text-sky-600' },
  manual_undo: { label: 'Undo', tone: 'text-muted-foreground' },
};

const TYPE_ITEMS = [{ value: 'all', label: 'All changes' }, ...Object.entries(MOVEMENT_LABELS).map(([value, v]) => ({ value, label: v.label }))];

const fmt = (v) => (v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

// Every change to stock-item quantities, newest first
const StockMovementsPage = () => {
  const [params, setParams] = useSearchParams();
  const refId = params.get('refId') || undefined;
  const refName = params.get('name') || '';
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const query = useMemo(
    () => ({ page, limit: 50, refId, q: q.trim() || undefined, type: type === 'all' ? undefined : type }),
    [page, refId, q, type]
  );
  const { data, isLoading, isError } = useStockItemMovements(query);
  const rows = data?.data || [];
  const pg = data?.pagination;
  const { undo } = useStockItemMutations();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Stock History</h1>
        <p className="text-sm text-muted-foreground">Purchases from Plexivia and manual corrections, one line per change.</p>
      </div>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Movements</CardTitle>
            <CardDescription>
              {pg?.total ?? 0} total
              {refId && (
                <span className="ml-2 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                  {refName || 'One item'}
                  <button type="button" aria-label="Show all items" onClick={() => { setParams({}); setPage(1); }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-56 pl-8" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Item, note or purchase ref" />
            </div>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }} items={TYPE_ITEMS}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All changes</SelectItem>
                {Object.entries(MOVEMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Before → After</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>By</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={8} className="py-8 text-center text-red-600">Could not load the history.</TableCell></TableRow>}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No stock changes yet.</TableCell></TableRow>
              )}
              {rows.map((r) => {
                const meta = MOVEMENT_LABELS[r.type] || { label: r.type, tone: '' };
                const purchaseNo = (r.note || '').split(' · ')[0].replace(/ cancelled$/, '');
                return (
                  <TableRow key={r.id} className={r.undoneAt ? 'opacity-60' : ''}>
                    <TableCell className="whitespace-nowrap text-sm">{fmt(r.createdAt)}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className={meta.tone}>{meta.label}</TableCell>
                    <TableCell className={`text-right font-semibold ${r.delta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {r.delta > 0 ? `+${r.delta}` : r.delta}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{r.before} → {r.after}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm" title={r.note}>
                      {r.externalRef ? (
                        <Link className="underline-offset-2 hover:underline" to={`/inventory/receipts?q=${encodeURIComponent(purchaseNo)}`}>
                          {r.note || r.externalRef}
                        </Link>
                      ) : (
                        r.note
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.createdBy}
                      {r.undoneAt && <div className="text-[11px]">Undone by {r.undoneBy || 'staff'}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <UndoMovementButton movement={r} onUndo={(m) => undo.mutateAsync(m.id)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {pg && pg.pages > 1 && (
            <div className="flex items-center justify-end gap-2 py-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pg.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pg.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementsPage;
