import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  PlusCircle,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  MoreHorizontal,
  Eye,
  Filter,
  RefreshCw,
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useBillings } from '@/hooks/use-billings';
import { useBillTypes } from '@/hooks/use-bill-types';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const AllBillsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [billTypeFilter, setBillTypeFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail & Delete Dialog States
  const [viewBillTarget, setViewBillTarget] = useState(null);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { allBillTypes = [] } = useBillTypes();

  const {
    billings = [],
    summary = { totalBilled: 0, totalPaid: 0, totalPending: 0 },
    meta = { totalPages: 1, total: 0 },
    isLoading,
    isError,
    refetch,
    updateBilling,
    deleteBilling,
  } = useBillings({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    billType: billTypeFilter !== 'All' ? billTypeFilter : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    page: currentPage,
    limit: 15,
  });

  const totalPages = meta?.totalPages || 1;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v || 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBillTypeFilter = (v) => {
    setBillTypeFilter(v || 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleRangeChange = (range) => {
    setDateRange(range);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </Badge>
        );
      case 'Pending':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1" variant="outline">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'Partial':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1" variant="outline">
            <AlertCircle className="h-3 w-3" /> Partial
          </Badge>
        );
      case 'Returned':
        return (
          <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" /> Returned
          </Badge>
        );
      case 'Failed':
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1" variant="outline">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground gap-1" variant="outline">
            {status || 'Active'}
          </Badge>
        );
    }
  };

  const isAllPageSelected = billings.length > 0 && billings.every((b) => selectedIds.includes(b.id));

  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = billings.map((b) => b.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = billings.map((b) => b.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (!targetStatus || targetStatus === 'placeholder') return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateBilling({ id, status: targetStatus }))
      );
      toast.success(`Updated ${selectedIds.length} bills to status "${targetStatus}"`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error('Failed to update bills');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteBilling(id)));
      toast.success(`Deleted ${selectedIds.length} bills`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      toast.error('Failed to delete selected bills');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBilling(singleDeleteTarget.id);
      toast.success(`Bill ${singleDeleteTarget.did || singleDeleteTarget.title} deleted`);
      setSingleDeleteTarget(null);
      refetch();
    } catch {
      toast.error('Failed to delete bill');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.all_bills_title', 'All Bills')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.all_bills_subtitle', 'Manage company invoices, vendor expenses, utilities, and operational costs.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            className="h-9 text-xs gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/dashboard/accounts/bills/new">
              <PlusCircle className="w-4 h-4" />
              <span>{t('accounts.add_bill_btn', 'Add New Bill')}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Billed</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">{formatCurrency(summary.totalBilled)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Paid Volume</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 mt-0.5">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pending Dues</p>
            <p className="text-xl font-bold tracking-tight text-amber-600 mt-0.5">{formatCurrency(summary.totalPending)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b bg-muted/20 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search_placeholder', 'Search by title, DID, vendor...')}
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length === 0 ? (
              <>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-9 text-xs w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Active">Active (Unpaid)</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={billTypeFilter} onValueChange={handleBillTypeFilter}>
                  <SelectTrigger className="h-9 text-xs w-[150px]">
                    <SelectValue placeholder="Bill Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    {allBillTypes.map((bt) => (
                      <SelectItem key={bt.id} value={bt.name}>
                        {bt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DateRangeFilter
                  value={dateRange.preset}
                  onChange={handleRangeChange}
                />
              </>
            ) : (
              <>
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  {selectedIds.length} selected:
                </span>
                <Select value="placeholder" onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="h-9 text-xs w-[140px] border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                    <SelectValue placeholder="Bulk Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Bulk Status</SelectItem>
                    <SelectItem value="Paid">Mark as Paid</SelectItem>
                    <SelectItem value="Pending">Mark as Pending</SelectItem>
                    <SelectItem value="Partial">Mark as Partial</SelectItem>
                    <SelectItem value="Returned">Mark as Returned</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-9 w-9 shrink-0"
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
                <TableHead className="text-xs">Bill Ref / DID</TableHead>
                <TableHead className="text-xs">Title / Payee</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Billing Date</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs">Total Amount</TableHead>
                <TableHead className="text-xs">Paid / Pending</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-[80px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4"><span className="h-4 w-4 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-36 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-24 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-8 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-red-500 text-xs">
                    Failed to load bills data. Please click refresh.
                  </TableCell>
                </TableRow>
              ) : billings.length > 0 ? (
                billings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/30">
                    <TableCell className="w-[45px] px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, b.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== b.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{b.did || b.invoiceId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground line-clamp-1">{b.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{b.vendor || b.customerName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-medium bg-muted/40">
                        {b.billType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{b.billingDate || b.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{b.dueDate || '—'}</TableCell>
                    <TableCell className="text-xs font-bold text-foreground whitespace-nowrap">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <span className="text-emerald-600 font-semibold">{formatCurrency(b.paidAmount)}</span>
                      {b.pendingAmount > 0 && (
                        <span className="text-muted-foreground text-[10px] ml-1">({formatCurrency(b.pendingAmount)} due)</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => setViewBillTarget(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => navigate(`/dashboard/accounts/bills/new?edit=${b.id}`)}
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-500" />
                            <span>Edit Bill</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer gap-2"
                            onClick={() => setSingleDeleteTarget(b)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Bill</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-muted-foreground text-xs">
                    No bills found matching your filter criteria.
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

      {/* View Bill Details Modal */}
      <Dialog open={!!viewBillTarget} onOpenChange={(open) => !open && setViewBillTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-500" />
              Bill Details & Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs">
              {viewBillTarget?.did || viewBillTarget?.id}
            </DialogDescription>
          </DialogHeader>

          {viewBillTarget && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block">Title / Payee:</span>
                  <span className="font-semibold text-foreground text-sm">{viewBillTarget.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Bill Category:</span>
                  <Badge variant="outline" className="mt-0.5">{viewBillTarget.billType}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block">Billing Date:</span>
                  <span className="font-medium text-foreground">{viewBillTarget.billingDate || viewBillTarget.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Due Date:</span>
                  <span className="font-medium text-foreground">{viewBillTarget.dueDate || 'Immediate'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payment Method:</span>
                  <span className="font-medium text-foreground">{viewBillTarget.billingMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(viewBillTarget.status)}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/50 border space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total Bill Amount:</span>
                  <span className="font-bold text-foreground text-sm">{formatCurrency(viewBillTarget.totalAmount)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Paid So Far:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(viewBillTarget.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span className="text-muted-foreground">Outstanding Pending:</span>
                  <span className="font-bold text-amber-600">{formatCurrency(viewBillTarget.pendingAmount)}</span>
                </div>
              </div>

              {viewBillTarget.notes && (
                <div className="p-3 rounded-lg bg-muted/30 border text-muted-foreground">
                  <span className="font-semibold text-foreground block mb-0.5">Notes:</span>
                  <p>{viewBillTarget.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewBillTarget(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const id = viewBillTarget?.id;
                setViewBillTarget(null);
                navigate(`/dashboard/accounts/bills/new?edit=${id}`);
              }}
            >
              Edit Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
        title="Delete Selected Bills"
        description={`Are you sure you want to permanently delete the ${selectedIds.length} selected bills? This action cannot be undone.`}
      />

      <ConfirmDeleteDialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
        onConfirm={handleSingleDelete}
        isDeleting={isDeleting}
        title="Delete Bill"
        description={`Are you sure you want to delete bill "${singleDeleteTarget?.title}" (${singleDeleteTarget?.did || singleDeleteTarget?.id})?`}
      />
    </div>
  );
};

export default AllBillsPage;
