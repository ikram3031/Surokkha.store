import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Maps backend bill type document into standard UI entity
const mapBillType = (item) => ({
  id: item._id || item.id || item.did,
  did: item.did || item.id || item._id,
  name: item.name || '',
  description: item.description || '',
  status: (item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1).toLowerCase(),
  color: item.color || 'blue',
  isDefault: item.isDefault ?? false,
  createdAt: item.createdAt || new Date().toISOString(),
});

// Fetches bill types from backend API
const fetchBillTypes = async (params = {}) => {
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

    const response = await apiClient.get('/api/v1/bill-types', { params: queryParams });
    const list = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const mapped = list.map(mapBillType);
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
    console.error('Failed to fetch bill types from API:', err);
    return {
      items: [],
      allItems: [],
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for bill types management
export const useBillTypes = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bill-types', params],
    queryFn: () => fetchBillTypes(params),
    staleTime: 60 * 1000,
  });

  const addTypeMutation = useMutation({
    mutationFn: async (newType) => {
      const res = await apiClient.post('/api/v1/bill-types', newType);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create bill type');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const res = await apiClient.put(`/api/v1/bill-types/${id}`, updates);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update bill type');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/bill-types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete bill type');
    },
  });

  return {
    ...query,
    billTypes: query.data?.items || [],
    allBillTypes: query.data?.allItems || [],
    meta: query.data?.meta,
    addBillType: addTypeMutation.mutateAsync,
    updateBillType: updateTypeMutation.mutateAsync,
    deleteBillType: deleteTypeMutation.mutateAsync,
    isAdding: addTypeMutation.isPending,
    isUpdating: updateTypeMutation.isPending,
    isDeleting: deleteTypeMutation.isPending,
  };
};
