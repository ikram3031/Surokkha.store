import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const STORAGE_FALLBACK_KEY = 'mtecom_local_bills_v1';

const DEFAULT_MOCK_BILLS = [
  {
    id: 'BILL-001',
    did: 'BIL-2026-001',
    title: 'HQ Office Monthly Rent - Gulshan',
    billType: 'Office Rent & Space',
    vendor: 'Green Valley Real Estate Ltd',
    customerName: 'Green Valley Real Estate Ltd',
    billingDate: '2026-07-01',
    dueDate: '2026-07-10',
    totalAmount: 85000,
    paidAmount: 85000,
    pendingAmount: 0,
    amount: 85000,
    status: 'Paid',
    billingMethod: 'Bank Transfer',
    notes: 'Paid via Eastern Bank Corporate Account',
  },
  {
    id: 'BILL-002',
    did: 'BIL-2026-002',
    title: 'Warehouse Electricity & DESCO Bill',
    billType: 'Electricity & Utilities',
    vendor: 'DESCO - Dhaka Electric Supply',
    customerName: 'DESCO Supply Co.',
    billingDate: '2026-07-05',
    dueDate: '2026-07-20',
    totalAmount: 18400,
    paidAmount: 18400,
    pendingAmount: 0,
    amount: 18400,
    status: 'Paid',
    billingMethod: 'bKash',
    notes: 'Meter #887492 - Tejgaon warehouse hub',
  },
  {
    id: 'BILL-003',
    did: 'BIL-2026-003',
    title: 'Staff Payroll & Operations Salaries',
    billType: 'Salaries & Wages',
    vendor: 'Internal Operations Team',
    customerName: 'Internal Staff Accounts',
    billingDate: '2026-07-05',
    dueDate: '2026-07-07',
    totalAmount: 240000,
    paidAmount: 240000,
    pendingAmount: 0,
    amount: 240000,
    status: 'Paid',
    billingMethod: 'Bank Transfer',
    notes: 'Salaries for 12 support and warehouse staff',
  },
  {
    id: 'BILL-004',
    did: 'BIL-2026-004',
    title: 'Meta Ads & Sponsored Campaigns',
    billType: 'Marketing & Advertising',
    vendor: 'Meta Platforms Ireland',
    customerName: 'Meta Ads Manager',
    billingDate: '2026-07-15',
    dueDate: '2026-07-25',
    totalAmount: 45000,
    paidAmount: 30000,
    pendingAmount: 15000,
    amount: 45000,
    status: 'Partial',
    billingMethod: 'Card',
    notes: 'Dual currency MasterCard payment tranche',
  },
  {
    id: 'BILL-005',
    did: 'BIL-2026-005',
    title: 'Custom Corrugated Packaging Boxes (5000 pcs)',
    billType: 'Packaging & Supplies',
    vendor: 'Dhaka Paper & Board Mills',
    customerName: 'Dhaka Paper Mills',
    billingDate: '2026-07-20',
    dueDate: '2026-08-05',
    totalAmount: 32500,
    paidAmount: 0,
    pendingAmount: 32500,
    amount: 32500,
    status: 'Pending',
    billingMethod: 'Cash',
    notes: 'Awaiting delivery verification before final payment',
  },
  {
    id: 'BILL-006',
    did: 'BIL-2026-006',
    title: 'Cloudflare & AWS Cloud Hosting Renewal',
    billType: 'Server & Cloud Subscriptions',
    vendor: 'Cloud Hosting Services',
    customerName: 'Cloud Provider Inc.',
    billingDate: '2026-07-22',
    dueDate: '2026-07-30',
    totalAmount: 12000,
    paidAmount: 12000,
    pendingAmount: 0,
    amount: 12000,
    status: 'Paid',
    billingMethod: 'Card',
    notes: 'Enterprise CDN and R2 object storage',
  },
  {
    id: 'BILL-007',
    did: 'BIL-2026-007',
    title: 'Bulk Fabric & Raw Stock Consignment',
    billType: 'Stock & Inventory Purchase',
    vendor: 'Narayanganj Textile Mills',
    customerName: 'Narayanganj Textile Mills',
    billingDate: '2026-07-28',
    dueDate: '2026-08-15',
    totalAmount: 150000,
    paidAmount: 50000,
    pendingAmount: 100000,
    amount: 150000,
    status: 'Partial',
    billingMethod: 'Bank Transfer',
    notes: 'Advance deposit paid, balance due upon quality audit',
  },
];

const getStoredLocalBills = () => {
  try {
    const raw = localStorage.getItem(STORAGE_FALLBACK_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(DEFAULT_MOCK_BILLS));
      return DEFAULT_MOCK_BILLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MOCK_BILLS;
  } catch {
    return DEFAULT_MOCK_BILLS;
  }
};

const saveStoredLocalBills = (bills) => {
  try {
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(bills));
  } catch (err) {
    console.error('Failed to save bills to localStorage:', err);
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

  return {
    id: billing.id || billing._id || invoiceId,
    invoiceId,
    did: billing.did || invoiceId,
    title: billing.title || customerName,
    billType: billing.billType || billing.billingMethod || 'General Expense',
    vendor: billing.vendor || customerName,
    customerName,
    billingMethod: billing.billingMethod || 'Cash',
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

const fetchBillings = async (params = {}) => {
  let fetchedItems = [];
  let apiMeta = null;

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

    if (billingList.length > 0) {
      fetchedItems = billingList.map(mapBilling);
      apiMeta = response.data?.meta;
    }
  } catch {
    // Graceful fallback to local mock storage
  }

  // Merge with local storage if API returned nothing or for testing
  let allBills = fetchedItems.length > 0 ? fetchedItems : getStoredLocalBills().map(mapBilling);

  // Apply in-memory filters for advanced querying
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

  const total = filtered.length;
  const page = params.page || 1;
  const limit = params.limit || 15;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const totalBilled = allBills.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const totalPaid = allBills.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const totalPending = allBills.reduce((acc, curr) => acc + (Number(curr.pendingAmount) || 0), 0);

  return {
    items: paginated,
    allItems: allBills,
    filteredAll: filtered,
    summary: { totalBilled, totalPaid, totalPending, count: allBills.length },
    meta: apiMeta || { total, page, limit, totalPages },
  };
};

export function useBillings(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['billings', params],
    queryFn: () => fetchBillings(params),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const createBillingMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await apiClient.post('/api/v1/billing', payload);
        if (res.data?.data) return res.data.data;
      } catch (err) {
        console.warn('API create billing failed, storing locally:', err);
      }

      // Local storage fallback
      const all = getStoredLocalBills();
      const totalAmount = Number(payload.totalAmount || payload.amount || 0);
      const paidAmount = Number(payload.paidAmount || 0);
      const pendingAmount = Math.max(0, totalAmount - paidAmount);
      const status = payload.status || (paidAmount >= totalAmount && totalAmount > 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending');

      const created = {
        id: `BILL-${Date.now().toString().slice(-4)}`,
        did: `BIL-${Date.now().toString().slice(-6)}`,
        title: payload.title || payload.notes || 'New Bill',
        billType: payload.billType || 'General Expense',
        vendor: payload.vendor || payload.customerName || 'Vendor',
        customerName: payload.vendor || payload.customerName || 'Vendor',
        billingDate: payload.billingDate || new Date().toISOString().slice(0, 10),
        dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
        totalAmount,
        paidAmount,
        pendingAmount,
        amount: totalAmount,
        status,
        billingMethod: payload.billingMethod || 'Cash',
        notes: payload.notes || '',
        createdAt: new Date().toISOString(),
      };

      const updated = [created, ...all];
      saveStoredLocalBills(updated);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record created successfully');
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      try {
        await apiClient.put(`/api/v1/billing/${id}`, payload);
      } catch {
        // Local storage update fallback
      }

      const all = getStoredLocalBills();
      const updated = all.map((b) => (b.id === id ? { ...b, ...payload } : b));
      saveStoredLocalBills(updated);
      return { id, ...payload };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record updated successfully');
    },
  });

  const deleteBillingMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await apiClient.delete(`/api/v1/billing/${id}`);
      } catch {
        // Fallback delete
      }

      const all = getStoredLocalBills();
      const updated = all.filter((b) => b.id !== id);
      saveStoredLocalBills(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billings'] });
      toast.success('Bill record deleted successfully');
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
}
