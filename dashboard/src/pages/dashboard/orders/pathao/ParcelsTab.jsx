import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FileUp, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDateTime } from '@/utils/dateHelper';
import InvoiceImportDialog from './InvoiceImportDialog';
import { ACTION_BTN, money, SETTLEMENT_META, ORDER_STATUS_META } from './pathaoUtils';

const GROUPS = [
  { value: 'all', label: 'All' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'attention', label: 'Needs attention' },
];

const LIMIT = 25;

export default function ParcelsTab({ range }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState('all');
  const [settlement, setSettlement] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pathao-parcels', { group, settlement, search, page, range }],
    queryFn: async () => {
      const params = { page, limit: LIMIT, ...range };
      if (group !== 'all') params.group = group;
      if (settlement !== 'all') params.settlement = settlement;
      if (search) params.search = search;
      return (await apiClient.get('/api/v1/courier/pathao/parcels', { params })).data?.data;
    },
    keepPreviousData: true,
  });

  const settlementMutation = useMutation({
    mutationFn: async ({ id, status }) => (await apiClient.patch(`/api/v1/courier/pathao/parcels/${id}/settlement`, { status })).data,
    onSuccess: () => {
      toast.success('Settlement updated');
      queryClient.invalidateQueries({ queryKey: ['pathao-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-summary'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update settlement')),
  });

  const items = data?.items || [];
  const canSeeMoney = Boolean(data?.canSeeMoney);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / LIMIT));

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => (
              <Button
                key={g.value}
                type="button"
                size="sm"
                variant={group === g.value ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => resetPage(setGroup)(g.value)}
              >
                {g.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                resetPage(setSearch)(searchInput.trim());
              }}
            >
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Order, consignment, name, phone" className="pl-8 w-64" />
            </form>
            {canSeeMoney && (
              <>
                <Select value={settlement} onValueChange={resetPage(setSettlement)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Settlement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All settlements</SelectItem>
                    {['pending', 'invoiced', 'settled', 'disputed'].map((s) => (
                      <SelectItem key={s} value={s}>{SETTLEMENT_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" className={ACTION_BTN} onClick={() => setImportOpen(true)}>
                  <FileUp className="h-4 w-4 mr-1.5" />
                  Import invoice
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Consignment</TableHead>
                <TableHead>Pathao status</TableHead>
                <TableHead>Dispatched</TableHead>
                {canSeeMoney && (
                  <>
                    <TableHead className="text-right">COD</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead>Settlement</TableHead>
                    <TableHead />
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={canSeeMoney ? 10 : 5} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canSeeMoney ? 10 : 5} className="text-center py-8 text-muted-foreground">No Pathao parcels found.</TableCell>
                </TableRow>
              )}
              {items.map((p) => {
                const s = p.settlement || {};
                const meta = SETTLEMENT_META[s.status] || SETTLEMENT_META.none;
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/orders/${p.id}`)}>
                    <TableCell>
                      <div className="font-medium">#{p.orderNumber}</div>
                      <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[11px] capitalize ${ORDER_STATUS_META[p.orderStatus] || 'bg-muted text-muted-foreground'}`}>
                        {p.orderStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{p.customerName}</div>
                      <div className="text-xs text-muted-foreground">{p.customerPhone}{p.district ? ` · ${p.district}` : ''}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.consignmentId}</TableCell>
                    <TableCell>
                      <span className={p.needsAttention ? 'text-amber-600 font-medium' : ''}>{p.courierStatus || '—'}</span>
                      {p.lastEventAt && <div className="text-[11px] text-muted-foreground">{formatDateTime(p.lastEventAt)}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(p.dispatchedAt)}</TableCell>
                    {canSeeMoney && (
                      <>
                        <TableCell className="text-right">{money(s.status && s.status !== 'none' ? s.collectedAmount : p.amountToCollect)}</TableCell>
                        <TableCell className="text-right">{money(s.status && s.status !== 'none' ? s.totalCharge : p.actualDeliveryFee ?? p.deliveryFee)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {s.status && s.status !== 'none' ? money(s.netPayout) : '—'}
                          {s.status && s.status !== 'none' && s.isEstimated && <div className="text-[10px] text-muted-foreground font-normal">estimated</div>}
                        </TableCell>
                        <TableCell>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                          {s.invoiceId && <div className="text-[10px] text-muted-foreground mt-0.5">{s.invoiceId}</div>}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button type="button" variant="ghost" className="h-8 w-8 p-0 cursor-pointer" aria-label="Settlement actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="text-xs">
                              {['settled', 'disputed', 'invoiced', 'pending']
                                .filter((status) => status !== s.status)
                                .map((status) => (
                                  <DropdownMenuItem key={status} className="cursor-pointer" onClick={() => settlementMutation.mutate({ id: p.id, status })}>
                                    Mark as {SETTLEMENT_META[status].label.toLowerCase()}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} parcel(s)</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button type="button" size="sm" variant="outline" className="cursor-pointer" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      {canSeeMoney && <InvoiceImportDialog open={importOpen} onOpenChange={setImportOpen} />}
    </Card>
  );
}
