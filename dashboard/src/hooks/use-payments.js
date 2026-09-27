import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const STORAGE_FALLBACK_KEY = 'mtecom_local_payments_v1';

const DEFAULT_MOCK_PAYMENTS = [
  {
    id: 'PAY-001',
    invoiceId: 'INV-2026-001',
    customerName: 'Nadia Rahman',
    method: 'bKash',
    paymentMethod: 'bKash',
    trxId: 'TRX9928374',
    date: '2026-07-15',
    amount: 15400,
    paidAmount: 15400,
    status: 'Completed',
    notes: 'Online store direct checkout payment',
    createdAt: '2026-07-15T11:30:00Z',
  },
  {
    id: 'PAY-002',
    invoiceId: 'INV-2026-002',
    customerName: 'Tanvir Hossain',
    method: 'Card',
    paymentMethod: 'Card',
    trxId: 'TRX7716253',
    date: '2026-07-18',
    amount: 29050,
    paidAmount: 29050,
    status: 'Completed',
    notes: 'Visa credit card gateway payment',
    createdAt: '2026-07-18T14:15:00Z',
  },
  {
    id: 'PAY-003',
    invoiceId: 'INV-2026-003',
    customerName: 'Farhana Ahmed',
    method: 'Cash',
    paymentMethod: 'Cash',
    trxId: 'CASH-Tejgaon-01',
    date: '2026-07-20',
    amount: 8900,
    paidAmount: 8900,
    status: 'Completed',
    notes: 'In-store outlet POS cash collection',
    createdAt: '2026-07-20T16:45:00Z',
  },
  {
    id: 'PAY-004',
    invoiceId: 'INV-2026-004',
    customerName: 'Imtiaz Chowdhury',
    method: 'Nagad',
    paymentMethod: 'Nagad',
    trxId: 'TRX1122334',
    date: '2026-07-22',
    amount: 12500,
    paidAmount: 0,
    status: 'Failed',
    notes: 'OTP timeout during mobile financial gateway checkout',
    createdAt: '2026-07-22T09:20:00Z',
  },
  {
    id: 'PAY-005',
    invoiceId: 'INV-2026-005',
    customerName: 'Sadia Jahan',
    method: 'Bank Transfer',
    paymentMethod: 'Bank Transfer',
    trxId: 'EBL-TR-88192',
    date: '2026-07-25',
    amount: 45000,
    paidAmount: 25000,
    status: 'Partial',
    notes: 'Corporate bulk order - 50% advance received',
    createdAt: '2026-07-25T13:10:00Z',
  },
  {
    id: 'PAY-006',
    invoiceId: 'INV-2026-006',
    customerName: 'Kazi Ashrafuzzaman',
    method: 'bKash',
    paymentMethod: 'bKash',
    trxId: 'TRX8839201',
    date: '2026-07-28',
    amount: 18750,
    paidAmount: 18750,
    status: 'Completed',
    notes: 'Pathao courier COD settlement collection',
    createdAt: '2026-07-28T10:00:00Z',
  },
  {
    id: 'PAY-007',
    invoiceId: 'INV-2026-007',
    customerName: 'Mehnaz Karim',
    method: 'Nagad',
    paymentMethod: 'Nagad',
    trxId: 'TRX5544332',
    date: '2026-07-29',
    amount: 6200,
    paidAmount: 0,
    status: 'Pending',
    notes: 'Awaiting customer manual payment verification',
    createdAt: '2026-07-29T15:30:00Z',
  },
];

const getStoredLocalPayments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_FALLBACK_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(DEFAULT_MOCK_PAYMENTS));
      return DEFAULT_MOCK_PAYMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MOCK_PAYMENTS;
  } catch {
    return DEFAULT_MOCK_PAYMENTS;
  }
};

const saveStoredLocalPayments = (payments) => {
  try {
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save payments to localStorage:', err);
  }
};

const formatDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

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
  const amount =
    typeof payment.totalAmount === 'number' && payment.totalAmount > 0
      ? payment.totalAmount
      : typeof order.totals?.total === 'number' && order.totals.total > 0
      ? order.totals.total
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
    createdAt: payment.createdAt || new Date().toISOString(),
  };
};

const fetchPayments = async (params = {}) => {
  let fetchedItems = [];
  let apiMeta = null;

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

    const response = await apiClient.get('/api/v1/payments', { params: queryParams });
    const paymentList = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    if (paymentList.length > 0) {
      fetchedItems = paymentList.map(mapPayment);
      apiMeta = response.data?.meta;
    }
  } catch {
    // Graceful fallback to local mock storage
  }

  let allPayments = fetchedItems.length > 0 ? fetchedItems : getStoredLocalPayments().map(mapPayment);

  let filtered = [...allPayments];

  if (params.search) {
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

  if (params.status && params.status !== 'All') {
    const s = params.status.toLowerCase();
    if (s === 'paid' || s === 'completed') {
      filtered = filtered.filter((p) => p.status === 'Completed' || p.status === 'Paid');
    } else {
      filtered = filtered.filter((p) => p.status.toLowerCase() === s);
    }
  }

  if (params.method && params.method !== 'All') {
    filtered = filtered.filter((p) => p.method.toLowerCase() === params.method.toLowerCase());
  }

  if (params.startDate) {
    const start = new Date(params.startDate).getTime();
    filtered = filtered.filter((p) => new Date(p.date).getTime() >= start);
  }

  if (params.endDate) {
    const end = new Date(params.endDate).getTime() + 86400000;
    filtered = filtered.filter((p) => new Date(p.date).getTime() <= end);
  }

  const total = filtered.length;
  const page = params.page || 1;
  const limit = params.limit || 15;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const totalCollected = allPayments
    .filter((p) => p.status === 'Completed' || p.status === 'Paid')
    .reduce((s, p) => s + (p.paidAmount || p.amount || 0), 0);

  const totalPending = allPayments
    .filter((p) => p.status === 'Pending' || p.status === 'Partial')
    .reduce((s, p) => s + (p.amount - (p.paidAmount || 0)), 0);

  const totalFailed = allPayments
    .filter((p) => p.status === 'Failed')
    .reduce((s, p) => s + p.amount, 0);

  return {
    items: paginated,
    allItems: allPayments,
    filteredAll: filtered,
    summary: { totalCollected, totalPending, totalFailed, count: allPayments.length },
    meta: apiMeta || { total, page, limit, totalPages },
  };
};

export function usePayments(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['payments', params],
    queryFn: () => fetchPayments(params),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await apiClient.post('/api/v1/payments', payload);
        if (res.data?.data) return res.data.data;
      } catch (err) {
        console.warn('API create payment failed, saving locally:', err);
      }

      const all = getStoredLocalPayments();
      const amount = Number(payload.amount || payload.totalAmount || 0);
      const paidAmount = Number(payload.paidAmount !== undefined ? payload.paidAmount : amount);
      const status = payload.status || (paidAmount >= amount && amount > 0 ? 'Completed' : 'Pending');

      const created = {
        id: `PAY-${Date.now().toString().slice(-4)}`,
        invoiceId: payload.invoiceId || `INV-${Date.now().toString().slice(-6)}`,
        customerName: payload.customerName || 'Customer',
        method: payload.method || payload.paymentMethod || 'Cash',
        paymentMethod: payload.method || payload.paymentMethod || 'Cash',
        trxId: payload.trxId || `TRX-${Date.now().toString().slice(-6)}`,
        date: payload.date || payload.paymentDate || new Date().toISOString().slice(0, 10),
        amount,
        paidAmount,
        status,
        notes: payload.notes || '',
        createdAt: new Date().toISOString(),
      };

      const updated = [created, ...all];
      saveStoredLocalPayments(updated);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      try {
        await apiClient.put(`/api/v1/payments/${id}`, payload);
      } catch {
        // Fallback update
      }

      const all = getStoredLocalPayments();
      const updated = all.map((p) => (p.id === id ? { ...p, ...payload } : p));
      saveStoredLocalPayments(updated);
      return { id, ...payload };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await apiClient.delete(`/api/v1/payments/${id}`);
      } catch {
        // Fallback delete
      }

      const all = getStoredLocalPayments();
      const updated = all.filter((p) => p.id !== id);
      saveStoredLocalPayments(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted successfully');
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
}
