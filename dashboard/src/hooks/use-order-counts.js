import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toRangeParams } from '@/lib/dashboard-range';

// Daily order counts for the last N days
export function useOrderCounts(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'orders', 'daily', days],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/daily', { params: { days } });
      return (res.data && res.data.data) || [];
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });
}

// Daily order counts for a dashboard range filter (this month, custom dates, ...)
export function useOrderCountsByRange(filter) {
  const params = toRangeParams(filter);
  return useQuery({
    queryKey: ['dashboard', 'orders', 'daily', params],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/daily', { params });
      return (res.data && res.data.data) || [];
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });
}

export default useOrderCounts;
