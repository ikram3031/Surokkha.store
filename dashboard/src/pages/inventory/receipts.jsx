import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

import { useStockReceipts } from '@/hooks/use-stock-items';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const money = (v) => `৳${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '-');

// Line breakdown shown when a purchase row is opened
const ReceiptLines = ({ receipt }) => (
  <>
    <table className="w-full text-sm">
      <thead className="text-muted-foreground">
        <tr>
          <th className="py-1 text-left font-normal">Item</th>
          <th className="text-right font-normal">Packs</th>
          <th className="text-right font-normal">Units</th>
          <th className="text-right font-normal">Unit cost</th>
          <th className="text-right font-normal">Total</th>
        </tr>
      </thead>
      <tbody>
        {receipt.lines.map((l, i) => (
          <tr key={i}>
            <td className="py-1 font-medium">{l.shortName}</td>
            <td className="text-right">{l.unitsPerPack > 1 ? `${l.packs} × ${l.packLabel || 'pack'} (${l.unitsPerPack})` : '-'}</td>
            <td className="text-right">{l.units}</td>
            <td className="text-right">{money(l.unitCost)}</td>
            <td className="text-right">{money(l.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {receipt.notes && <p className="mt-2 text-xs text-muted-foreground">{receipt.notes}</p>}
    <p className="mt-1 text-xs text-muted-foreground">Sync version {receipt.version} · ref {receipt.externalRef}</p>
  </>
);

// Purchases recorded and received in Plexivia, as applied to stock here (read-only)
const StockReceiptsPage = () => {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const query = useMemo(() => ({ page, limit: 25, q: q.trim() || undefined }), [page, q]);
  const { data, isLoading, isError } = useStockReceipts(query);
  const rows = data?.data || [];
  const pg = data?.pagination;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Received Purchases</h1>
        <p className="text-sm text-muted-foreground">
          Purchases are created, paid and billed in Plexivia. When one is received its units are added here; edits and cancellations there update this list and the stock.
        </p>
      </div>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Purchases</CardTitle>
            <CardDescription>{pg?.total ?? 0} total</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-64 pl-8" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Purchase no, vendor or item" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Purchase</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={7} className="py-8 text-center text-red-600">Could not load purchases.</TableCell></TableRow>}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No purchases received yet. Record one in Plexivia under Purchases.</TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <TableRow className="cursor-pointer" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <TableCell>{open === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                    <TableCell className="font-medium">{r.purchaseNumber || r.externalRef}</TableCell>
                    <TableCell>{r.vendorName || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(r.receivedAt)}</TableCell>
                    <TableCell className="text-right">{r.totalUnits}</TableCell>
                    <TableCell className="text-right">{money(r.totalCost)}</TableCell>
                    <TableCell>
                      {r.status === 'cancelled' ? (
                        <Badge variant="outline" className="border-red-500 text-red-600">Cancelled</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-600">In stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  {open === r.id && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell />
                      <TableCell colSpan={6}><ReceiptLines receipt={r} /></TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
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

export default StockReceiptsPage;
