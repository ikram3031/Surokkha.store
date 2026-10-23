import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ItemsTable } from '@/components/dashboard/items-table';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, PackageX, X } from 'lucide-react';
import { useCategories, useBrands } from '@/lib/category-cache';
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
import { Button } from '@/components/ui/button';
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
import { clientConfig } from '@/clientConfig';
import { useAuth } from '@/lib/auth-context';
import { isReadOnlyRole } from '@/lib/rbac';
import styles from '@/styles/styles.json';

// Renders the items management interface with search, filters, pagination, and bulk stock controls
const ItemsPage = ({ fixedCategory = null, fixedOnSale = false, pageTitle = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isReadOnly = isReadOnlyRole(user?.role);
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const categoryFilter = fixedCategory || searchParams.get('category') || 'All';
  const brandFilter = searchParams.get('brand') || 'All';
  const stockStatusFilter = searchParams.get('stock') || 'all';
  const urlSearch = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkStockUpdating, setIsBulkStockUpdating] = useState(false);
  const [bulkStockConfirmStatus, setBulkStockConfirmStatus] = useState(null);

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

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

  useEffect(() => {
    if (fixedCategory && categories.length > 0) {
      const match = categories.find(
        (c) =>
          c.name?.toLowerCase() === fixedCategory.toLowerCase() ||
          c.slug?.toLowerCase() === fixedCategory.toLowerCase() ||
          c.name?.toLowerCase().includes(fixedCategory.toLowerCase()) ||
          c.slug?.toLowerCase().includes(fixedCategory.toLowerCase())
      );
      if (match?.name && categoryFilter !== match.name) {
        updateParams({ category: match.name, page: 1 });
      }
    }
  }, [fixedCategory, categories]);

  const handleCategory = (v) => {
    updateParams({ category: v ?? 'All', page: 1 });
    setSelectedIds([]);
  };

  const handleBrand = (v) => {
    updateParams({ brand: v ?? 'All', page: 1 });
    setSelectedIds([]);
  };

  const handleStockStatus = (v) => {
    updateParams({ stock: v ?? 'all', page: 1 });
    setSelectedIds([]);
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => apiClient.delete(`/api/v1/items/${id}`))
      );
      toast.success(t('items.selected_deleted_success', 'Selected items deleted successfully.'));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('items.selected_delete_failed', 'Failed to delete some items.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStockStatus = async (status) => {
    setIsBulkStockUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.put(`/api/v1/items/${id}`, { stockStatus: status })
        )
      );
      toast.success(
        status === 'instock'
          ? t('items.in_stock', 'In Stock')
          : t('items.out_of_stock', 'Out of Stock')
      );
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsBulkStockUpdating(false);
    }
  };

  const resolvedTitle = pageTitle || t('items.title', 'Items');

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{resolvedTitle}</h2>
        {!isReadOnly && (
          <Link
            to={
              fixedCategory
                ? `/dashboard/items/new?category=${encodeURIComponent(fixedCategory.toLowerCase())}`
                : '/dashboard/items/new'
            }
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('items.add_new_item', 'Add New Item')}
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('items.search_items', 'Search items...')}
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
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto justify-end flex-wrap">
          {selectedIds.length === 0 && (
            <>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border text-xs font-medium shrink-0">
                <span className="text-[11px] text-muted-foreground px-1.5 font-semibold">
                  {t('items.stock_status', 'Stock Status')}:
                </span>
                {[
                  { value: 'all', label: t('common.all'), width: 'w-[52px]' },
                  { value: 'instock', label: t('items.in_stock', 'In Stock'), width: 'w-[75px]' },
                  { value: 'outofstock', label: t('items.out_of_stock', 'Out of Stock'), width: 'w-[95px]' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleStockStatus(tab.value)}
                    className={`${tab.width} py-1 text-center rounded transition-all cursor-pointer ${
                      stockStatusFilter === tab.value
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {!fixedCategory && (
                <Select value={categoryFilter} onValueChange={handleCategory}>
                  <SelectTrigger className="w-[140px] h-9 text-xs shrink-0">
                    <SelectValue placeholder={t('items.category', 'Category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('common.all_categories')}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c._id || c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasBrand && (
                <Select value={brandFilter} onValueChange={handleBrand}>
                  <SelectTrigger className="w-[130px] h-9 text-xs shrink-0">
                    <SelectValue placeholder={t('items.brand', 'Brand')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('common.all_brands')}</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b._id || b.did || b.name} value={b.did || b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          {selectedIds.length > 0 && !isReadOnly && (
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-md border text-xs animate-in fade-in slide-in-from-right-1 duration-150">
              <span className="text-xs font-semibold px-2 text-foreground">
                {t('items.selected_count', { count: selectedIds.length, defaultValue: `${selectedIds.length} Selected` })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStockConfirmStatus('instock')}
                className="h-7 text-xs px-2.5 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                {t('items.in_stock', 'In Stock')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStockConfirmStatus('outofstock')}
                className="h-7 text-xs px-2.5 cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                {t('items.out_of_stock', 'Out of Stock')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-7 text-xs px-2.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t('common.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.table.wrapper}>
        <div className="overflow-x-auto">
          <ItemsTable
            searchQuery={debouncedSearch}
            categoryFilter={categoryFilter}
            brandFilter={brandFilter}
            stockStatusFilter={stockStatusFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            fixedOnSale={fixedOnSale}
            isReadOnly={isReadOnly}
          />

          {totalPages > 1 && (
            <div className="py-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                          className="cursor-pointer"
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
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
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
      </div>

      <Dialog open={!!bulkStockConfirmStatus} onOpenChange={(open) => !open && setBulkStockConfirmStatus(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t('items.confirm_stock_change', 'Confirm Stock Change')}</DialogTitle>
            <DialogDescription>
              {t('items.confirm_stock_change_desc', {
                count: selectedIds.length,
                status: bulkStockConfirmStatus === 'instock' ? t('items.in_stock', 'In Stock') : t('items.out_of_stock', 'Out of Stock'),
                defaultValue: `Are you sure you want to change the stock status of ${selectedIds.length} items to ${bulkStockConfirmStatus === 'instock' ? 'In Stock' : 'Out of Stock'}?`
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="cancel" onClick={() => setBulkStockConfirmStatus(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const s = bulkStockConfirmStatus;
                setBulkStockConfirmStatus(null);
                handleBulkStockStatus(s);
              }}
              disabled={isBulkStockUpdating}
            >
              {isBulkStockUpdating ? t('common.updating', 'Updating...') : t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t('items.bulk_delete_title', 'Delete Selected Items')}
        description={t('items.bulk_delete_desc', {
          count: selectedIds.length,
          defaultValue: `Are you sure you want to delete ${selectedIds.length} selected items? This action cannot be undone.`
        })}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
};

export default ItemsPage;
