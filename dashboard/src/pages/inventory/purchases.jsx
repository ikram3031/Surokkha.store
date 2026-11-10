import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, FileText, Plus, Search, ShoppingCart, Wallet } from 'lucide-react';

import { usePurchases, lineText, taka } from '@/hooks/use-purchases';
import { PurchaseDetailDialog, PurchaseStatusBadge, PaymentStatusText, fmtDate } from '@/components/dashboard/inventory/purchaseParts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

// Stock bought from vendors: list, quick view, receive, pay and cancel
const PurchasesPage = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const openId = params.get('open');
  const query = useMemo(() => ({ page, limit: 25, status, q: q.trim() || undefined }), [page, status, q]);
  const { data, isLoading, isError } = usePurchases(query);
  const rows = data?.data || [];
  const summary = data?.summary || {};
  const pg = data?.pagination;

  const setOpen = (id) => setParams(id ? { open: id } : {}, { replace: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Purchases</h1>
          <p className="text-sm text-muted-foreground">Stock bought from vendors. Receiving a purchase adds its units to Stock Items, and a Product Purchase bill is kept in step.</p>
        </div>
        <Button render={<Link to="/inventory/purchases/new" />}><Plus className="mr-1.5 h-4 w-4" />New purchase</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label="Purchased (ordered + received)" value={taka(summary.total)} />
        <StatCard icon={Wallet} label="Due to vendors" value={taka(summary.due)} tone={summary.due > 0 ? 'text-red-600' : ''} />
        <StatCard icon={ClipboardList} label="Ordered, not received" value={summary.ordered ?? 0} tone={summary.ordered ? 'text-sky-600' : ''} />
        <StatCard icon={FileText} label="Drafts" value={summary.drafts ?? 0} />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All purchases</CardTitle>
            <CardDescription>{pg?.total ?? 0} total</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-56 pl-8" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Number, vendor or item" />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} items={STATUS_FILTERS}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_FILTERS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={6} className="py-8 text-center text-red-600">Could not load purchases.</TableCell></TableRow>}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No purchases yet. Record one with New purchase.</TableCell></TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpen(p.id)}>
                  <TableCell>
                    <div className="font-semibold">{p.purchaseNumber}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(p.orderDate)}</div>
                  </TableCell>
                  <TableCell>{p.vendorName}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs" title={p.lines.map(lineText).join(', ')}>{p.lines.map((l) => l.shortName).join(', ')}</TableCell>
                  <TableCell className="text-right font-semibold">{taka(p.total)}</TableCell>
                  <TableCell className="text-right">
                    <div>{taka(p.paidAmount)}</div>
                    <PaymentStatusText status={p.paymentStatus} />
                  </TableCell>
                  <TableCell><PurchaseStatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pg && pg.pages > 1 && (
            <div className="flex items-center justify-end gap-2 py-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pg.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pg.pages} onClick={() => setPage((x) => x + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseDetailDialog purchaseId={openId} onOpenChange={() => setOpen(null)} />
    </div>
  );
};

export default PurchasesPage;
