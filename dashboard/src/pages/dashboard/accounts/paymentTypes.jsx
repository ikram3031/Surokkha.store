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
  Clock,
  Layers,
  FileSpreadsheet,
  Calendar,
  Wallet,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { usePaymentTypes } from '@/hooks/use-payment-types';
import { usePayments } from '@/hooks/use-payments';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

export const PaymentTypesPage = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', status: 'Active', isDefault: false });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    paymentTypes = [],
    allPaymentTypes = [],
    meta = { totalPages: 1, total: 0 },
    isLoading,
    addPaymentType,
    updatePaymentType,
    deletePaymentType,
    isAdding,
    isUpdating,
    isDeleting,
  } = usePaymentTypes({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const { allPayments = [] } = usePayments();

  // Compute payment stats per type/method
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

  const totalPages = meta?.totalPages || 1;

  const handleOpenAdd = () => {
    setEditingType(null);
    setTypeForm({ name: '', description: '', status: 'Active', isDefault: false });
    setModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name || '',
      description: type.description || '',
      status: type.status || 'Active',
      isDefault: Boolean(type.isDefault),
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error('Payment type name is required');
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
      toast.error('Failed to save payment type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaymentType(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete payment type');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.payment_types_title', 'Payment Types & Methods')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.payment_types_subtitle', 'Configure and manage payment methods, accounts, and gateway channels.')}
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
            <span>{t('accounts.add_payment_type_btn', 'Add Payment Type')}</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b bg-muted/20 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payment types..."
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
                <TableHead className="text-xs">Type / Method Name</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Linked Payments</TableHead>
                <TableHead className="text-xs">Total Volume</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Created Date</TableHead>
                <TableHead className="w-[100px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-48 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-12 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-8 w-16 block bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paymentTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 bg-muted/40 rounded-full">
                        <CreditCard className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No payment types found</p>
                      <p className="text-xs max-w-sm">
                        Create payment types such as Cash, bKash, Nagad, Card, or Bank Transfer to categorize your payment transactions.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAdd}
                        className="mt-2 text-xs gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add First Payment Type</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paymentTypes.map((type) => {
                  const linkedCount = typeStats.counts[type.name] || 0;
                  const totalVolume = typeStats.volumes[type.name] || 0;

                  return (
                    <TableRow key={type.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{type.name}</span>
                            {type.isDefault && (
                              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {type.description || <span className="text-muted-foreground/50 italic">—</span>}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5">
                          {linkedCount} {linkedCount === 1 ? 'txn' : 'txns'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-foreground">
                        ৳{totalVolume.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
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
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(type.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                {editingType ? 'Edit Payment Type' : 'Add New Payment Type'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Payment types help classify incoming receipts and customer payment methods.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Payment Method / Type Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. bKash, Nagad, Cash, POS Card, Bank Transfer"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                <Input
                  placeholder="e.g. Mobile financial services or merchant POS terminal"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="text-xs"
                />
              </div>

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
                    id="isDefaultPaymentType"
                    checked={typeForm.isDefault}
                    onChange={(e) => setTypeForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isDefaultPaymentType" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Default Method
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
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
                {isAdding || isUpdating ? 'Saving...' : editingType ? 'Update Type' : 'Create Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Payment Type?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Linked payment records will retain their history.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PaymentTypesPage;
