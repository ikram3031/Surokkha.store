import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDateTime } from '@/utils/dateHelper';
import { ACTION_BTN } from './pathaoUtils';
import { PageHeader } from '@/components/ui/page-header';

// Shared header for the Pathao pages: title, last sync time, optional date range and "Sync now"
export default function PathaoHeader({ title, description, range, onRangeChange }) {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['pathao-config-sync'],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/config')).data?.data,
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/courier/pathao/orders/sync')).data?.data,
    onSuccess: (data) => {
      toast.success(data?.summary || data?.reason || 'Pathao sync finished');
      ['pathao-summary', 'pathao-parcels', 'pathao-config-sync'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Pathao sync failed')),
  });

  return (
    <PageHeader
      icon={<Truck />}
      title={title}
      description={<>{description} {config?.lastOrderSyncAt && <> Last sync: {formatDateTime(config.lastOrderSyncAt)}</>}</>}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {range && (
            <>
              <Input type="date" value={range.from} onChange={(e) => onRangeChange({ ...range, from: e.target.value })} className="w-auto" aria-label="From" />
              <Input type="date" value={range.to} onChange={(e) => onRangeChange({ ...range, to: e.target.value })} className="w-auto" aria-label="To" />
            </>
          )}
          <Button type="button" className={ACTION_BTN} onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync now
          </Button>
        </div>
      }
    />
  );
}
