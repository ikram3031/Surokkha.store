import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { handleGlobalError } from '@/lib/error-handler';

// One shared QueryClient so non-React code (the API client) can refresh data
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => handleGlobalError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleGlobalError(error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// POST endpoints that only read data or have no effect on what tables show
const READ_ONLY_POST = /(\/search\b|\/dash\/products\b|\/price-plan\b|\/test$|\/test-email$|\/api\/v[12]\/logs$|\/upload|\/upload-slot|\/attachments|\/auth\/)/;

let refreshTimer = null;

// After any successful write, refetch every query on screen so tables update without a reload
export const refreshAfterWrite = (config) => {
  const method = String(config?.method || 'get').toLowerCase();
  if (method === 'get' || method === 'head' || method === 'options') return;
  if (config?.skipAutoRefresh) return;
  const url = String(config?.url || '').split('?')[0];
  if (method === 'post' && READ_ONLY_POST.test(url)) return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    queryClient.invalidateQueries();
  }, 50);
};
