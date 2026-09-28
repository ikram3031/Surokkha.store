import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Search,
  Building,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Landmark,
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
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useInvestors } from '@/hooks/use-investors';
import { useInvestments } from '@/hooks/use-investments';
import { useMembers } from '@/hooks/use-members';
import { useSystemUsers } from '@/hooks/use-users';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const InvestorsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalOption, setModalOption] = useState('existing');
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [investorForm, setInvestorForm] = useState({
    name: '',
    type: 'Individual',
    email: '',
    phone: '',
    status: 'Active',
    notes: '',
    totalInvested: '',
    totalReturned: '',
    userId: null,
  });

  const {
    investors = [],
    allInvestors = [],
    meta = { totalPages: 1, total: 0 },
    isLoading,
    addInvestor,
    updateInvestor,
    deleteInvestor,
    isAdding,
    isUpdating,
    isDeleting,
  } = useInvestors({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    type: typeFilter !== 'All' ? typeFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const { allInvestments = [] } = useInvestments();
  const { data: membersResponse } = useMembers({ limit: 50 });
  const { data: usersResponse } = useSystemUsers({ limit: 50 });

  const membersList = membersResponse?.data || [];
  const usersList = usersResponse?.data || [];

  // Compute live portfolio metrics per investor
  const portfolioStats = useMemo(() => {
    const stats = {};
    allInvestments.forEach((inv) => {
      const invId = inv.investorId;
      if (!stats[invId]) {
        stats[invId] = { count: 0, taken: 0, returned: 0 };
      }
      stats[invId].count += 1;
      stats[invId].taken += Number(inv.takenAmount) || 0;
      stats[invId].returned += Number(inv.returnedAmount) || 0;
    });
    return stats;
  }, [allInvestments]);

  const totalPages = meta?.totalPages || 1;

  const totalCapitalInvested = useMemo(() => {
    return allInvestors.reduce((acc, curr) => {
      const live = portfolioStats[curr.id]?.taken;
      return acc + (live !== undefined ? live : Number(curr.totalInvested) || 0);
    }, 0);
  }, [allInvestors, portfolioStats]);

  const handleOpenAdd = () => {
    setEditingInvestor(null);
    setModalOption('existing');
    setInvestorForm({
      name: '',
      type: 'Individual',
      email: '',
      phone: '',
      status: 'Active',
      notes: '',
      totalInvested: '',
      totalReturned: '',
      userId: null,
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (inv) => {
    setEditingInvestor(inv);
    setInvestorForm({
      name: inv.name || '',
      type: inv.type || 'Individual',
      email: inv.email || '',
      phone: inv.phone || '',
      status: inv.status || 'Active',
      notes: inv.notes || '',
      totalInvested: inv.totalInvested !== undefined ? String(inv.totalInvested) : '',
      totalReturned: inv.totalReturned !== undefined ? String(inv.totalReturned) : '',
      userId: inv.userId || null,
    });
    setAddModalOpen(true);
  };

  const handleSelectUserOrMember = (id) => {
    const user = usersList.find((u) => u.id === id);
    if (user) {
      setInvestorForm((prev) => ({
        ...prev,
        name: user.name || user.email.split('@')[0],
        email: user.email || '',
        phone: user.phone || '',
        type: 'Individual',
        userId: user.id,
      }));
      return;
    }
    const member = membersList.find((m) => m.id === id);
    if (member) {
      setInvestorForm((prev) => ({
        ...prev,
        name: member.name || 'Member',
        email: member.email || '',
        phone: member.phone || '',
        type: 'Individual',
        userId: member.id,
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!investorForm.name.trim()) {
      toast.error('Investor name is required');
      return;
    }

    try {
      if (editingInvestor) {
        await updateInvestor({ id: editingInvestor.id, ...investorForm });
      } else {
        await addInvestor(investorForm);
      }
      setAddModalOpen(false);
    } catch {
      toast.error('Failed to save investor profile');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvestor(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete investor');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.investors_title', 'Investors Directory')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.investors_subtitle', 'Manage angel investors, institutional partners, and stakeholder capital profiles.')}
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
            <span>{t('accounts.add_investor_btn', 'Add Investor')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Registered Investors</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">{allInvestors.length} Investors</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Partners</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 mt-0.5">
              {allInvestors.filter((i) => i.status === 'Active').length} Active
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Cumulative Capital Invested</p>
            <p className="text-xl font-bold tracking-tight text-primary mt-0.5">{formatCurrency(totalCapitalInvested)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Landmark className="h-4 w-4" />
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
              placeholder="Search investors by name, email, phone..."
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
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v || 'All');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Investor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Organization">Organization</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
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
                <SelectItem value="Inactive">Inactive</SelectItem>
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
                <TableHead className="text-xs">Investor Name</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Contact Info</TableHead>
                <TableHead className="text-xs">Total Invested</TableHead>
                <TableHead className="text-xs">Total Returned</TableHead>
                <TableHead className="text-xs">Net Active Balance</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Joined Date</TableHead>
                <TableHead className="w-[110px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-20 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-36 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-16 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : investors.length > 0 ? (
                investors.map((inv) => {
                  const live = portfolioStats[inv.id];
                  const invested = live !== undefined ? live.taken : Number(inv.totalInvested) || 0;
                  const returned = live !== undefined ? live.returned : Number(inv.totalReturned) || 0;
                  const netBalance = Math.max(0, invested - returned);
                  const isActive = inv.status === 'Active';

                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-purple-500/15 text-purple-600 font-bold flex items-center justify-center text-xs">
                            {inv.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{inv.name}</div>
                            {inv.notes && <div className="text-[10px] text-muted-foreground font-normal line-clamp-1">{inv.notes}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] bg-muted/40 font-medium">
                          {inv.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          {inv.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> {inv.phone}</div>}
                          {inv.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground" /> {inv.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground font-mono">
                        {formatCurrency(invested)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600 font-mono">
                        {formatCurrency(returned)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-600 font-mono">
                        {formatCurrency(netBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                            onClick={() => navigate(`/dashboard/accounts/investments?investorId=${inv.id}`)}
                            title="View Investments"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            onClick={() => handleOpenEdit(inv)}
                            title="Edit Investor"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(inv)}
                            title="Delete Investor"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground text-xs">
                    No investors found matching your query.
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

      {/* Add / Edit Investor Modal with 2 Options */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              {editingInvestor ? 'Edit Investor Profile' : 'Add New Investor'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register an angel investor, stakeholder, or institutional partner.
            </DialogDescription>
          </DialogHeader>

          {!editingInvestor && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border">
              <button
                type="button"
                onClick={() => setModalOption('existing')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalOption === 'existing'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Option 1: Existing User / Member
              </button>
              <button
                type="button"
                onClick={() => setModalOption('manual')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalOption === 'manual'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit className="w-3.5 h-3.5 text-primary" />
                Option 2: Manual Entry
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 py-1 text-xs">
            {!editingInvestor && modalOption === 'existing' && (
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border">
                <label className="font-semibold text-foreground">
                  Select Registered User or Customer Member
                </label>
                <Select onValueChange={handleSelectUserOrMember}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Search and select existing user/member..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group-users" disabled className="font-bold text-[11px] text-muted-foreground">
                      -- System Users --
                    </SelectItem>
                    {usersList.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role} - {u.email})
                      </SelectItem>
                    ))}
                    <SelectItem value="group-members" disabled className="font-bold text-[11px] text-muted-foreground">
                      -- Customer Directory --
                    </SelectItem>
                    {membersList.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name || 'Member'} ({m.phone || m.email || m.did})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Full Name / Organization <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Sabbir Hossain / Apex VC"
                  value={investorForm.name}
                  onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Investor Type</label>
                <Select
                  value={investorForm.type}
                  onValueChange={(v) => setInvestorForm({ ...investorForm, type: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual Investor</SelectItem>
                    <SelectItem value="Organization">Organization / VC</SelectItem>
                    <SelectItem value="Partner">Business Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Contact Phone</label>
                <Input
                  placeholder="e.g. 01711-XXXXXX"
                  value={investorForm.phone}
                  onChange={(e) => setInvestorForm({ ...investorForm, phone: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. investor@domain.com"
                  value={investorForm.email}
                  onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Status</label>
              <Select
                value={investorForm.status}
                onValueChange={(v) => setInvestorForm({ ...investorForm, status: v })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Notes / Investment Strategy</label>
              <Textarea
                placeholder="Details on equity stake, dividend terms, or partnership notes..."
                value={investorForm.notes}
                onChange={(e) => setInvestorForm({ ...investorForm, notes: e.target.value })}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? 'Saving...' : editingInvestor ? 'Update Profile' : 'Save Investor'}
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
        title="Delete Investor"
        description={`Are you sure you want to delete investor profile "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default InvestorsPage;
