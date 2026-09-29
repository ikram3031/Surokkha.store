import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Maps backend investor document into standard UI entity
const mapInvestor = (item) => ({
  id: item._id || item.id || item.did,
  did: item.did || item.id || item._id,
  name: item.name || '',
  type: (item.type || 'individual').charAt(0).toUpperCase() + (item.type || 'individual').slice(1).toLowerCase(),
  phone: item.phone || '',
  email: item.email || '',
  status: (item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1).toLowerCase(),
  totalInvested: Number(item.totalInvested) || 0,
  totalReturned: Number(item.totalReturned) || 0,
  notes: item.notes || '',
  userId: item.userId?._id || item.userId || null,
  user: typeof item.userId === 'object' ? item.userId : null,
  createdAt: item.createdAt || new Date().toISOString(),
});

// Fetches investors from backend API
const fetchInvestors = async (params = {}) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 100,
      page: params?.page ?? 1,
    };
    if (params?.status && params.status !== 'All') {
      queryParams.status = params.status.toLowerCase();
    }
    if (params?.type && params.type !== 'All') {
      queryParams.type = params.type.toLowerCase();
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get('/api/v1/investors', { params: queryParams });
    const list = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const mapped = list.map(mapInvestor);
    let filtered = [...mapped];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.email && i.email.toLowerCase().includes(q)) ||
          (i.phone && i.phone.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(
        (i) => i.status.toLowerCase() === params.status.toLowerCase()
      );
    }

    if (params.type && params.type !== 'All') {
      filtered = filtered.filter(
        (i) => i.type.toLowerCase() === params.type.toLowerCase()
      );
    }

    const total = response.data?.meta?.total ?? filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = (response.data?.meta?.totalPages ?? Math.ceil(total / limit)) || 1;
    const paginated = response.data?.meta ? filtered : filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      allInvestors: mapped,
      meta: response.data?.meta || { total, page, limit, totalPages },
    };
  } catch (err) {
    console.error('Failed to fetch investors from API:', err);
    return {
      items: [],
      allInvestors: [],
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for investors management
export const useInvestors = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['investors', params],
    queryFn: () => fetchInvestors(params),
    staleTime: 60 * 1000,
  });

  const addInvestorMutation = useMutation({
    mutationFn: async (newInv) => {
      const res = await apiClient.post('/api/v1/investors', newInv);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add investor');
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const res = await apiClient.put(`/api/v1/investors/${id}`, updates);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update investor');
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/investors/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete investor');
    },
  });

  return {
    ...query,
    investors: query.data?.items || [],
    allInvestors: query.data?.allInvestors || [],
    meta: query.data?.meta,
    addInvestor: addInvestorMutation.mutateAsync,
    updateInvestor: updateInvestorMutation.mutateAsync,
    deleteInvestor: deleteInvestorMutation.mutateAsync,
    isAdding: addInvestorMutation.isPending,
    isUpdating: updateInvestorMutation.isPending,
    isDeleting: deleteInvestorMutation.isPending,
  };
};
