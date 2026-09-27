import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STORAGE_KEY = 'mtecom_investors_v1';

const DEFAULT_INVESTORS = [
  {
    id: 'INV-001',
    name: 'Sabbir Hossain',
    type: 'Individual',
    phone: '01711-234567',
    email: 'sabbir.invest@gmail.com',
    status: 'Active',
    totalInvested: 500000,
    totalReturned: 150000,
    notes: 'Angel investor - seed phase round',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'INV-002',
    name: 'Apex Venture Capital',
    type: 'Organization',
    phone: '01822-987654',
    email: 'contact@apexvc.com.bd',
    status: 'Active',
    totalInvested: 1200000,
    totalReturned: 0,
    notes: 'Strategic scale-up debt & equity tranche',
    createdAt: '2026-02-10T14:30:00Z',
  },
  {
    id: 'INV-003',
    name: 'Mahmudul Hasan',
    type: 'Partner',
    phone: '01933-445566',
    email: 'mahmud.partner@domain.com',
    status: 'Active',
    totalInvested: 300000,
    totalReturned: 300000,
    notes: 'Inventory bridge financing - fully settled',
    createdAt: '2026-03-01T09:15:00Z',
  },
  {
    id: 'INV-004',
    name: 'Rahim Chowdhury',
    type: 'Individual',
    phone: '01677-112233',
    email: 'rahim.c@outlook.com',
    status: 'Active',
    totalInvested: 400000,
    totalReturned: 100000,
    notes: 'Seasonal campaign working capital partner',
    createdAt: '2026-04-12T11:20:00Z',
  },
];

const getStoredInvestors = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVESTORS));
      return DEFAULT_INVESTORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INVESTORS;
  } catch {
    return DEFAULT_INVESTORS;
  }
};

const saveStoredInvestors = (investors) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investors));
  } catch (err) {
    console.error('Failed to save investors to localStorage:', err);
  }
};

export function useInvestors(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['investors', params],
    queryFn: async () => {
      let items = getStoredInvestors();

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.email && i.email.toLowerCase().includes(q)) ||
            (i.phone && i.phone.toLowerCase().includes(q)) ||
            (i.notes && i.notes.toLowerCase().includes(q))
        );
      }

      if (params.status && params.status !== 'All') {
        items = items.filter(
          (i) => i.status.toLowerCase() === params.status.toLowerCase()
        );
      }

      if (params.type && params.type !== 'All') {
        items = items.filter(
          (i) => i.type.toLowerCase() === params.type.toLowerCase()
        );
      }

      if (params.startDate) {
        const start = new Date(params.startDate).getTime();
        items = items.filter((i) => new Date(i.createdAt).getTime() >= start);
      }

      if (params.endDate) {
        const end = new Date(params.endDate).getTime() + 86400000;
        items = items.filter((i) => new Date(i.createdAt).getTime() <= end);
      }

      const total = items.length;
      const page = params.page || 1;
      const limit = params.limit || 15;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedItems = items.slice((page - 1) * limit, page * limit);

      return {
        items: paginatedItems,
        allInvestors: getStoredInvestors(),
        meta: { total, page, limit, totalPages },
      };
    },
    staleTime: 1000 * 60,
  });

  const addInvestorMutation = useMutation({
    mutationFn: async (newInv) => {
      const all = getStoredInvestors();
      const created = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        name: newInv.name.trim(),
        type: newInv.type || 'Individual',
        phone: newInv.phone?.trim() || '',
        email: newInv.email?.trim().toLowerCase() || '',
        status: newInv.status || 'Active',
        totalInvested: Number(newInv.totalInvested) || 0,
        totalReturned: Number(newInv.totalReturned) || 0,
        notes: newInv.notes?.trim() || '',
        userId: newInv.userId || null,
        createdAt: new Date().toISOString(),
      };
      const updated = [created, ...all];
      saveStoredInvestors(updated);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor added successfully');
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const all = getStoredInvestors();
      const updated = all.map((i) => (i.id === id ? { ...i, ...updates } : i));
      saveStoredInvestors(updated);
      return updated.find((i) => i.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor updated successfully');
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id) => {
      const all = getStoredInvestors();
      const updated = all.filter((i) => i.id !== id);
      saveStoredInvestors(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor deleted successfully');
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
}
