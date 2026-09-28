import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Maps backend payment type document into standard UI entity
const mapPaymentType = (item) => ({
  id: item._id || item.id || item.did,
  did: item.did || item.id || item._id,
  name: item.name || '',
  description: item.description || '',
  status: (item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1).toLowerCase(),
  color: item.color || 'emerald',
  isDefault: item.isDefault ?? false,
  createdAt: item.createdAt || new Date().toISOString(),
});

// Fetches payment types from backend API
const fetchPaymentTypes = async (params = {}) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 100,
      page: params?.page ?? 1,
    };
    if (params?.status && params.status !== 'All') {
      queryParams.status = params.status.toLowerCase();
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get('/api/v1/payment-types', { params: queryParams });
    const list = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const mapped = list.map(mapPaymentType);
    let filtered = [...mapped];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(
        (t) => t.status.toLowerCase() === params.status.toLowerCase()
      );
    }

    const total = response.data?.meta?.total ?? filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = (response.data?.meta?.totalPages ?? Math.ceil(total / limit)) || 1;
    const paginated = response.data?.meta ? filtered : filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      allItems: mapped,
      meta: response.data?.meta || { total, page, limit, totalPages },
    };
  } catch (err) {
    console.error('Failed to fetch payment types from API:', err);
    return {
      items: [],
      allItems: [],
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for payment types management
export const usePaymentTypes = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['payment-types', params],
    queryFn: () => fetchPaymentTypes(params),
    staleTime: 60 * 1000,
  });

  const addTypeMutation = useMutation({
    mutationFn: async (newType) => {
      const res = await apiClient.post('/api/v1/payment-types', newType);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast.success('Payment type created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create payment type');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const res = await apiClient.put(`/api/v1/payment-types/${id}`, updates);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast.success('Payment type updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update payment type');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/payment-types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast.success('Payment type deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete payment type');
    },
  });

  return {
    ...query,
    paymentTypes: query.data?.items || [],
    allPaymentTypes: query.data?.allItems || [],
    meta: query.data?.meta,
    addPaymentType: addTypeMutation.mutateAsync,
    updatePaymentType: updateTypeMutation.mutateAsync,
    deletePaymentType: deleteTypeMutation.mutateAsync,
    isAdding: addTypeMutation.isPending,
    isUpdating: updateTypeMutation.isPending,
    isDeleting: deleteTypeMutation.isPending,
  };
};
