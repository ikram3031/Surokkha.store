import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tag,
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
import { useBillTypes } from '@/hooks/use-bill-types';
import { useBillings } from '@/hooks/use-billings';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

export const BillTypesPage = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', status: 'Active' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    billTypes = [],
    allBillTypes = [],
    meta = { totalPages: 1, total: 0 },
    isLoading,
    refetch,
    addBillType,
    updateBillType,
    deleteBillType,
    bulkUpdateBillTypes,
    bulkDeleteBillTypes,
    isAdding,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    isBulkDeleting,
  } = useBillTypes({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 10,
  });

  const { allBillings = [] } = useBillings();

  // Compute bill stats per type
  const typeStats = useMemo(() => {
    const counts = {};
    const volumes = {};
    allBillings.forEach((b) => {
      const type = b.billType || 'General Expense';
      counts[type] = (counts[type] || 0) + 1;
      volumes[type] = (volumes[type] || 0) + (Number(b.totalAmount) || 0);
    });
    return { counts, volumes };
  }, [allBillings]);

  const totalPages = meta?.totalPages || 1;

  const isAllPageSelected = billTypes.length > 0 && billTypes.every((t) => selectedIds.includes(t.id));

  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = billTypes.map((t) => t.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = billTypes.map((t) => t.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (!targetStatus || targetStatus === 'placeholder' || selectedIds.length === 0) return;
    try {
      if (bulkUpdateBillTypes) {
        await bulkUpdateBillTypes({ ids: selectedIds, status: targetStatus });
      } else {
        await Promise.all(selectedIds.map((id) => updateBillType({ id, status: targetStatus })));
      }
      setSelectedIds([]);
      if (refetch) refetch();
    } catch {
      toast.error('Failed to update bill categories');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      if (bulkDeleteBillTypes) {
        await bulkDeleteBillTypes(selectedIds);
      } else {
        await Promise.all(selectedIds.map((id) => deleteBillType(id)));
      }
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      if (refetch) refetch();
    } catch {
      toast.error('Failed to delete selected bill categories');
    }
  };

  const handleOpenAdd = () => {
    setEditingType(null);
    setTypeForm({ name: '', description: '', status: 'Active' });
    setModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name || '',
      description: type.description || '',
      status: type.status || 'Active',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingType) {
        await updateBillType({ id: editingType.id, ...typeForm });
      } else {
        await addBillType(typeForm);
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save bill type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBillType(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete bill type');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.bill_types_title', 'Bill Types & Categories')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.bill_types_subtitle', 'Configure categories for expense tracking, tax accounting, and budget management.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleOpenAdd}
            className="h-9 text-xs gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('accounts.add_bill_type_btn', 'Add Bill Type')}</span>
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
              placeholder="Search bill types..."
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
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v || 'All');
                    setCurrentPage(1);
                    setSelectedIds([]);
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
                  <SelectTrigger className="h-9 text-xs w-[140px] border-primary/30 bg-primary/5 text-primary">
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
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[45px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={isAllPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="text-xs">Category Name</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Linked Bills</TableHead>
                <TableHead className="text-xs">Total Incurred</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Created Date</TableHead>
                <TableHead className="w-[100px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4"><span className="h-4 w-4 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-48 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-12 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-16 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : billTypes.length > 0 ? (
                billTypes.map((type) => {
                  const billCount = typeStats.counts[type.name] || 0;
                  const volume = typeStats.volumes[type.name] || 0;
                  const isActive = type.status === 'Active';

                  return (
                    <TableRow key={type.id} className="hover:bg-muted/30">
                      <TableCell className="w-[45px] px-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
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
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span>{type.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {type.description || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        <Badge variant="outline" className="text-[11px] bg-muted/40">
                          {billCount} bills
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground font-mono">
                        ৳{volume.toLocaleString()}
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
                          {type.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                            onClick={() => handleOpenEdit(type)}
                            title="Edit Category"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => setDeleteTarget(type)}
                            title="Delete Category"
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
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground text-xs">
                    No bill categories found matching your query.
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

      {/* Add / Edit Bill Type Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              {editingType ? 'Edit Bill Category' : 'Create New Bill Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define category tags to organize expenses and financial reporting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Server Subscriptions, Office Rent"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description</label>
              <Input
                placeholder="Brief description of this expense type..."
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Status</label>
              <Select
                value={typeForm.status}
                onValueChange={(v) => setTypeForm({ ...typeForm, status: v })}
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

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? 'Saving...' : editingType ? 'Update Category' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete Bill Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Any existing bills linked to this type will remain intact.`}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={`Delete ${selectedIds.length} Selected Categories?`}
        description={`Are you sure you want to delete the ${selectedIds.length} selected bill categories? Any bills linked to these categories will remain intact.`}
      />
    </div>
  );
};

export default BillTypesPage;
