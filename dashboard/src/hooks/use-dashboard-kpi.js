import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toRangeParams } from '@/lib/dashboard-range';

export function useDashboardKpi(filter = '30days') {
  const params = toRangeParams(filter);
  return useQuery({
    queryKey: ['dashboard', 'kpi', params],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/kpi', { params });
      return res.data?.data || {};
    },
    staleTime: 30 * 1000, // 30 seconds cache duration
  });
}

export default useDashboardKpi;
