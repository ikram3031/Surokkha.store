import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Truck className="h-3.5 w-3.5" />
      <span>
        Pathao last synced:{' '}
        <span className="font-medium text-foreground">
          {data?.lastOrderSyncAt ? formatDateTime(data.lastOrderSyncAt) : 'Not synced yet'}
        </span>
      </span>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleSync} disabled={isSyncing}>
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        Sync now
      </Button>
    </div>
  );
};

export default PathaoSyncBar;
