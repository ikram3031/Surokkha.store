import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CouponsTable } from '@/components/dashboard/coupons-table';
import { CouponDialog } from '@/components/dashboard/coupon-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Renders the coupons management page with discount rules, status filters, and creation dialog
const CouponsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const handleSearch = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleTypeFilter = (v) => {
    setTypeFilter(v ?? 'All');
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleOpenAddDialog = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.delete(`/api/v1/coupons/${id}`))
      );
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('categories_brands.coupon_title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('products.subtitle')}
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="shadow transition-all hover:scale-[1.02] cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          {t('categories_brands.add_coupon')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('common.search_placeholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1 mr-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('common.delete')} ({selectedIds.length})
            </Button>
          )}
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('common.all')}</SelectItem>
              <SelectItem value="Active">{t('common.active')}</SelectItem>
              <SelectItem value="Inactive">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('categories_brands.discount_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('common.all')}</SelectItem>
              <SelectItem value="Percentage">{t('categories_brands.percentage')}</SelectItem>
              <SelectItem value="Fixed">{t('categories_brands.fixed_amount')}</SelectItem>
              <SelectItem value="free_shipping">{t('categories_brands.free_shipping', 'Free Delivery')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6">
        <CouponsTable
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          page={currentPage}
          onTotalPagesChange={setTotalPages}
          onEditClick={handleOpenEditDialog}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
        />

        {totalPages > 1 && (
          <div className="border-t mt-4 pt-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage((p) => p - 1);
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
                      if (currentPage < totalPages) setCurrentPage((p) => p + 1);
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

      <CouponDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        couponToEdit={editingCoupon}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={t('common.delete')}
        description={`${t('common.confirm_delete')} (${selectedIds.length})`}
      />
    </div>
  );
};

export default CouponsPage;
