import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  Building2,
  Smartphone,
  Banknote,
  SlidersHorizontal,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  Landmark,
  ShieldCheck,
  FileText,
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
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { usePaymentTypes } from '@/hooks/use-payment-types';
import { usePayments } from '@/hooks/use-payments';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = [
  { value: 'mfs', label: 'MFS / Mobile Wallet', icon: Smartphone, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { value: 'bank', label: 'Bank Account', icon: Landmark, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { value: 'cash', label: 'Cash / COD', icon: Banknote, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'card', label: 'Card / POS Terminal', icon: CreditCard, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { value: 'gateway', label: 'Online Gateway', icon: Sparkles, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { value: 'other', label: 'Other Method', icon: Layers, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
];

const INITIAL_FORM = {
  name: '',
  category: 'mfs',
  provider: 'bKash',
  accountNumber: '',
  accountName: '',
  accountType: 'Personal',
  branchName: '',
  routingNumber: '',
  chargePercent: 0,
  instructions: '',
  description: '',
  status: 'Active',
  isDefault: false,
};

export const PaymentTypesPage = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingMethod, setViewingMethod] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(INITIAL_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    paymentTypes = [],
    allPaymentTypes = [],
    meta = { totalPages: 1, total: 0 },
    isLoading,
    refetch,
    addPaymentType,
    updatePaymentType,
    deletePaymentType,
    bulkUpdatePaymentTypes,
    bulkDeletePaymentTypes,
    isAdding,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    isBulkDeleting,
  } = usePaymentTypes({
    search: searchQuery || undefined,
    category: categoryFilter !== 'All' ? categoryFilter.toLowerCase() : undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const { allPayments = [] } = usePayments();

  // Compute payment stats per method
  const typeStats = useMemo(() => {
    const counts = {};
    const volumes = {};
    allPayments.forEach((p) => {
      const type = p.paymentMethod || p.method || 'General';
      counts[type] = (counts[type] || 0) + 1;
      volumes[type] = (volumes[type] || 0) + (Number(p.amount || p.totalAmount || p.paidAmount) || 0);
    });
    return { counts, volumes };
  }, [allPayments]);

  // Summary counts
  const summaryStats = useMemo(() => {
    const total = allPaymentTypes.length;
    const active = allPaymentTypes.filter((t) => t.status === 'Active').length;
    const mfs = allPaymentTypes.filter((t) => t.category === 'mfs').length;
    const bank = allPaymentTypes.filter((t) => t.category === 'bank').length;
    const totalVolume = Object.values(typeStats.volumes).reduce((acc, v) => acc + v, 0);
    return { total, active, mfs, bank, totalVolume };
  }, [allPaymentTypes, typeStats]);

  const totalPages = meta?.totalPages || 1;

  const isAllPageSelected = paymentTypes.length > 0 && paymentTypes.every((t) => selectedIds.includes(t.id));

  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = paymentTypes.map((t) => t.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = paymentTypes.map((t) => t.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (!targetStatus || targetStatus === 'placeholder' || selectedIds.length === 0) return;
    try {
      if (bulkUpdatePaymentTypes) {
        await bulkUpdatePaymentTypes({ ids: selectedIds, status: targetStatus });
      } else {
        await Promise.all(selectedIds.map((id) => updatePaymentType({ id, status: targetStatus })));
      }
      setSelectedIds([]);
      if (refetch) refetch();
    } catch {
      toast.error('Failed to update payment methods');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      if (bulkDeletePaymentTypes) {
        await bulkDeletePaymentTypes(selectedIds);
      } else {
        await Promise.all(selectedIds.map((id) => deletePaymentType(id)));
      }
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      if (refetch) refetch();
    } catch {
      toast.error('Failed to delete selected payment methods');
    }
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingType(null);
    setTypeForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name || '',
      category: type.category || 'mfs',
      provider: type.provider || '',
      accountNumber: type.accountNumber || '',
      accountName: type.accountName || '',
      accountType: type.accountType || 'Personal',
      branchName: type.branchName || '',
      routingNumber: type.routingNumber || '',
      chargePercent: type.chargePercent ?? 0,
      instructions: type.instructions || '',
      description: type.description || '',
      status: type.status || 'Active',
      isDefault: Boolean(type.isDefault),
    });
    setModalOpen(true);
  };

  const handleOpenDetails = (type) => {
    setViewingMethod(type);
    setDetailsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error('Payment method name is required');
      return;
    }

    try {
      if (editingType) {
        await updatePaymentType({ id: editingType.id, ...typeForm });
      } else {
        await addPaymentType(typeForm);
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save payment method');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaymentType(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete payment method');
    }
  };

  const getCategoryBadge = (categoryKey) => {
    const config = CATEGORY_OPTIONS.find((c) => c.value === categoryKey) || CATEGORY_OPTIONS[0];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`text-[11px] font-medium gap-1 px-2 py-0.5 border ${config.color}`}>
        <Icon className="w-3 h-3 inline" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.payment_methods_title', 'Payment Methods & Types')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.payment_methods_subtitle', 'Configure, add, edit, and manage payment methods, bank accounts, and wallet details.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleOpenAdd}
            className="h-9 text-xs gap-1.5 shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('accounts.add_payment_method_btn', 'Add Payment Method')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Methods</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{summaryStats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Active Methods</p>
              <p className="text-xl font-bold tracking-tight text-emerald-600">{summaryStats.active}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">MFS & Wallets</p>
              <p className="text-xl font-bold tracking-tight text-pink-600">{summaryStats.mfs}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-600 border border-pink-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Bank Accounts</p>
              <p className="text-xl font-bold tracking-tight text-blue-600">{summaryStats.bank}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Landmark className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b bg-muted/20 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, account no, provider..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length === 0 ? (
              <>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v || 'All');
                    setCurrentPage(1);
                    setSelectedIds([]);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="mfs">MFS / Wallet</SelectItem>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="cash">Cash / COD</SelectItem>
                    <SelectItem value="card">Card / POS</SelectItem>
                    <SelectItem value="gateway">Gateway</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v || 'All');
                    setCurrentPage(1);
                    setSelectedIds([]);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs w-[120px]">
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
                    setSelectedIds([]);
                  }}
                />
              </>
            ) : (
              <>
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  {selectedIds.length} selected:
                </span>
                <Select value="placeholder" onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="h-9 text-xs w-[140px] border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                    <SelectValue placeholder="Bulk Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">
                      Bulk Status
                    </SelectItem>
                    <SelectItem value="Active">Mark as Active</SelectItem>
                    <SelectItem value="Inactive">Mark as Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-9 w-9 shrink-0 cursor-pointer"
                  title="Delete Selected"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    checked={isAllPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold">Payment Method</TableHead>
                <TableHead className="text-xs font-semibold">Category</TableHead>
                <TableHead className="text-xs font-semibold">Account / Wallet Details</TableHead>
                <TableHead className="text-xs font-semibold">Charge Fee</TableHead>
                <TableHead className="text-xs font-semibold">Linked Payments</TableHead>
                <TableHead className="text-xs font-semibold">Total Volume</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="w-[120px] text-right text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4"><span className="h-4 w-4 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-24 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-40 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-12 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-8 w-20 block bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paymentTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 bg-muted/40 rounded-full">
                        <CreditCard className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No payment methods found</p>
                      <p className="text-xs max-w-sm">
                        Add payment methods such as bKash Personal, Nagad Merchant, BRAC Bank, or Cash on Delivery to organize and track your receipts.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAdd}
                        className="mt-2 text-xs gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add First Payment Method</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paymentTypes.map((type) => {
                  const linkedCount = typeStats.counts[type.name] || 0;
                  const totalVolume = typeStats.volumes[type.name] || 0;

                  return (
                    <TableRow key={type.id}>
                      {/* Selection Checkbox */}
                      <TableCell className="w-[45px] px-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          checked={selectedIds.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, type.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== type.id));
                            }
                          }}
                        />
                      </TableCell>

                      {/* Method Name & Provider */}
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {type.category === 'bank' ? (
                              <Landmark className="w-3.5 h-3.5" />
                            ) : type.category === 'cash' ? (
                              <Banknote className="w-3.5 h-3.5" />
                            ) : type.category === 'mfs' ? (
                              <Smartphone className="w-3.5 h-3.5" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">{type.name}</span>
                              {type.isDefault && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {type.provider && (
                              <p className="text-[11px] text-muted-foreground font-normal">
                                Provider: <span className="font-medium text-foreground/80">{type.provider}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell>
                        {getCategoryBadge(type.category)}
                      </TableCell>

                      {/* Account / Wallet Details */}
                      <TableCell className="text-xs">
                        {type.accountNumber ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                              <span>{type.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(type.accountNumber, type.id)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                                title="Copy Account Number"
                              >
                                {copiedId === type.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {type.accountName && (
                              <p className="text-[11px] text-muted-foreground">
                                Holder: <span className="text-foreground/80">{type.accountName}</span> ({type.accountType || 'Personal'})
                              </p>
                            )}
                            {type.branchName && (
                              <p className="text-[10px] text-muted-foreground/80">
                                Branch: {type.branchName} {type.routingNumber ? `• Routing: ${type.routingNumber}` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-[11px]">No account details</span>
                        )}
                      </TableCell>

                      {/* Charge Fee */}
                      <TableCell className="text-xs font-mono font-medium">
                        {Number(type.chargePercent) > 0 ? (
                          <Badge variant="outline" className="text-[11px] font-mono text-amber-600 border-amber-500/30 bg-amber-500/5">
                            {type.chargePercent}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">0%</span>
                        )}
                      </TableCell>

                      {/* Linked Payments */}
                      <TableCell className="text-xs font-mono font-medium">
                        <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5">
                          {linkedCount} {linkedCount === 1 ? 'txn' : 'txns'}
                        </Badge>
                      </TableCell>

                      {/* Total Volume */}
                      <TableCell className="text-xs font-mono font-semibold text-foreground">
                        ৳{totalVolume.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={type.status === 'Active' ? 'default' : 'secondary'}
                          className={
                            type.status === 'Active'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium'
                              : 'bg-muted text-muted-foreground text-[11px]'
                          }
                        >
                          {type.status === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1 inline" />
                          )}
                          {type.status}
                        </Badge>
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 cursor-pointer"
                            onClick={() => handleOpenDetails(type)}
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => handleOpenEdit(type)}
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => setDeleteTarget(type)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <Pagination className="justify-end w-auto mx-0">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      className="cursor-pointer"
                    >
                      {page}
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

      {/* Add / Edit Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                {editingType ? 'Edit Payment Method' : 'Add New Payment Method'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure account numbers, bank details, and payment instructions for this method.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* General Information */}
              <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                  General Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Method Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. bKash Personal, BRAC Bank"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <Select
                      value={typeForm.category}
                      onValueChange={(v) => setTypeForm((prev) => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Provider / Bank Name</label>
                    <Input
                      placeholder="e.g. bKash, Nagad, BRAC Bank, City Bank"
                      value={typeForm.provider}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, provider: e.target.value }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cashout / Charge Fee (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={typeForm.chargePercent}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, chargePercent: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Account & Banking Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Account / Wallet Mobile No.
                    </label>
                    <Input
                      placeholder="e.g. 01712345678 or 150120XXXXXX"
                      value={typeForm.accountNumber}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Account Holder Name</label>
                    <Input
                      placeholder="e.g. Surokkha Store Ltd / Md. Name"
                      value={typeForm.accountName}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, accountName: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Account Type</label>
                    <Select
                      value={typeForm.accountType}
                      onValueChange={(v) => setTypeForm((prev) => ({ ...prev, accountType: v }))}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Merchant">Merchant</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                        <SelectItem value="Current">Current Account</SelectItem>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Branch Name</label>
                    <Input
                      placeholder="e.g. Banani Branch"
                      value={typeForm.branchName}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, branchName: e.target.value }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Routing No.</label>
                    <Input
                      placeholder="e.g. 060261234"
                      value={typeForm.routingNumber}
                      onChange={(e) => setTypeForm((prev) => ({ ...prev, routingNumber: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Instructions & Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  Payment Instructions / Notes for Customer & Staff
                </label>
                <Textarea
                  placeholder="e.g. Please Send Money (Personal) to this number and provide your Transaction ID (TrxID) in the reference box."
                  value={typeForm.instructions}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  className="text-xs min-h-[60px]"
                />
              </div>

              {/* Status & Default Settings */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <Select
                    value={typeForm.status}
                    onValueChange={(v) => setTypeForm((prev) => ({ ...prev, status: v }))}
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

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isDefaultMethodCheck"
                    checked={typeForm.isDefault}
                    onChange={(e) => setTypeForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isDefaultMethodCheck" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Set as Default Method
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button
                type="button"
                variant="cancel"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || isUpdating}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {isAdding || isUpdating ? 'Saving...' : editingType ? 'Update Method' : 'Create Method'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details View Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          {viewingMethod && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      {viewingMethod.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Payment method profile and account details
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-semibold capitalize text-foreground mt-0.5">{viewingMethod.category || 'MFS'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <p className="font-semibold text-foreground mt-0.5">{viewingMethod.provider || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-semibold text-emerald-600 mt-0.5">{viewingMethod.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cashout / Charge Fee:</span>
                    <p className="font-semibold text-amber-600 mt-0.5">{viewingMethod.chargePercent || 0}%</p>
                  </div>
                </div>

                {viewingMethod.accountNumber && (
                  <div className="bg-muted/30 p-3 rounded-lg border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Account / Wallet Number:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                        onClick={() => handleCopy(viewingMethod.accountNumber, viewingMethod.id)}
                      >
                        {copiedId === viewingMethod.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </Button>
                    </div>
                    <p className="font-mono text-base font-bold text-foreground">{viewingMethod.accountNumber}</p>
                    {viewingMethod.accountName && (
                      <p className="text-muted-foreground">
                        Account Holder: <span className="font-medium text-foreground">{viewingMethod.accountName}</span> ({viewingMethod.accountType || 'Personal'})
                      </p>
                    )}
                    {viewingMethod.branchName && (
                      <p className="text-muted-foreground">
                        Branch: <span className="font-medium text-foreground">{viewingMethod.branchName}</span>
                        {viewingMethod.routingNumber ? ` (Routing: ${viewingMethod.routingNumber})` : ''}
                      </p>
                    )}
                  </div>
                )}

                {viewingMethod.instructions && (
                  <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Instructions:
                    </p>
                    <p className="text-xs whitespace-pre-wrap">{viewingMethod.instructions}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleOpenEdit(viewingMethod);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Edit Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Payment Method?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Linked payment records will retain their history.`}
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Selected Payment Methods?"
        description={`Are you sure you want to delete ${selectedIds.length} selected payment method(s)? Linked payment records will retain their history.`}
        isLoading={isBulkDeleting}
      />
    </div>
  );
};

export const PaymentMethodsPage = PaymentTypesPage;
export default PaymentTypesPage;
