import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  PlusCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  MoreHorizontal,
  Eye,
  RefreshCw,
  FileText,
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
import { usePayments } from '@/hooks/use-payments';
import { DateRangeFilter } from '@/components/dashboard/accounts/DateRangeFilter';
import { toast } from 'sonner';

const METHOD_COLORS = {
  bKash: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
  Nagad: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  Cash: 'bg-green-500/10 text-green-600 border-green-500/30',
  Card: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'Bank Transfer': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const AllPaymentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail & Delete Dialog States
  const [viewPaymentTarget, setViewPaymentTarget] = useState(null);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    payments = [],
    summary = { totalCollected: 0, totalPending: 0, totalFailed: 0 },
    meta = { totalPages: 1, total: 0 },
    isLoading,
    isError,
    refetch,
    updatePayment,
    deletePayment,
  } = usePayments({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    method: methodFilter !== 'All' ? methodFilter : undefined,
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

  const handleMethodFilter = (v) => {
    setMethodFilter(v || 'All');
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
      case 'Completed':
      case 'Paid':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1" variant="outline">
            <CheckCircle2 className="h-3 w-3" /> Completed
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

  const getMethodBadge = (method) => {
    const cls = METHOD_COLORS[method] || 'bg-muted text-muted-foreground';
    return <Badge className={`${cls} gap-1 font-medium text-[11px]`} variant="outline">{method}</Badge>;
  };

  const isAllPageSelected = payments.length > 0 && payments.every((p) => selectedIds.includes(p.id));

  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = payments.map((p) => p.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = payments.map((p) => p.id);
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (!targetStatus || targetStatus === 'placeholder') return;
    try {
      await Promise.all(
        selectedIds.map((id) => updatePayment({ id, status: targetStatus }))
      );
      toast.success(`Updated ${selectedIds.length} payments to status "${targetStatus}"`);
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error('Failed to update payments');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deletePayment(id)));
      toast.success(`Deleted ${selectedIds.length} payments`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      toast.error('Failed to delete selected payments');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePayment(singleDeleteTarget.id);
      toast.success(`Payment ${singleDeleteTarget.invoiceId || singleDeleteTarget.id} deleted`);
      setSingleDeleteTarget(null);
      refetch();
    } catch {
      toast.error('Failed to delete payment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.all_payments_title', 'All Payments')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.all_payments_subtitle', 'Track all incoming customer transactions and payment settlements.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            className="h-9 text-xs gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/dashboard/accounts/payments/new">
              <PlusCircle className="w-4 h-4" />
              <span>{t('accounts.add_payment_btn', 'Add New Payment')}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Collected</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 mt-0.5">{formatCurrency(summary.totalCollected)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pending Approvals</p>
            <p className="text-xl font-bold tracking-tight text-amber-600 mt-0.5">{formatCurrency(summary.totalPending)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Failed Transactions</p>
            <p className="text-xl font-bold tracking-tight text-red-600 mt-0.5">{formatCurrency(summary.totalFailed)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
            <XCircle className="h-4 w-4" />
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
              placeholder="Search by customer, invoice, TrxID..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length === 0 ? (
              <>
                <Select value={methodFilter} onValueChange={handleMethodFilter}>
                  <SelectTrigger className="h-9 text-xs w-[150px]">
                    <span className="truncate">Method: {methodFilter === 'All' ? 'All' : methodFilter}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Methods</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="bKash">bKash</SelectItem>
                    <SelectItem value="Nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-9 text-xs w-[150px]">
                    <span className="truncate">Status: {statusFilter === 'All' ? 'All' : statusFilter}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Completed">Completed (Paid)</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
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
                    <SelectItem value="Completed">Mark as Completed</SelectItem>
                    <SelectItem value="Pending">Mark as Pending</SelectItem>
                    <SelectItem value="Failed">Mark as Failed</SelectItem>
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
              <TableRow>
                <TableHead className="w-[45px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={isAllPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="text-xs">Invoice / Trx ID</TableHead>
                <TableHead className="text-xs">Customer / Payer</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Payment Date</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Paid</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-[80px] text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4"><span className="h-4 w-4 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-24 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><span className="h-4 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-8 ml-auto block bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-red-500 text-xs">
                    Failed to load payments data. Please click refresh.
                  </TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="w-[45px] px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, p.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== p.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <div>{p.invoiceId}</div>
                      {p.trxId && (
                        <div className="text-[10px] text-muted-foreground">{p.trxId}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground line-clamp-1">{p.customerName}</div>
                      {p.notes && <div className="text-[11px] text-muted-foreground line-clamp-1">{p.notes}</div>}
                    </TableCell>
                    <TableCell>{getMethodBadge(p.method || p.paymentMethod)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{p.date}</TableCell>
                    <TableCell className="text-xs font-bold text-foreground whitespace-nowrap">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(p.paidAmount || (p.status === 'Completed' ? p.amount : 0))}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
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
                            onClick={() => setViewPaymentTarget(p)}
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={() => navigate(`/dashboard/accounts/payments/new?edit=${p.id}`)}
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-500" />
                            <span>Edit Payment</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer gap-2"
                            onClick={() => setSingleDeleteTarget(p)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Payment</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground text-xs">
                    No payments found matching your filter criteria.
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

      {/* View Payment Details Modal */}
      <Dialog open={!!viewPaymentTarget} onOpenChange={(open) => !open && setViewPaymentTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Transaction Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              {viewPaymentTarget?.invoiceId || viewPaymentTarget?.id}
            </DialogDescription>
          </DialogHeader>

          {viewPaymentTarget && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block">Customer:</span>
                  <span className="font-semibold text-foreground text-sm">{viewPaymentTarget.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payment Method:</span>
                  <div className="mt-0.5">{getMethodBadge(viewPaymentTarget.method || viewPaymentTarget.paymentMethod)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date:</span>
                  <span className="font-medium text-foreground">{viewPaymentTarget.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(viewPaymentTarget.status)}</div>
                </div>
                {viewPaymentTarget.trxId && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Transaction ID (TrxID):</span>
                    <span className="font-mono font-semibold text-foreground">{viewPaymentTarget.trxId}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-muted/50 border space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total Bill / Order:</span>
                  <span className="font-bold text-foreground">{formatCurrency(viewPaymentTarget.amount)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Settled Amount:</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(viewPaymentTarget.paidAmount || (viewPaymentTarget.status === 'Completed' ? viewPaymentTarget.amount : 0))}</span>
                </div>
              </div>

              {viewPaymentTarget.notes && (
                <div className="p-3 rounded-lg bg-muted/30 border text-muted-foreground">
                  <span className="font-semibold text-foreground block mb-0.5">Notes:</span>
                  <p>{viewPaymentTarget.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewPaymentTarget(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const id = viewPaymentTarget?.id;
                setViewPaymentTarget(null);
                navigate(`/dashboard/accounts/payments/new?edit=${id}`);
              }}
            >
              Edit Payment
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
        title="Delete Selected Payments"
        description={`Are you sure you want to delete the ${selectedIds.length} selected payment records?`}
      />

      <ConfirmDeleteDialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
        onConfirm={handleSingleDelete}
        isDeleting={isDeleting}
        title="Delete Payment Record"
        description={`Are you sure you want to delete payment ${singleDeleteTarget?.invoiceId || singleDeleteTarget?.id}?`}
      />
    </div>
  );
};

export default AllPaymentsPage;
