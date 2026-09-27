import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STORAGE_KEY = 'mtecom_investments_v1';

const DEFAULT_INVESTMENTS = [
  {
    id: 'INVST-001',
    investorId: 'INV-001',
    investorName: 'Sabbir Hossain',
    takenAmount: 500000,
    returnedAmount: 150000,
    takenDate: '2026-01-20',
    returnedDate: '2026-07-20',
    paymentMethod: 'Bank Transfer',
    status: 'Partial',
    notes: 'Q1 Seed round tranche - 30% repaid so far',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'INVST-002',
    investorId: 'INV-002',
    investorName: 'Apex Venture Capital',
    takenAmount: 1200000,
    returnedAmount: 0,
    takenDate: '2026-02-15',
    returnedDate: '2026-12-31',
    paymentMethod: 'Bank Transfer',
    status: 'Active',
    notes: 'Growth working capital facility',
    createdAt: '2026-02-15T12:00:00Z',
  },
  {
    id: 'INVST-003',
    investorId: 'INV-003',
    investorName: 'Mahmudul Hasan',
    takenAmount: 300000,
    returnedAmount: 300000,
    takenDate: '2026-03-05',
    returnedDate: '2026-06-05',
    paymentMethod: 'bKash',
    status: 'Returned',
    notes: 'Eid stock advance loan - 100% cleared and returned',
    createdAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'INVST-004',
    investorId: 'INV-004',
    investorName: 'Rahim Chowdhury',
    takenAmount: 400000,
    returnedAmount: 100000,
    takenDate: '2026-04-15',
    returnedDate: '2026-10-15',
    paymentMethod: 'Cash',
    status: 'Partial',
    notes: 'Warehouse shelving and logistics upgrade',
    createdAt: '2026-04-15T16:00:00Z',
  },
];

const getStoredInvestments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVESTMENTS));
      return DEFAULT_INVESTMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INVESTMENTS;
  } catch {
    return DEFAULT_INVESTMENTS;
  }
};

const saveStoredInvestments = (investments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  } catch (err) {
    console.error('Failed to save investments to localStorage:', err);
  }
};

const calculateStatus = (taken, returned, manualStatus) => {
  if (manualStatus && ['Returned', 'Pending'].includes(manualStatus)) return manualStatus;
  if (returned >= taken && taken > 0) return 'Returned';
  if (returned > 0 && returned < taken) return 'Partial';
  return manualStatus || 'Active';
};

export function useInvestments(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['investments', params],
    queryFn: async () => {
      let items = getStoredInvestments();

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        items = items.filter(
          (inv) =>
            inv.investorName.toLowerCase().includes(q) ||
            inv.id.toLowerCase().includes(q) ||
            (inv.notes && inv.notes.toLowerCase().includes(q)) ||
            (inv.paymentMethod && inv.paymentMethod.toLowerCase().includes(q))
        );
      }

      if (params.status && params.status !== 'All') {
        items = items.filter(
          (inv) => inv.status.toLowerCase() === params.status.toLowerCase()
        );
      }

      if (params.investorId && params.investorId !== 'All') {
        items = items.filter((inv) => inv.investorId === params.investorId);
      }

      if (params.startDate) {
        const start = new Date(params.startDate).getTime();
        items = items.filter((inv) => new Date(inv.takenDate || inv.createdAt).getTime() >= start);
      }

      if (params.endDate) {
        const end = new Date(params.endDate).getTime() + 86400000;
        items = items.filter((inv) => new Date(inv.takenDate || inv.createdAt).getTime() <= end);
      }

      const total = items.length;
      const page = params.page || 1;
      const limit = params.limit || 15;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedItems = items.slice((page - 1) * limit, page * limit);

      const allItems = getStoredInvestments();
      const totalTaken = allItems.reduce((acc, curr) => acc + (Number(curr.takenAmount) || 0), 0);
      const totalReturned = allItems.reduce((acc, curr) => acc + (Number(curr.returnedAmount) || 0), 0);
      const netOutstanding = Math.max(0, totalTaken - totalReturned);

      return {
        items: paginatedItems,
        allItems,
        summary: {
          totalTaken,
          totalReturned,
          netOutstanding,
          count: allItems.length,
        },
        meta: { total, page, limit, totalPages },
      };
    },
    staleTime: 1000 * 60,
  });

  const addInvestmentMutation = useMutation({
    mutationFn: async (newInv) => {
      const all = getStoredInvestments();
      const takenAmount = Number(newInv.takenAmount) || 0;
      const returnedAmount = Number(newInv.returnedAmount) || 0;
      const status = calculateStatus(takenAmount, returnedAmount, newInv.status);

      const created = {
        id: `INVST-${Date.now().toString().slice(-4)}`,
        investorId: newInv.investorId,
        investorName: newInv.investorName,
        takenAmount,
        returnedAmount,
        takenDate: newInv.takenDate || new Date().toISOString().slice(0, 10),
        returnedDate: newInv.returnedDate || '',
        paymentMethod: newInv.paymentMethod || 'Bank Transfer',
        status,
        notes: newInv.notes?.trim() || '',
        createdAt: new Date().toISOString(),
      };
      const updated = [created, ...all];
      saveStoredInvestments(updated);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment recorded successfully');
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const all = getStoredInvestments();
      const updated = all.map((inv) => {
        if (inv.id !== id) return inv;
        const takenAmount = updates.takenAmount !== undefined ? Number(updates.takenAmount) : inv.takenAmount;
        const returnedAmount = updates.returnedAmount !== undefined ? Number(updates.returnedAmount) : inv.returnedAmount;
        const status = updates.status || calculateStatus(takenAmount, returnedAmount, inv.status);
        return {
          ...inv,
          ...updates,
          takenAmount,
          returnedAmount,
          status,
        };
      });
      saveStoredInvestments(updated);
      return updated.find((inv) => inv.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment updated successfully');
    },
  });

  const recordReturnMutation = useMutation({
    mutationFn: async ({ id, returnAmountToAdd, notes }) => {
      const all = getStoredInvestments();
      const updated = all.map((inv) => {
        if (inv.id !== id) return inv;
        const newReturned = (Number(inv.returnedAmount) || 0) + (Number(returnAmountToAdd) || 0);
        const status = calculateStatus(inv.takenAmount, newReturned);
        return {
          ...inv,
          returnedAmount: newReturned,
          status,
          notes: notes ? `${inv.notes || ''} [Returned ৳${returnAmountToAdd}: ${notes}]`.trim() : inv.notes,
        };
      });
      saveStoredInvestments(updated);
      return updated.find((inv) => inv.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Repayment recorded successfully');
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id) => {
      const all = getStoredInvestments();
      const updated = all.filter((inv) => inv.id !== id);
      saveStoredInvestments(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investment deleted successfully');
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
    isAdding: addInvestmentMutation.isPending,
    isUpdating: updateInvestmentMutation.isPending,
    isDeleting: deleteInvestmentMutation.isPending,
  };
}
