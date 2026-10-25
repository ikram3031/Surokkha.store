import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toRangeParams } from '@/lib/dashboard-range';

// Order counts and amounts per status for a date range
export function useOrderInsight(filter = '30days') {
  const params = toRangeParams(filter);
  return useQuery({
    queryKey: ['dashboard', 'orderInsight', params],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/status-distribution', { params });
      const data = res.data?.data || {};
      return { statusCounts: data.statusCounts || {}, statusAmounts: data.statusAmounts || {} };
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}

export default useOrderInsight;
