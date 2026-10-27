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
    if (paid >= total && total > 0) return 'Completed';
    if (paid > 0) return 'Partial';
    return 'Pending';
  }
  const normalized = status.toString().trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'completed') return 'Completed';
  if (normalized === 'partial') return 'Partial';
  if (normalized === 'returned') return 'Returned';
  if (normalized === 'failed') return 'Failed';
  return 'Pending';
};

// Maps raw database payment document into standard UI entity
const mapPayment = (payment) => {
  const order = typeof payment.orderId === 'object' && payment.orderId !== null ? payment.orderId : {};
  const invoiceId = order.orderNumber || order.did || payment.did || payment.invoiceId || payment.id || payment._id || 'Unknown';
  const customerName =
    order.billingInfo?.fullName ||
    order.shippingInfo?.fullName ||
    order.customerName ||
    order.customer?.fullName ||
    order.fullName ||
    payment.customerName ||
    payment.customer?.fullName ||
    (order.billingInfo?.phone ? `Customer (${order.billingInfo.phone})` : '') ||
    'Customer';

  const method = payment.paymentMethod || payment.method || order.paymentMethod || 'Cash';
  const orderShippingFee = Number(order.totals?.shippingFee ?? order.shippingTotalAmount ?? 0);
  const orderNetAmount = typeof order.totals?.total === 'number' && order.totals.total > 0
    ? Math.max(0, order.totals.total - orderShippingFee)
    : 0;

  const amount =
    typeof payment.totalAmount === 'number' && payment.totalAmount > 0
      ? payment.totalAmount
      : orderNetAmount > 0
      ? orderNetAmount
      : typeof payment.amount === 'number' && payment.amount > 0
      ? payment.amount
      : typeof payment.paidAmount === 'number' && payment.paidAmount > 0
      ? payment.paidAmount
      : 0;

  const paidAmount = typeof payment.paidAmount === 'number' ? payment.paidAmount : (payment.status === 'paid' || payment.status === 'Completed' ? amount : 0);

  return {
    id: payment.id || payment._id || invoiceId,
    invoiceId,
    customerName,
    method,
    paymentMethod: method,
    trxId: payment.trxId || payment.transactionId || '',
    date: formatDate(payment.paymentDate || payment.date || payment.createdAt || payment.updatedAt || order.createdAt),
    amount,
    paidAmount,
    status: normalizeStatus(payment.status || (paidAmount >= amount && amount > 0 ? 'paid' : 'pending'), paidAmount, amount),
    notes: payment.notes || '',
    attachments: Array.isArray(payment.attachments) ? payment.attachments : [],
    createdAt: payment.createdAt || new Date().toISOString(),
  };
};

// Fetches payment records from backend API with query parameters
const fetchPayments = async (params = {}) => {
  try {
    const queryParams = {
      limit: params?.limit ?? 100,
      page: params?.page ?? 1,
    };
    if (params?.status && params.status !== 'All') {
      queryParams.status = params.status.toLowerCase();
    }
    if (params?.method && params.method !== 'All') {
      queryParams.paymentMethod = params.method;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }
    if (params?.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params?.endDate) {
      queryParams.endDate = params.endDate;
    }

    const response = await apiClient.get('/api/v1/payments', { params: queryParams });
    const paymentList = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const allPayments = paymentList.map(mapPayment);
    let filtered = [...allPayments];
    // The server already filtered and paginated; only filter locally when it returned a bare list
    const serverFiltered = Boolean(response.data?.meta);

    if (!serverFiltered && params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.customerName.toLowerCase().includes(q) ||
          p.invoiceId.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q) ||
          (p.trxId && p.trxId.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    if (!serverFiltered && params.status && params.status !== 'All') {
      const s = params.status.toLowerCase();
      if (s === 'paid' || s === 'completed') {
        filtered = filtered.filter((p) => p.status === 'Completed' || p.status === 'Paid');
      } else {
        filtered = filtered.filter((p) => p.status.toLowerCase() === s);
      }
    }

    if (!serverFiltered && params.method && params.method !== 'All') {
      filtered = filtered.filter((p) => p.method.toLowerCase() === params.method.toLowerCase());
    }

    if (!serverFiltered && params.startDate) {
      const start = new Date(params.startDate).getTime();
      filtered = filtered.filter((p) => new Date(p.date).getTime() >= start);
    }

    if (!serverFiltered && params.endDate) {
      const end = new Date(params.endDate).getTime() + 86400000;
      filtered = filtered.filter((p) => new Date(p.date).getTime() <= end);
    }

    const total = response.data?.meta?.total ?? filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = (response.data?.meta?.totalPages ?? Math.ceil(total / limit)) || 1;
    const paginated = response.data?.meta ? filtered : filtered.slice((page - 1) * limit, page * limit);

    const totalCollected = response.data?.meta?.paidAmount ?? allPayments
      .filter((p) => p.status === 'Completed' || p.status === 'Paid')
      .reduce((s, p) => s + (p.paidAmount || p.amount || 0), 0);

    const totalPending = response.data?.meta?.pendingAmount ?? allPayments
      .filter((p) => p.status === 'Pending' || p.status === 'Partial')
      .reduce((s, p) => s + (p.amount - (p.paidAmount || 0)), 0);

    const totalFailed = allPayments
      .filter((p) => p.status === 'Failed')
      .reduce((s, p) => s + p.amount, 0);

    return {
      items: paginated,
      allItems: allPayments,
      filteredAll: filtered,
      summary: { totalCollected, totalPending, totalFailed, count: total },
      meta: response.data?.meta || { total, page, limit, totalPages },
    };
  } catch (err) {
    console.error('Failed to fetch payments from API:', err);
    return {
      items: [],
      allItems: [],
      filteredAll: [],
      summary: { totalCollected: 0, totalPending: 0, totalFailed: 0, count: 0 },
      meta: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 15, totalPages: 1 },
    };
  }
};

// React hook for payments list and mutations
export const usePayments = (params = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['payments', params],
    queryFn: () => fetchPayments(params),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/api/v1/payments', payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiClient.put(`/api/v1/payments/${id}`, payload);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/v1/payments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    },
  });

  return {
    ...query,
    payments: query.data?.items || [],
    allPayments: query.data?.allItems || [],
    filteredAll: query.data?.filteredAll || [],
    summary: query.data?.summary || { totalCollected: 0, totalPending: 0, totalFailed: 0, count: 0 },
    meta: query.data?.meta,
    createPayment: createPaymentMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
    isCreating: createPaymentMutation.isPending,
    isUpdating: updatePaymentMutation.isPending,
    isDeleting: deletePaymentMutation.isPending,
  };
};
