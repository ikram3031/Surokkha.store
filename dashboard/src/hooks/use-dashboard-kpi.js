import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDashboardKpi(range = '30days') {
  return useQuery({
    queryKey: ['dashboard', 'kpi', range],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/kpi', { params: { range } });
      return res.data?.data || {};
    },
    staleTime: 30 * 1000, // 30 seconds cache duration
  });
}

export default useDashboardKpi;
