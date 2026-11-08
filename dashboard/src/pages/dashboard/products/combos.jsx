import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search, Pencil, Copy, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient, baseURL } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { useAuth } from '@/lib/auth-context';
import { isReadOnlyRole } from '@/lib/rbac';

const ACTION_BTN = 'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';
const STATUS_ITEMS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Relative upload paths need the API host to show
const fullUrl = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${(baseURL || '').replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`);

export const taka = (v) => `৳${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// "10% off" / "৳50 off" / "—"
export const discountLabel = (c) =>
  c.discountType === 'percentage' ? `${c.discountValue}% off` : c.discountType === 'fixed' ? `${taka(c.discountValue)} off` : '—';

// Group products (combos): fixed pieces sold together with one discount on the whole set
const CombosPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const readOnly = isReadOnlyRole(user?.role);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const params = useMemo(() => ({ search: search.trim() || undefined, status }), [search, status]);

  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['combos', params],
    queryFn: async () => (await apiClient.get('/api/v1/combos', { params })).data?.data || [],
    staleTime: 10000,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }) => (await apiClient.patch(`/api/v1/combos/${id}/active`, { isActive })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['combos'] }),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not change the status')),
  });
  const remove = useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/api/v1/combos/${id}`)).data,
    onSuccess: () => {
      toast.success('Group product deleted');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['combos'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete')),
  });

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight"><Layers className="h-7 w-7 text-primary" /> Group Products</h2>
          <p className="text-sm text-muted-foreground">Combos: set pieces sold together, with one discount on the whole group. Selling one takes its catalog pieces out of stock.</p>
        </div>
        {!readOnly && (
          <Button className={ACTION_BTN} onClick={() => navigate('/dashboard/products/combos/new')}><Plus className="mr-1.5 h-4 w-4" /> New group product</Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-64 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, SKU or a piece inside" />
            </div>
            <Select value={status} onValueChange={setStatus} items={STATUS_ITEMS}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_ITEMS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Pieces total</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
                {isError && <TableRow><TableCell colSpan={7} className="py-8 text-center text-red-600">Could not load group products.</TableCell></TableRow>}
                {!isLoading && !isError && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No group products yet.</TableCell></TableRow>
                )}
                {rows.map((c) => {
                  const problems = c.pieces.filter((p) => p.problem);
                  const warnings = c.pieces.filter((p) => p.warning);
                  return (
                    <TableRow key={c.id} className={c.isActive ? '' : 'opacity-60'}>
                      <TableCell className="max-w-md">
                        <div className="flex items-center gap-2.5">
                          {c.imageUrl ? <img src={fullUrl(c.imageUrl)} alt="" className="h-10 w-10 shrink-0 rounded-md border object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted"><Layers className="h-4 w-4 text-muted-foreground" /></div>}
                          <div className="min-w-0">
                            <Link to={`/dashboard/products/combos/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                            <div className="truncate text-xs text-muted-foreground" title={c.pieces.map((p) => `${p.quantity} × ${p.name}`).join(', ')}>
                              {c.pieces.map((p) => `${p.quantity} × ${p.name}${p.size ? ` (${p.size})` : ''}`).join(', ')}
                            </div>
                            {c.categories?.length > 0 && <div className="text-[11px] text-muted-foreground">{c.categories.map((x) => x.name).filter(Boolean).join(', ')}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{taka(c.total)}<div className="text-[11px] text-muted-foreground">{c.pieceCount} pcs</div></TableCell>
                      <TableCell className="text-right text-sm">{discountLabel(c)}{c.discount > 0 && <div className="text-[11px] text-emerald-600">−{taka(c.discount)}</div>}</TableCell>
                      <TableCell className="text-right font-semibold">{taka(c.price)}</TableCell>
                      <TableCell>
                        {problems.length > 0 ? (
                          <Badge variant="outline" className="border-red-500 text-red-600" title={problems.map((p) => `${p.name}: ${p.problem}`).join('\n')}>
                            <AlertTriangle className="mr-1 h-3 w-3" /> {problems[0].name}: {problems[0].problem}{problems.length > 1 ? ` +${problems.length - 1}` : ''}
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</span>
                        )}
                        {warnings.length > 0 && problems.length === 0 && <div className="text-[11px] text-amber-600">{warnings.map((p) => `${p.name}: ${p.warning}`).join(', ')}</div>}
                      </TableCell>
                      <TableCell>
                        <Switch checked={c.isActive} disabled={readOnly || toggle.isPending} onCheckedChange={(v) => toggle.mutate({ id: c.id, isActive: v })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => navigate(`/dashboard/products/combos/${c.id}`)}><Pencil className="h-4 w-4" /></Button>
                          {!readOnly && <Button size="icon" variant="ghost" title="Duplicate" onClick={() => navigate(`/dashboard/products/combos/new?copy=${c.id}`)}><Copy className="h-4 w-4" /></Button>}
                          {!readOnly && <Button size="icon" variant="ghost" title="Delete" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleting)} onOpenChange={(v) => !v && !remove.isPending && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>The group is removed from the dashboard. Past orders keep their lines; the products inside are not touched.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>Keep it</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
              {remove.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CombosPage;
