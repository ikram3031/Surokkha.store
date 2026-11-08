import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// All-time sold counts per product/item id, from completed orders only: { [id]: { orderCount, unitsSold } }
export function useSoldCounts() {
  return useQuery({
    queryKey: ['dashboard', 'soldCounts'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/products/sold-counts');
      return res.data?.data?.counts || {};
    },
    staleTime: 60 * 1000,
  });
}

export default useSoldCounts;
