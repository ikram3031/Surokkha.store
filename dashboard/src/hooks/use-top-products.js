import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Best-selling products for the overview (units sold and sales amount)
export function useTopProducts(range = '30days', limit = 8) {
  return useQuery({
    queryKey: ['dashboard', 'topProducts', range, limit],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/products/top', { params: { range, limit } });
      return res.data?.data?.products || [];
    },
    staleTime: 60 * 1000,
  });
}

export default useTopProducts;
