import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, CheckCircle2, XCircle, Clock, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { usePayments } from '@/hooks/use-payments';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';

const METHOD_COLORS = {
  bKash: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
  Nagad: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  Cash: 'bg-green-500/10 text-green-600 border-green-500/30',
  Card: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
};

// Returns badge component corresponding to payment status
const getStatusBadge = (status) => {
  switch (status) {
    case 'Completed':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1" variant="outline">
          <CheckCircle2 className="h-3 w-3" />Completed
        </Badge>
      );
    case 'Pending':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1" variant="outline">
          <Clock className="h-3 w-3" />Pending
        </Badge>
      );
    case 'Failed':
      return (
        <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1" variant="outline">
          <XCircle className="h-3 w-3" />Failed
        </Badge>
      );
    default:
      return null;
  }
};

// Returns badge component corresponding to payment method
const getMethodBadge = (method) => {
  const cls = METHOD_COLORS[method] ?? 'bg-muted text-muted-foreground';
  return <Badge className={`${cls} gap-1`} variant="outline">{method}</Badge>;
};

// Renders the payments transaction management page
const PaymentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState(null);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data: paymentsResponse, isLoading, isError } = usePayments({
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    method: methodFilter !== 'All' ? methodFilter : undefined,
    page: currentPage,
    limit: 15,
  });

  const payments = useMemo(() => paymentsResponse?.items || [], [paymentsResponse?.items]);
  const meta = paymentsResponse?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const totalCollected = paymentsResponse?.summary?.totalCollected ?? 0;
  const totalPending = paymentsResponse?.summary?.totalPending ?? 0;
  const totalFailed = paymentsResponse?.summary?.totalFailed ?? 0;

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleMethodFilter = (v) => {
    setMethodFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    toast.info(`Exporting ${selectedIds.length} payments...`);
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (!targetStatus || targetStatus === 'placeholder') return;
    try {
      const backendStatus = targetStatus === 'Completed' ? 'paid' : targetStatus.toLowerCase();
      await apiClient.post('/api/v1/payments/bulk-update', {
        ids: selectedIds,
        status: backendStatus,
      });
      toast.success(`Updated ${selectedIds.length} payments to status "${targetStatus}".`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedIds([]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to bulk update payments.'));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/payments/bulk-delete', { ids: selectedIds });
      toast.success(`Successfully deleted ${selectedIds.length} selected payment records.`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete selected payments.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    setIsSingleDeleting(true);
    try {
      await apiClient.delete(`/api/v1/payments/${singleDeleteTarget.id}`);
      toast.success(`Payment record ${singleDeleteTarget.invoiceId} deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSingleDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete payment record.'));
    } finally {
      setIsSingleDeleting(false);
    }
  };

  const isAllPageSelected = payments.length > 0 && payments.every((p) => selectedIds.includes(p.id));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all payment transactions</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="text-xl font-bold">৳{totalCollected.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold">৳{totalPending.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-bold">৳{totalFailed.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-muted/30 items-center justify-between">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, payment ID or invoice..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {selectedIds.length === 0 ? (
              <>
                <Select value={methodFilter} onValueChange={handleMethodFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Methods</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="bKash">bKash</SelectItem>
                    <SelectItem value="Nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-1">
                  {selectedIds.length} selected:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  className="flex items-center gap-1.5 h-9"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Select value="placeholder" onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-[140px] h-9 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <SelectValue placeholder="Bulk Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Bulk Status</SelectItem>
                    <SelectItem value="Completed">Completed (Paid)</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-9 w-9 flex items-center justify-center shrink-0"
                  title={`Delete Selected (${selectedIds.length})`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={isAllPageSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pageIds = payments.map((p) => p.id);
                        const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                        setSelectedIds(newSelected);
                      } else {
                        const pageIds = payments.map((p) => p.id);
                        setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="w-[50px] px-4">
                      <span className="h-4 w-4 block bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell><span className="h-4 w-24 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-32 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-24 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-4 w-16 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><span className="h-5 w-20 block bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell className="text-right"><span className="h-8 w-8 ml-auto block bg-muted animate-pulse rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-red-500">
                    Failed to load payments. Please refresh the page.
                  </TableCell>
                </TableRow>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="w-[50px] px-4">
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
                    <TableCell className="text-muted-foreground font-mono text-xs">{p.invoiceId}</TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell>{getMethodBadge(p.method)}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.date}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">৳{p.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right w-[60px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => setSingleDeleteTarget({ id: p.id, invoiceId: p.invoiceId })}
                          >
                            Delete Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t px-4 py-3 bg-muted/10">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage((p) => p - 1);
                        setSelectedIds([]);
                      }
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1;

                  if (!showPage) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                          setSelectedIds([]);
                        }}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage((p) => p + 1);
                        setSelectedIds([]);
                      }
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title="Delete Selected Payments"
        description={`Are you sure you want to permanently delete the ${selectedIds.length} selected payment records? This action cannot be undone.`}
      />

      <ConfirmDeleteDialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
        onConfirm={handleSingleDelete}
        isDeleting={isSingleDeleting}
        title="Delete Payment Record"
        description={`Are you sure you want to delete payment record ${singleDeleteTarget?.invoiceId ?? ''}?`}
      />
    </div>
  );
}

export default PaymentsPage;
