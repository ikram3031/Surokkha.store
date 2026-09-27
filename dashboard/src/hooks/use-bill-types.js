import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STORAGE_KEY = 'mtecom_bill_types_v1';

const DEFAULT_BILL_TYPES = [
  {
    id: 'BT-001',
    name: 'Office Rent & Space',
    description: 'Monthly office and warehouse rental expenses',
    status: 'Active',
    color: 'blue',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'BT-002',
    name: 'Electricity & Utilities',
    description: 'Power, water, gas, and internet bandwidth bills',
    status: 'Active',
    color: 'amber',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'BT-003',
    name: 'Salaries & Wages',
    description: 'Employee salaries, contractor stipends, and bonuses',
    status: 'Active',
    color: 'emerald',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'BT-004',
    name: 'Logistics & Courier',
    description: 'Shipping fees, return parcel charges, and delivery fulfillment',
    status: 'Active',
    color: 'purple',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'BT-005',
    name: 'Marketing & Advertising',
    description: 'Meta ads, Google ads, influencer promotion, and creative assets',
    status: 'Active',
    color: 'pink',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'BT-006',
    name: 'Server & Cloud Subscriptions',
    description: 'Cloud hosting, domain renewals, CDN, and SaaS licenses',
    status: 'Active',
    color: 'cyan',
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'BT-007',
    name: 'Packaging & Supplies',
    description: 'Cartons, poly bags, tape, bubble wrap, and invoice stickers',
    status: 'Active',
    color: 'orange',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'BT-008',
    name: 'Stock & Inventory Purchase',
    description: 'Raw materials, bulk inventory import, and supplier bills',
    status: 'Active',
    color: 'indigo',
    createdAt: '2026-01-18T00:00:00Z',
  },
  {
    id: 'BT-009',
    name: 'Maintenance & Repairs',
    description: 'Office maintenance, electrical repairs, and equipment servicing',
    status: 'Active',
    color: 'slate',
    createdAt: '2026-02-01T00:00:00Z',
  },
];

const getStoredBillTypes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BILL_TYPES));
      return DEFAULT_BILL_TYPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BILL_TYPES;
  } catch {
    return DEFAULT_BILL_TYPES;
  }
};

const saveStoredBillTypes = (types) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  } catch (err) {
    console.error('Failed to save bill types to localStorage:', err);
  }
};

export function useBillTypes(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bill-types', params],
    queryFn: async () => {
      let items = getStoredBillTypes();

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        items = items.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
      }

      if (params.status && params.status !== 'All') {
        items = items.filter(
          (t) => t.status.toLowerCase() === params.status.toLowerCase()
        );
      }

      if (params.startDate) {
        const start = new Date(params.startDate).getTime();
        items = items.filter((t) => new Date(t.createdAt).getTime() >= start);
      }

      if (params.endDate) {
        const end = new Date(params.endDate).getTime() + 86400000;
        items = items.filter((t) => new Date(t.createdAt).getTime() <= end);
      }

      const total = items.length;
      const page = params.page || 1;
      const limit = params.limit || 15;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedItems = items.slice((page - 1) * limit, page * limit);

      return {
        items: paginatedItems,
        allItems: getStoredBillTypes(),
        meta: { total, page, limit, totalPages },
      };
    },
    staleTime: 1000 * 60,
  });

  const addTypeMutation = useMutation({
    mutationFn: async (newType) => {
      const all = getStoredBillTypes();
      const created = {
        id: `BT-${Date.now().toString().slice(-4)}`,
        name: newType.name.trim(),
        description: newType.description?.trim() || '',
        status: newType.status || 'Active',
        color: newType.color || 'blue',
        createdAt: new Date().toISOString(),
      };
      const updated = [created, ...all];
      saveStoredBillTypes(updated);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type created successfully');
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const all = getStoredBillTypes();
      const updated = all.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveStoredBillTypes(updated);
      return updated.find((t) => t.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type updated successfully');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id) => {
      const all = getStoredBillTypes();
      const updated = all.filter((t) => t.id !== id);
      saveStoredBillTypes(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-types'] });
      toast.success('Bill type deleted successfully');
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
}
