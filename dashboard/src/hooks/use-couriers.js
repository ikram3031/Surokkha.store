import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const KEY = ['courier-providers'];

// Courier integrations and which ones the Owner has switched on
export function useCourierProviders() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get('/api/v1/courier/providers')).data?.data || { couriers: [], enabledCouriers: [] },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

// True while loading so courier UI does not flicker away; false once the courier is known to be off
export function useCourierEnabled(key) {
  const { data, isLoading, isError } = useCourierProviders();
  if (isLoading || isError) return true;
  return (data?.enabledCouriers || []).includes(key);
}

export function useUpdateCourierProviders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabledCouriers) =>
      (await apiClient.put('/api/v1/courier/providers', { enabledCouriers })).data?.data,
    onSuccess: (data) => {
      if (data?.enabledCouriers) queryClient.setQueryData(KEY, data);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}
