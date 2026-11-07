import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const errText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

// Stock items with totals; params: { search, status }
export const useStockItems = (params = {}) =>
  useQuery({
    queryKey: ['stock-items', params],
    queryFn: async () => (await apiClient.get('/api/v1/stock-items', { params })).data,
    staleTime: 15000,
    retry: 1,
  });

// Stock history for stock items; params: { page, limit, refId, type, q }
export const useStockItemMovements = (params = {}) =>
  useQuery({
    queryKey: ['stock-item-movements', params],
    queryFn: async () => (await apiClient.get('/api/v1/stock-items/movements', { params })).data,
    staleTime: 15000,
    retry: 1,
  });

// Latest changes of one stock item, for the adjust dialog
export const useItemRecentChanges = (itemId) =>
  useQuery({
    queryKey: ['stock-item-movements', { refId: itemId, limit: 10 }],
    queryFn: async () => (await apiClient.get('/api/v1/stock-items/movements', { params: { refId: itemId, limit: 10 } })).data,
    enabled: Boolean(itemId),
    staleTime: 5000,
  });

// Purchases received from Plexivia; params: { page, limit, status, q }
export const useStockReceipts = (params = {}) =>
  useQuery({
    queryKey: ['stock-receipts', params],
    queryFn: async () => (await apiClient.get('/api/v1/stock-items/receipts', { params })).data,
    staleTime: 15000,
    retry: 1,
  });

// Create, edit and adjust stock items; every change refreshes the lists
export const useStockItemMutations = () => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['stock-items'] });
    qc.invalidateQueries({ queryKey: ['stock-item-movements'] });
  };
  const create = useMutation({
    mutationFn: async (body) => (await apiClient.post('/api/v1/stock-items', body)).data,
    onSuccess: () => { refresh(); toast.success('Stock item added'); },
    onError: (e) => toast.error(errText(e, 'Could not add the stock item')),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...body }) => (await apiClient.put(`/api/v1/stock-items/${id}`, body)).data,
    onSuccess: () => { refresh(); toast.success('Stock item updated'); },
    onError: (e) => toast.error(errText(e, 'Could not update the stock item')),
  });
  const adjust = useMutation({
    mutationFn: async ({ id, ...body }) => (await apiClient.post(`/api/v1/stock-items/${id}/adjust`, body)).data,
    onSuccess: () => { refresh(); toast.success('Stock updated'); },
    onError: (e) => toast.error(errText(e, 'Could not update the stock')),
  });
  const undo = useMutation({
    mutationFn: async (movementId) => (await apiClient.post(`/api/v1/stock-items/movements/${movementId}/undo`)).data,
    onSuccess: () => { refresh(); toast.success('Change undone'); },
    onError: (e) => toast.error(errText(e, 'Could not undo that change')),
  });
  return { create, update, adjust, undo };
};
