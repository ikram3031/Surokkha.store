import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useOrderCounts(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'orders', 'daily', days],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/orders/daily', { params: { days } });
      return (res.data && res.data.data) || [];
    },
    staleTime: 60 * 1000,
  });
}

export default useOrderCounts;
