import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Formats arbitrary date value to YYYY-MM-DD string
const formatDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

// Normalizes status string with fallback comparison of paid vs total amounts
const normalizeStatus = (status, paid = 0, total = 0) => {
  if (!status) {
    if (paid >= total && total > 0) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Pending';
  }
  const normalized = status.toString().trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'completed') return 'Paid';
  if (normalized === 'partial') return 'Partial';
  if (normalized === 'returned') return 'Returned';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'active') return 'Active';
  return 'Pending';
};

// Maps raw database billing document into standard UI entity
const mapBilling = (billing) => {
  const order = typeof billing.orderId === 'object' && billing.orderId !== null ? billing.orderId : {};
  const invoiceId = billing.did || order.orderNumber || order.did || billing.id || billing._id || 'Unknown';
  const customerName =
    billing.title ||
    billing.vendor ||
    order.billingInfo?.fullName ||
    order.shippingInfo?.fullName ||
    order.customerName ||
    billing.billingName ||
    billing.customerName ||
    billing.billingEmail ||
    billing.billingPhone ||
    'Office Expense';

  const totalAmount =
    typeof billing.totalAmount === 'number' && billing.totalAmount > 0
      ? billing.totalAmount
      : typeof billing.amount === 'number' && billing.amount > 0
      ? billing.amount
      : typeof order.totals?.total === 'number' && order.totals.total > 0
      ? order.totals.total
      : Number(billing.paidAmount ?? 0);

  const paidAmount = typeof billing.paidAmount === 'number' ? billing.paidAmount : (billing.status === 'paid' ? totalAmount : 0);
  const pendingAmount = typeof billing.pendingAmount === 'number' ? billing.pendingAmount : Math.max(0, totalAmount - paidAmount);

  const investor = typeof billing.investorId === 'object' && billing.investorId !== null ? billing.investorId : {};
  const investorId = investor._id || investor.id || (typeof billing.investorId === 'string' ? billing.investorId : null);
  const investorName = investor.name || (billing.billType === 'Investment Return' ? billing.vendor || '' : '');

  const investment = typeof billing.investmentId === 'object' && billing.investmentId !== null ? billing.investmentId : {};
  const investmentId = investment._id || investment.id || (typeof billing.investmentId === 'string' ? billing.investmentId : null);

  return {
    id: billing.id || billing._id || invoiceId,
    invoiceId,
    did: billing.did || invoiceId,
    title: billing.title || customerName,
    billTypeId: billing.billTypeId?.id || billing.billTypeId?._id || billing.billTypeId || null,
    billType: billing.billTypeId?.name || billing.billType || billing.billingMethod || 'General Expense',
    vendor: billing.vendor || customerName,
    customerName,
    billingMethod: billing.billingMethod || 'Cash',
    paymentFee: billing.paymentFee || null,
    baseAmount: billing.baseAmount,
    investorId,
    investorName,
    investmentId,
    date: formatDate(billing.billingDate || billing.createdAt || billing.updatedAt || order.createdAt),
    billingDate: formatDate(billing.billingDate || billing.createdAt || order.createdAt),
    dueDate: formatDate(billing.dueDate || billing.billingDate || billing.createdAt || order.createdAt),
    totalAmount,
    amount: totalAmount,
    paidAmount,
    pendingAmount,
    status: normalizeStatus(billing.status, paidAmount, totalAmount),
    notes: billing.notes || '',
    createdAt: billing.createdAt || new Date().toISOString(),
  };
};

// Fetches billing records from backend API with query parameters
const fetchBillings = async (params = {}) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 100,
      page: params?.page ?? 1,
    };
    if (params?.status && params.status !== 'All') {
      queryParams.status = params.status.toString().trim().toLowerCase();
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get('/api/v1/billing', { params: queryParams });
    const billingList = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const allBills = billingList.map(mapBilling);
    let filtered = [...allBills];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.did.toLowerCase().includes(q) ||
          b.vendor.toLowerCase().includes(q) ||
          b.billType.toLowerCase().includes(q) ||
          b.notes.toLowerCase().includes(q) ||
          b.billingMethod.toLowerCase().includes(q)
      );
    }

    if (params.status && params.status !== 'All') {
      const s = params.status.toLowerCase();
      if (s === 'active') {
        filtered = filtered.filter((b) => b.status === 'Pending' || b.status === 'Partial' || b.status === 'Active');
      } else {
        filtered = filtered.filter((b) => b.status.toLowerCase() === s);
      }
    }

    if (params.billType && params.billType !== 'All') {
      filtered = filtered.filter((b) => b.billType.toLowerCase() === params.billType.toLowerCase());
    }

    if (params.startDate) {
      const start = new Date(params.startDate).getTime();
      filtered = filtered.filter((b) => new Date(b.billingDate || b.date).getTime() >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate).getTime() + 86400000;
      filtered = filtered.filter((b) => new Date(b.billingDate || b.date).getTime() <= end);
    }

    const total = response.data?.meta?.total ?? filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = (response.data?.meta?.totalPages ?? Math.ceil(total / limit)) || 1;
    const paginated = response.data?.meta ? filtered : filtered.slice((page - 1) * limit, page * limit);

    const totalBilled = response.data?.meta?.totalAmount ?? (allBills.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0));
    const totalPaid = response.data?.meta?.paidAmount ?? (allBills.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0));
    const totalPending = response.data?.meta?.pendingAmount ?? (allBills.reduce((acc, curr) => acc + (Number(curr.pendingAmount) || 0), 0));

    return {
      items: paginated,
      allItems: allBills,
      filteredAll: filtered,
      summary: { totalBilled, totalPaid, totalPending, count: total },
      meta: response.data?.meta || { total, page, limit, totalPages },
    };
  } catch (err) {
    console.error('Failed to fetch billings from API:', err);
    return {
      items: [],
      allItems: [],
      filteredAll: [],
      summary: { totalBilled: 0, totalPaid: 0, totalPending: 0, count: 0 },
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for billing list and mutations
export const useBillings = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['billings', params],
    queryFn: () => fetchBillings(params),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const createBillingMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/api/v1/billing', payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create billing record');
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiClient.put(`/api/v1/billing/${id}`, payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update billing record');
    },
  });

  const deleteBillingMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/billing/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete billing record');
    },
  });

  return {
    ...query,
    billings: query.data?.items || [],
    allBillings: query.data?.allItems || [],
    filteredAll: query.data?.filteredAll || [],
    summary: query.data?.summary || { totalBilled: 0, totalPaid: 0, totalPending: 0, count: 0 },
    meta: query.data?.meta,
    createBilling: createBillingMutation.mutateAsync,
    updateBilling: updateBillingMutation.mutateAsync,
    deleteBilling: deleteBillingMutation.mutateAsync,
    isCreating: createBillingMutation.isPending,
    isUpdating: updateBillingMutation.isPending,
    isDeleting: deleteBillingMutation.isPending,
  };
};
