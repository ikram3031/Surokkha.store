import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDateTime } from '@/utils/dateHelper';
import { ACTION_BTN } from './pathaoUtils';

const LIMIT = 50;

// Raw webhook deliveries from Pathao, with replay for events stored in log mode
export default function WebhookEventsTab() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pathao-webhook-events', { status, page }],
    queryFn: async () => {
      const params = { page, limit: LIMIT, ...(status !== 'all' ? { status } : {}) };
      return (await apiClient.get('/api/v1/courier/pathao/webhook/events', { params })).data?.data;
    },
    keepPreviousData: true,
  });

  const replayMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/courier/pathao/webhook/events/replay')).data?.data,
    onSuccess: (res) => {
      toast.success(`Replayed ${res?.replayed ?? 0} event(s)${res?.failed ? `, ${res.failed} failed` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['pathao-webhook-events'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-summary'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Replay failed')),
  });

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / LIMIT));

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Every request Pathao sends is stored here for 90 days. In log mode events are only stored; replay applies them to orders.
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="unprocessed">Unprocessed</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" className={ACTION_BTN} disabled={replayMutation.isPending} onClick={() => replayMutation.mutate()}>
              <RotateCcw className={`h-4 w-4 mr-1.5 ${replayMutation.isPending ? 'animate-spin' : ''}`} />
              Replay unprocessed
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Consignment</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No webhook events received yet.</TableCell>
                </TableRow>
              )}
              {items.map((e) => (
                <Fragment key={e.id}>
                  <TableRow className="cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTime(e.receivedAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{e.event}</TableCell>
                    <TableCell className="font-mono text-xs">{e.consignmentId || '—'}</TableCell>
                    <TableCell>{e.orderNumber ? `#${e.orderNumber}` : '—'}</TableCell>
                    <TableCell className="text-xs">{e.mode}</TableCell>
                    <TableCell className="text-xs">
                      {e.error ? (
                        <span className="text-red-600">{e.error}</span>
                      ) : e.processed ? (
                        e.result
                      ) : (
                        <span className="text-muted-foreground">stored, not applied</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {expanded === e.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/40">
                        <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(e.payload, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data?.total ?? 0} event(s)</span>
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
    </Card>
  );
}
