import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const errText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

// Formats a number as Taka
export const taka = (v) => `৳${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Short text for one purchase line, e.g. "MO × 5 Packet (50 pcs)"
export const lineText = (l) =>
  l.unitsPerPack > 1 ? `${l.shortName} × ${l.packs} ${l.packLabel || 'pack'} (${l.units} ${l.unit || 'pcs'})` : `${l.shortName} × ${l.units} ${l.unit || 'pcs'}`;

// Purchases with page totals; params: { page, limit, status, q, vendor }
export const usePurchases = (params = {}) =>
  useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => (await apiClient.get('/api/v1/purchases', { params })).data,
    staleTime: 15000,
    retry: 1,
  });

// One purchase with its stock receipt state
export const usePurchase = (id) =>
  useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => (await apiClient.get(`/api/v1/purchases/${id}`)).data?.data,
    enabled: Boolean(id),
    retry: 1,
  });

// Vendors stock is bought from; params: { q, status }
export const useVendors = (params = {}) =>
  useQuery({
    queryKey: ['vendors', params],
    queryFn: async () => (await apiClient.get('/api/v1/purchases/vendors', { params })).data?.data || [],
    staleTime: 30000,
    retry: 1,
  });

// Purchase actions; stock and bills change with them, so those lists refresh too
export const usePurchaseMutations = () => {
  const qc = useQueryClient();
  const refresh = (data) => {
    qc.invalidateQueries({ queryKey: ['purchases'] });
    qc.invalidateQueries({ queryKey: ['vendors'] });
    qc.invalidateQueries({ queryKey: ['stock-items'] });
    qc.invalidateQueries({ queryKey: ['stock-item-movements'] });
    qc.invalidateQueries({ queryKey: ['stock-receipts'] });
    if (data?.id) qc.invalidateQueries({ queryKey: ['purchase', data.id] });
  };
  const useAction = (fn, ok, fail) =>
    useMutation({
      mutationFn: async (vars) => (await fn(vars)).data?.data,
      onSuccess: (data) => { refresh(data); if (ok) toast.success(typeof ok === 'function' ? ok(data) : ok); },
      onError: (e) => toast.error(errText(e, fail)),
    });

  return {
    create: useAction((body) => apiClient.post('/api/v1/purchases', body), (p) => `${p.purchaseNumber} saved${p.status === 'received' ? ' and stock updated' : ''}`, 'Could not save the purchase'),
    update: useAction(({ id, ...body }) => apiClient.put(`/api/v1/purchases/${id}`, body), (p) => `${p.purchaseNumber} updated`, 'Could not update the purchase'),
    receive: useAction(({ id, ...body }) => apiClient.post(`/api/v1/purchases/${id}/receive`, body), 'Received: units added to stock', 'Could not receive the purchase'),
    addPayment: useAction(({ id, ...body }) => apiClient.post(`/api/v1/purchases/${id}/payments`, body), 'Payment added; bill updated', 'Could not add the payment'),
    removePayment: useAction(({ id, paymentId }) => apiClient.delete(`/api/v1/purchases/${id}/payments/${paymentId}`), 'Payment removed', 'Could not remove the payment'),
    cancel: useAction(({ id, reason }) => apiClient.post(`/api/v1/purchases/${id}/cancel`, { reason }), 'Purchase cancelled', 'Could not cancel the purchase'),
  };
};

// Vendor create / edit / remove
export const useVendorMutations = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['vendors'] });
  const create = useMutation({
    mutationFn: async (body) => (await apiClient.post('/api/v1/purchases/vendors', body)).data?.data,
    onSuccess: () => { refresh(); toast.success('Vendor added'); },
    onError: (e) => toast.error(errText(e, 'Could not add the vendor')),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...body }) => (await apiClient.put(`/api/v1/purchases/vendors/${id}`, body)).data?.data,
    onSuccess: () => { refresh(); toast.success('Vendor updated'); },
    onError: (e) => toast.error(errText(e, 'Could not update the vendor')),
  });
  const remove = useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/api/v1/purchases/vendors/${id}`)).data,
    onSuccess: () => { refresh(); toast.success('Vendor removed'); },
    onError: (e) => toast.error(errText(e, 'Could not remove the vendor')),
  });
  return { create, update, remove };
};
