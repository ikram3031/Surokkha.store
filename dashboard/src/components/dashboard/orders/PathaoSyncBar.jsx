import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dateHelper';

// Shows when Pathao order statuses were last auto-synced (every 30 min) and allows a manual sync
const PathaoSyncBar = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['pathao-sync-status'],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/config')).data?.data || {},
    refetchInterval: 60 * 1000,
    retry: false,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiClient.post('/api/v1/courier/pathao/orders/sync');
      const result = res.data?.data || {};
      if (result.skipped) {
        toast.info(result.reason || 'Sync skipped.');
      } else {
        toast.success(`Pathao sync done: ${result.updated} updated of ${result.checked} orders.`);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      refetch();
    } catch {
      toast.error('Failed to sync Pathao orders.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1 text-xs text-muted-foreground">
      <Truck className="h-3.5 w-3.5 text-primary" />
      <span>
        Pathao synced:{' '}
        <span className="font-medium text-foreground">
          {data?.lastOrderSyncAt ? formatDateTime(data.lastOrderSyncAt) : 'Never'}
        </span>
      </span>
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-60 cursor-pointer"
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );
};

export default PathaoSyncBar;
