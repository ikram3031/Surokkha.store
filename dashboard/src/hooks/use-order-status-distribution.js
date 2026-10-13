import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useOrderStatusDistribution(range = '30days') {
  return useQuery({
    queryKey: ['dashboard', 'orderStatusDistribution', range],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/status-distribution', { params: { range } });
      return res.data?.data?.statusCounts || {};
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}

export default useOrderStatusDistribution;
