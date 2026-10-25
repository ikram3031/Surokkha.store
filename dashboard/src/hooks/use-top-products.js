import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toRangeParams } from '@/lib/dashboard-range';

// Best-selling products for the overview (units sold and sales amount)
export function useTopProducts(filter = '30days', limit = 8) {
  const params = { ...toRangeParams(filter), limit };
  return useQuery({
    queryKey: ['dashboard', 'topProducts', params],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/products/top', { params });
      return res.data?.data?.products || [];
    },
    staleTime: 60 * 1000,
  });
}

export default useTopProducts;
