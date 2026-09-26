import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OrdersTable } from '@/components/dashboard/orders-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, PlusCircle, Trash2, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

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

// Renders the dedicated management page for custom orders (order ID prefixed with CO)
const CustomOrdersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  const handleStatus = (v) => {
    updateParams({ status: v ?? 'All', page: 1 });
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
        description: `${selectedIds.length} custom order(s) deleted by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', 'Selected custom orders deleted successfully.'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('common.error', 'Failed to delete some custom orders.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (!status || status === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, status });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} custom order(s) status updated to "${status}" by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected custom orders updated to status "${status}".`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error', 'Failed to update custom orders.'));
    }
  };

  const handleBulkPaymentChange = async (paymentStatus) => {
    if (!paymentStatus || paymentStatus === 'placeholder') return;
    try {
      await apiClient.post('/api/v1/orders/bulk-update', { ids: selectedIds, paymentStatus });
      logActivity({
        type: 'updated',
        description: `${selectedIds.length} custom order(s) payment status updated to "${paymentStatus}" by "${user?.name || 'Admin'}"`,
      });
      toast.success(t('orders.order_updated_success', `Selected custom orders updated to payment status "${paymentStatus}".`));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error', 'Failed to update custom orders.'));
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('nav.custom_orders', 'Custom Orders')}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t('orders.custom_orders_desc', 'Manage tailored manual phone/chat orders with custom pricing and delivery')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link to="/dashboard/orders/custom/new" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('orders.new_custom_order', 'New Custom Order')}
          </Button>
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
              <Select value={statusFilter} onValueChange={handleStatus}>
                <SelectTrigger className="w-[180px] h-9 cursor-pointer text-xs">
                  <span>
                    {statusFilter === 'All'
                      ? `${t('orders.order_status', 'Order Status')}: ${t('common.all', 'All')}`
                      : `${t('orders.order_status', 'Order Status')}: ${statusFilter}`}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="All">{t('orders.order_status', 'Order Status')}: {t('common.all', 'All')}</SelectItem>
                  <SelectItem value="Processing">{t('orders.status_processing', 'Processing')}</SelectItem>
                  <SelectItem value="Shipped">{t('orders.status_shipped', 'Shipped')}</SelectItem>
                  <SelectItem value="Completed">{t('orders.status_delivered', 'Completed')}</SelectItem>
                  <SelectItem value="Cancelled">{t('orders.status_canceled', 'Cancelled')}</SelectItem>
                </SelectContent>
              </Select>

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

          {selectedIds.length > 0 && (
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
                  <SelectItem value="Processing" className="cursor-pointer text-xs">{t('orders.status_processing', 'Processing')}</SelectItem>
                  <SelectItem value="Shipped" className="cursor-pointer text-xs">{t('orders.status_shipped', 'Shipped')}</SelectItem>
                  <SelectItem value="Completed" className="cursor-pointer text-xs">{t('orders.status_delivered', 'Completed')}</SelectItem>
                  <SelectItem value="Cancelled" className="cursor-pointer text-xs">{t('orders.status_canceled', 'Cancelled')}</SelectItem>
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

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg">
        <div className="p-6">
          <OrdersTable
            searchQuery={debouncedSearch}
            statusFilter={statusFilter}
            paymentFilter={paymentFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            orderType="custom"
          />

          <div className="border-t mt-4 pt-3">
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

      <Dialog open={!!bulkStatusTarget} onOpenChange={(open) => !open && setBulkStatusTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('orders.change_status', 'Confirm Order Status Change')}</DialogTitle>
            <DialogDescription>
              {t('orders.change_status_desc', `Are you sure you want to update the Order Status of ${selectedIds.length} selected custom orders to "${bulkStatusTarget}"?`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusTarget(null)} disabled={isUpdatingBulk}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkStatusTarget) {
                  setIsUpdatingBulk(true);
                  await handleBulkStatusChange(bulkStatusTarget);
                  setIsUpdatingBulk(false);
                  setBulkStatusTarget(null);
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
              {t('orders.change_status_desc', `Are you sure you want to update the Payment Status of ${selectedIds.length} selected custom orders to "${bulkPaymentTarget}"?`)}
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
        title={t('common.delete', 'Delete Selected Custom Orders')}
        description={`${t('common.confirm_delete_desc', 'Are you sure you want to permanently delete the selected custom orders?')} (${selectedIds.length})`}
      />
    </div>
  );
};

export default CustomOrdersPage;
