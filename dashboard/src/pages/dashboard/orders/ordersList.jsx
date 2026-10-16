import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OrdersTable } from '@/components/dashboard/orders-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PathaoSyncBar from '@/components/dashboard/orders/PathaoSyncBar';
import { Search, Download, PlusCircle, Trash2, X, Filter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/lib/auth-context';
import { isReadOnlyRole } from '@/lib/rbac';
import { clientConfig } from '@/clientConfig';
import styles from '@/styles/styles.json';

// Renders orders list management dashboard page
const OrdersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const statusFilter = searchParams.get('status') || 'All';
  const paymentFilter = searchParams.get('payment') || 'All';
  const urlSearch = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState(null);
  const [bulkPaymentTarget, setBulkPaymentTarget] = useState(null);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkReturnFee, setBulkReturnFee] = useState('');

  const queryClient = useQueryClient();

  const updateParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          val === 'All' ||
          val === 'all' ||
          (key === 'page' && Number(val) === 1)
        ) {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      return next;
    });
  };

  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== (searchParams.get('q') || '')) {
        updateParams({ q: trimmed, page: 1 });
        setSelectedIds([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const statusOptions = [
    { value: 'Pending', label: t('orders.status_pending', 'Pending') },
    { value: 'Processing', label: t('orders.status_processing', 'Processing') },
    { value: 'Shipped', label: t('orders.status_shipped', 'Shipped') },
    { value: 'Completed', label: t('orders.status_delivered', 'Completed') },
    { value: 'Cancelled', label: t('orders.status_canceled', 'Cancelled') },
    { value: 'Fake', label: 'Fake' },
  ];

  const selectedStatuses = statusFilter === 'All' || !statusFilter
    ? []
    : statusFilter.split(',').map((s) => s.trim()).filter(Boolean);

  const toggleStatusFilter = (val) => {
    let nextStatuses;
    if (selectedStatuses.includes(val)) {
      nextStatuses = selectedStatuses.filter((s) => s !== val);
    } else {
      nextStatuses = [...selectedStatuses, val];
    }
    const nextVal = nextStatuses.length === 0 ? 'All' : nextStatuses.join(',');
    updateParams({ status: nextVal, page: 1 });
    setSelectedIds([]);
  };

  const clearStatusFilter = () => {
    updateParams({ status: 'All', page: 1 });
    setSelectedIds([]);
  };

  const handlePayment = (v) => {
    updateParams({ payment: v ?? 'All', page: 1 });
    setSelectedIds([]);
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/orders/bulk-delete', { ids: selectedIds });
      logActivity({
        type: 'deleted',
        description: `${selectedIds.length} order(s) deleted by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', 'Selected orders deleted successfully.'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('common.error', 'Failed to delete some orders.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status, returnFee) => {
    if (!status || status === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, status, returnFee: Number(returnFee) });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} order(s) status updated to "${status}" by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected orders updated to status "${status}".`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error', 'Failed to update orders.'));
    }
  };

  const handleBulkPaymentChange = async (paymentStatus) => {
    if (!paymentStatus || paymentStatus === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, paymentStatus });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} order(s) payment status updated to "${paymentStatus}" by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected orders updated to payment status "${paymentStatus}".`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error', 'Failed to update orders.'));
    }
  };
 
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('orders.title', 'Orders Management')}</h2>
          <PathaoSyncBar />
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && clientConfig?.features?.customOrders && (
            <Button variant="outline" nativeButton={false} render={<Link to="/dashboard/orders/custom/new" />}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('orders.new_custom_order', 'New Custom Order')}
            </Button>
          )}
          {!isReadOnly && clientConfig?.features?.inStoreOrder !== false && !clientConfig?.features?.customOrders && (
            <Button variant="outline" nativeButton={false} render={<Link to="/dashboard/orders/new" />}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('orders.new_order', 'New In-Store Order')}
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('common.export', 'Export Orders')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('orders.search_orders', 'Search by customer name, phone or order ID...')}
            className="pl-8 pr-8 h-9 text-xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          {selectedIds.length === 0 && (
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-[200px] cursor-pointer">
                  <span className="truncate">
                    {selectedStatuses.length === 0
                      ? `${t('orders.order_status', 'Order Status')}: ${t('common.all', 'All')}`
                      : `${t('orders.order_status', 'Status')} (${selectedStatuses.length}): ${selectedStatuses.join(', ')}`}
                  </span>
                  <Filter className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="start">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{t('orders.order_status', 'Order Status')}</span>
                    {selectedStatuses.length > 0 && (
                      <button
                        type="button"
                        onClick={clearStatusFilter}
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer underline"
                      >
                        {t('common.clear', 'Clear')}
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {statusOptions.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={selectedStatuses.includes(opt.value)}
                      onCheckedChange={() => toggleStatusFilter(opt.value)}
                      className="cursor-pointer text-xs"
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={paymentFilter} onValueChange={handlePayment}>
                <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                  <span>
                    {paymentFilter === 'All'
                      ? `${t('orders.payment_status', 'Payment')}: ${t('common.all', 'All')}`
                      : `${t('orders.payment_status', 'Payment')}: ${paymentFilter}`}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">{t('orders.payment_status', 'Payment')}: {t('common.all', 'All')}</SelectItem>
                  <SelectItem value="Paid">{t('orders.status_paid', 'Paid')}</SelectItem>
                  <SelectItem value="Pending">{t('orders.status_pending', 'Pending')}</SelectItem>
                  <SelectItem value="Failed">{t('common.error', 'Failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedIds.length > 0 && !isReadOnly && (
            <div className="flex gap-1.5 items-center ml-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
                {selectedIds.length} {t('common.selected', 'selected')}:
              </span>

              <Select value="" onValueChange={(val) => val && setBulkPaymentTarget(val)}>
                <SelectTrigger className="w-[145px] h-9 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-xs">
                  <span>{t('orders.payment_status', 'Payment Status')}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Paid" className="cursor-pointer text-xs">{t('orders.status_paid', 'Paid')}</SelectItem>
                  <SelectItem value="Pending" className="cursor-pointer text-xs">{t('orders.status_pending', 'Pending')}</SelectItem>
                  <SelectItem value="Failed" className="cursor-pointer text-xs">{t('common.error', 'Failed')}</SelectItem>
                  <SelectItem value="Refunded" className="cursor-pointer text-xs">{t('orders.status_returned', 'Refunded')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value="" onValueChange={(val) => val && setBulkStatusTarget(val)}>
                <SelectTrigger className="w-[135px] h-9 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer text-xs">
                  <span>{t('orders.order_status', 'Order Status')}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="Pending" className="cursor-pointer text-xs">{t('orders.status_pending', 'Pending')}</SelectItem>
                  <SelectItem value="Processing" className="cursor-pointer text-xs">{t('orders.status_processing', 'Processing')}</SelectItem>
                  <SelectItem value="Shipped" className="cursor-pointer text-xs">{t('orders.status_shipped', 'Shipped')}</SelectItem>
                  <SelectItem value="Completed" className="cursor-pointer text-xs">{t('orders.status_delivered', 'Completed')}</SelectItem>
                  <SelectItem value="Cancelled" className="cursor-pointer text-xs">{t('orders.status_canceled', 'Cancelled')}</SelectItem>
                  <SelectItem value="Return" className="cursor-pointer text-xs">Return</SelectItem>
                  <SelectItem value="Fake" className="cursor-pointer text-xs text-destructive font-semibold">Fake</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-9 w-9 flex items-center justify-center shrink-0 cursor-pointer"
                title={`${t('common.delete', 'Delete Selected')} (${selectedIds.length})`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.table.wrapper}>
        <div className="overflow-x-auto">
          <OrdersTable
            searchQuery={debouncedSearch}
            statusFilter={statusFilter}
            paymentFilter={paymentFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            orderType="online"
            isReadOnly={isReadOnly}
          />

          <div className="py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <Dialog open={!!bulkStatusTarget} onOpenChange={(open) => {
        if (!open) {
          setBulkStatusTarget(null);
          setBulkReturnFee('');
        }
      }}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Confirm Order Status Change')}</DialogTitle>
            <DialogDescription>
              {t('orders.change_status_desc', `Are you sure you want to update the Order Status of ${selectedIds.length} selected orders to "${bulkStatusTarget}"?`)}
            </DialogDescription>
          </DialogHeader>
          {bulkStatusTarget === 'Return' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-1 block">Return Fee</label>
              <Input
                type="number"
                value={bulkReturnFee}
                onChange={(e) => setBulkReturnFee(e.target.value)}
                placeholder="Enter return fee"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkStatusTarget(null);
              setBulkReturnFee('');
            }} disabled={isUpdatingBulk}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkStatusTarget) {
                  if (bulkStatusTarget === 'Return' && (!bulkReturnFee || bulkReturnFee === '')) {
                    toast.error('Return fee is required');
                    return;
                  }
                  setIsUpdatingBulk(true);
                  await handleBulkStatusChange(bulkStatusTarget, bulkReturnFee);
                  setIsUpdatingBulk(false);
                  setBulkStatusTarget(null);
                  setBulkReturnFee('');
                }
              }}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? t('common.updating', 'Updating...') : t('common.confirm', 'Yes, Change Status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulkPaymentTarget} onOpenChange={(open) => !open && setBulkPaymentTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Confirm Payment Status Change')}</DialogTitle>
            <DialogDescription>
              {t('orders.change_status_desc', `Are you sure you want to update the Payment Status of ${selectedIds.length} selected orders to "${bulkPaymentTarget}"?`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPaymentTarget(null)} disabled={isUpdatingBulk}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkPaymentTarget) {
                  setIsUpdatingBulk(true);
                  await handleBulkPaymentChange(bulkPaymentTarget);
                  setIsUpdatingBulk(false);
                  setBulkPaymentTarget(null);
                }
              }}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? t('common.updating', 'Updating...') : t('common.confirm', 'Yes, Change Status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={t('common.delete', 'Delete Selected Orders')}
        description={`${t('common.confirm_delete_desc', 'Are you sure you want to permanently delete the selected orders?')} (${selectedIds.length})`}
      />
    </div>
  );
};

export default OrdersPage;
