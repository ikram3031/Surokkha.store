import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  Landmark,
  Calendar,
  CreditCard,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CornerDownLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useInvestments } from '@/hooks/use-investments';
import { useInvestors } from '@/hooks/use-investors';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const InvestmentsListPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialInvestorId = searchParams.get('investorId') || 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [investorFilter, setInvestorFilter] = useState(initialInvestorId);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [repayTarget, setRepayTarget] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    investorId: '',
    investorName: '',
    takenAmount: '',
    returnedAmount: '0',
    takenDate: new Date().toISOString().slice(0, 10),
    returnedDate: '',
    paymentMethod: 'Bank Transfer',
    status: 'Active',
    notes: '',
  });

  const { allInvestors = [] } = useInvestors();

  const {
    investments = [],
    summary = { totalTaken: 0, totalReturned: 0, netOutstanding: 0 },
    meta = { totalPages: 1, total: 0 },
    isLoading,
    addInvestment,
    updateInvestment,
    recordReturn,
    deleteInvestment,
    isAdding,
    isUpdating,
    isDeleting,
  } = useInvestments({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    investorId: investorFilter !== 'All' ? investorFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 15,
  });

  useEffect(() => {
    if (initialInvestorId && initialInvestorId !== 'All') {
      setInvestorFilter(initialInvestorId);
    }
  }, [initialInvestorId]);

  const totalPages = meta?.totalPages || 1;

  const handleOpenAdd = () => {
    setEditingInv(null);
    const firstInvestor = allInvestors[0];
    setFormData({
      investorId: firstInvestor ? firstInvestor.id : '',
      investorName: firstInvestor ? firstInvestor.name : '',
      takenAmount: '',
      returnedAmount: '0',
      takenDate: new Date().toISOString().slice(0, 10),
      returnedDate: '',
      paymentMethod: 'Bank Transfer',
      status: 'Active',
      notes: '',
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (inv) => {
    setEditingInv(inv);
    setFormData({
      investorId: inv.investorId,
      investorName: inv.investorName,
      takenAmount: String(inv.takenAmount || ''),
      returnedAmount: String(inv.returnedAmount || '0'),
      takenDate: inv.takenDate || '',
      returnedDate: inv.returnedDate || '',
      paymentMethod: inv.paymentMethod || 'Bank Transfer',
      status: inv.status || 'Active',
      notes: inv.notes || '',
    });
    setAddModalOpen(true);
  };

  const handleSelectInvestor = (id) => {
    const inv = allInvestors.find((i) => i.id === id);
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        investorId: inv.id,
        investorName: inv.name,
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.investorId || !formData.investorName) {
      toast.error('Please select an investor');
      return;
    }
    if (!formData.takenAmount || Number(formData.takenAmount) <= 0) {
      toast.error('Please enter a valid taken investment amount');
      return;
    }

    try {
      if (editingInv) {
        await updateInvestment({ id: editingInv.id, ...formData });
      } else {
        await addInvestment(formData);
      }
      setAddModalOpen(false);
    } catch {
      toast.error('Failed to save investment record');
    }
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    if (!repayAmount || Number(repayAmount) <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }

    try {
      await recordReturn({
        id: repayTarget.id,
        returnAmountToAdd: Number(repayAmount),
        notes: repayNotes.trim(),
      });
      setRepayTarget(null);
      setRepayAmount('');
      setRepayNotes('');
    } catch {
      toast.error('Failed to record repayment');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvestment(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete investment');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Returned':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" /> Returned
          </Badge>
        );
      case 'Active':
        return (
          <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 gap-1" variant="outline">
            <TrendingUp className="h-3 w-3" /> Active
          </Badge>
        );
      case 'Partial':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1" variant="outline">
            <AlertCircle className="h-3 w-3" /> Partial Return
          </Badge>
        );
      case 'Pending':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1" variant="outline">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground" variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.investments_title', 'Investments Portfolio')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.investments_subtitle', 'Track all capital tranches taken, repayment terms, and return status.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleOpenAdd}
            className="h-9 text-xs gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('accounts.add_investment_btn', 'Add Investment')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Taken Capital</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">{formatCurrency(summary.totalTaken)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Landmark className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Returned Capital</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 mt-0.5">{formatCurrency(summary.totalReturned)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Net Outstanding Due</p>
            <p className="text-xl font-bold tracking-tight text-purple-600 mt-0.5">{formatCurrency(summary.netOutstanding)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b bg-muted/20 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by investor name, ID, notes..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={investorFilter}
              onValueChange={(v) => {
                setInvestorFilter(v || 'All');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Investor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Investors</SelectItem>
                {allInvestors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v || 'All');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Partial">Partial Return</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <DateRangeFilter
              value={dateRange.preset}
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs">Tranche Ref</TableHead>
                <TableHead className="text-xs">Investor</TableHead>
                <TableHead className="text-xs">Taken Amount</TableHead>
                <TableHead className="text-xs">Returned Amount</TableHead>
                <TableHead className="text-xs">Net Outstanding</TableHead>
                <TableHead className="text-xs">Taken Date</TableHead>
                <TableHead className="text-xs">Return / Maturity</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-[100px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-16 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : investments.length > 0 ? (
                investments.map((inv) => {
                  const taken = Number(inv.takenAmount) || 0;
                  const returned = Number(inv.returnedAmount) || 0;
                  const outstanding = Math.max(0, taken - returned);

                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {inv.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-foreground line-clamp-1">{inv.investorName}</div>
                        {inv.notes && <div className="text-[11px] text-muted-foreground line-clamp-1">{inv.notes}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground font-mono">
                        {formatCurrency(taken)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600 font-mono">
                        {formatCurrency(returned)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-600 font-mono">
                        {formatCurrency(outstanding)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {inv.takenDate || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {inv.returnedDate || 'Ongoing'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-muted/40">
                          {inv.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Actions</span>
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuLabel>Investment Actions</DropdownMenuLabel>
                            {outstanding > 0 && (
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-emerald-600 font-semibold"
                                onClick={() => setRepayTarget(inv)}
                              >
                                <CornerDownLeft className="w-3.5 h-3.5" />
                                <span>Record Repayment</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer gap-2"
                              onClick={() => handleOpenEdit(inv)}
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-500" />
                              <span>Edit Investment</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer gap-2"
                              onClick={() => setDeleteTarget(inv)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Record</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-muted-foreground text-xs">
                    No investment records found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 bg-muted/10">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage((p) => p - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Add / Edit Investment Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Landmark className="w-5 h-5 text-purple-600" />
              {editingInv ? 'Edit Investment Record' : 'Record New Investment Tranche'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select investor and record taken/returned capital details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-1 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Select Investor <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.investorId}
                onValueChange={handleSelectInvestor}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Investor" />
                </SelectTrigger>
                <SelectContent>
                  {allInvestors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.type} - {i.phone || i.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Taken Amount (৳) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.takenAmount}
                  onChange={(e) => setFormData({ ...formData, takenAmount: e.target.value })}
                  className="text-xs font-semibold font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Returned Amount (৳)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.returnedAmount}
                  onChange={(e) => setFormData({ ...formData, returnedAmount: e.target.value })}
                  className="text-xs font-semibold font-mono text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Taken Date</label>
                <Input
                  type="date"
                  value={formData.takenDate}
                  onChange={(e) => setFormData({ ...formData, takenDate: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Expected Return / Maturity</label>
                <Input
                  type="date"
                  value={formData.returnedDate}
                  onChange={(e) => setFormData({ ...formData, returnedDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Payment Method</label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="bKash">bKash</SelectItem>
                    <SelectItem value="Nagad">Nagad</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Partial">Partial Return</SelectItem>
                    <SelectItem value="Returned">Returned (Settled)</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Notes / Tranche Terms</label>
              <Textarea
                placeholder="Profit share terms, duration, dividend schedule..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? 'Saving...' : editingInv ? 'Update Investment' : 'Save Investment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Repayment Modal */}
      <Dialog open={!!repayTarget} onOpenChange={(open) => !open && setRepayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-600">
              <CornerDownLeft className="w-5 h-5" />
              Record Repayment to Investor
            </DialogTitle>
            <DialogDescription className="text-xs">
              {repayTarget?.investorName} — Outstanding Balance: {formatCurrency(Math.max(0, (repayTarget?.takenAmount || 0) - (repayTarget?.returnedAmount || 0)))}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordRepayment} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Repayment Amount to Add (৳) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="any"
                placeholder="0.00"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="text-xs font-bold font-mono text-emerald-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Repayment Remarks</label>
              <Input
                placeholder="e.g. Q2 Dividend / Principal return via EBL bank"
                value={repayNotes}
                onChange={(e) => setRepayNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRepayTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Repayment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete Investment Record"
        description={`Are you sure you want to delete investment record ${deleteTarget?.id} for "${deleteTarget?.investorName}"?`}
      />
    </div>
  );
};

export default InvestmentsListPage;
