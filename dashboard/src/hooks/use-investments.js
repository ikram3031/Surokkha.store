import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Calculates UI status based on taken and returned amounts
const calculateStatus = (taken, returned, manualStatus) => {
  if (manualStatus && ['Returned', 'Pending'].includes(manualStatus)) return manualStatus;
  if (returned >= taken && taken > 0) return 'Returned';
  if (returned > 0 && returned < taken) return 'Partial';
  return manualStatus || 'Active';
};

// Maps backend investment document into standard UI entity
const mapInvestment = (item) => {
  const investor = typeof item.investorId === 'object' && item.investorId !== null ? item.investorId : {};
  const investorId = investor._id || investor.id || item.investorId || '';
  const investorName = investor.name || item.investorName || 'Investor';
  const takenAmount = Number(item.takenAmount || 0);
  const returnedAmount = Number(item.returnedAmount || 0);
  const status = (item.status || calculateStatus(takenAmount, returnedAmount)).charAt(0).toUpperCase() + (item.status || calculateStatus(takenAmount, returnedAmount)).slice(1).toLowerCase();

  return {
    id: item._id || item.id || item.did,
    did: item.did || item.id || item._id,
    investorId,
    investorName,
    takenAmount,
    returnedAmount,
    takenDate: item.takenDate ? new Date(item.takenDate).toISOString().slice(0, 10) : '',
    returnedDate: item.returnedDate ? new Date(item.returnedDate).toISOString().slice(0, 10) : '',
    paymentMethod: item.paymentMethod || 'Bank Transfer',
    status,
    notes: item.notes || '',
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

// Fetches investments from backend API
const fetchInvestments = async (params = {}) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 100,
      page: params?.page ?? 1,
    };
    if (params?.status && params.status !== 'All') {
      queryParams.status = params.status.toLowerCase();
    }
    if (params?.investorId && params.investorId !== 'All') {
      queryParams.investorId = params.investorId;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get('/api/v1/investments', { params: queryParams });
    const list = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const mapped = list.map(mapInvestment);
    let filtered = [...mapped];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (inv) =>
          inv.investorName.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          (inv.notes && inv.notes.toLowerCase().includes(q)) ||
          (inv.paymentMethod && inv.paymentMethod.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(
        (inv) => inv.status.toLowerCase() === params.status.toLowerCase()
      );
    }

    if (params.investorId && params.investorId !== 'All') {
      filtered = filtered.filter((inv) => inv.investorId === params.investorId);
    }

    const total = response.data?.meta?.total ?? filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = (response.data?.meta?.totalPages ?? Math.ceil(total / limit)) || 1;
    const paginated = response.data?.meta ? filtered : filtered.slice((page - 1) * limit, page * limit);

    const totalTaken = response.data?.meta?.totalTakenAmount ?? (mapped.reduce((acc, curr) => acc + (Number(curr.takenAmount) || 0), 0));
    const totalReturned = response.data?.meta?.totalReturnedAmount ?? (mapped.reduce((acc, curr) => acc + (Number(curr.returnedAmount) || 0), 0));
    const netOutstanding = Math.max(0, totalTaken - totalReturned);

    return {
      items: paginated,
      allItems: mapped,
      summary: {
        totalTaken,
        totalReturned,
        netOutstanding,
        count: total,
      },
      meta: response.data?.meta || { total, page, limit, totalPages },
    };
  } catch (err) {
    console.error('Failed to fetch investments from API:', err);
    return {
      items: [],
      allItems: [],
      summary: { totalTaken: 0, totalReturned: 0, netOutstanding: 0, count: 0 },
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for investments management
export const useInvestments = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['investments', params],
    queryFn: () => fetchInvestments(params),
    staleTime: 60 * 1000,
  });

  const addInvestmentMutation = useMutation({
    mutationFn: async (newInv) => {
      const payload = {
        ...newInv,
        takenAmount: Number(newInv.takenAmount),
        returnedAmount: newInv.returnedAmount !== undefined ? Number(newInv.returnedAmount) : 0,
        status: newInv.status ? String(newInv.status).toLowerCase() : 'active',
      };
      const res = await apiClient.post('/api/v1/investments', payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment added successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add investment');
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const payload = { ...updates };
      if (payload.takenAmount !== undefined) {
        payload.takenAmount = Number(payload.takenAmount);
      }
      if (payload.returnedAmount !== undefined) {
        payload.returnedAmount = Number(payload.returnedAmount);
      }
      if (payload.status !== undefined) {
        payload.status = String(payload.status).toLowerCase();
      }
      const res = await apiClient.put(`/api/v1/investments/${id}`, payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update investment');
    },
  });

  const recordReturnMutation = useMutation({
    mutationFn: async ({
      id,
      investmentId,
      investorId,
      returnAmount,
      returnAmountToAdd,
      returnDate,
      paymentMethod,
      notes,
      createBill = true,
    }) => {
      const payload = {
        investmentId: investmentId || id,
        investorId,
        returnAmount: Number(returnAmount ?? returnAmountToAdd),
        returnDate,
        paymentMethod,
        notes,
        createBill,
      };
      const endpoint = id ? `/api/v1/investments/${id}/return` : '/api/v1/investments/return';
      const res = await apiClient.post(endpoint, payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      queryClient.invalidateQueries({ queryKey: ['account-balance'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      const msg = data?.message || 'Repayment recorded and synced with billing successfully';
      toast.success(msg);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record repayment');
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/investments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete investment');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }) => {
      const res = await apiClient.post('/api/v1/investments/bulk-update', { ids, status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investments updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to bulk update investments');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await apiClient.post('/api/v1/investments/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investments deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to bulk delete investments');
    },
  });

  return {
    ...query,
    investments: query.data?.items || [],
    allInvestments: query.data?.allItems || [],
    summary: query.data?.summary || { totalTaken: 0, totalReturned: 0, netOutstanding: 0, count: 0 },
    meta: query.data?.meta,
    addInvestment: addInvestmentMutation.mutateAsync,
    updateInvestment: updateInvestmentMutation.mutateAsync,
    recordReturn: recordReturnMutation.mutateAsync,
    deleteInvestment: deleteInvestmentMutation.mutateAsync,
    bulkUpdateInvestments: bulkUpdateMutation.mutateAsync,
    bulkDeleteInvestments: bulkDeleteMutation.mutateAsync,
    isAdding: addInvestmentMutation.isPending,
    isUpdating: updateInvestmentMutation.isPending,
    isDeleting: deleteInvestmentMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
};
