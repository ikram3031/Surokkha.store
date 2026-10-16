import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductsTable } from '@/components/dashboard/products-table';
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

// Renders the products management interface with search, filters, pagination, and bulk stock controls
const ProductsPage = ({ fixedCategory = null, fixedOnSale = false, pageTitle = null }) => {
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
        selectedIds.map((id) => apiClient.delete(`/api/v1/products/${id}`))
      );
      toast.success(t('products.selected_deleted_success', 'Selected products deleted successfully.'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('products.selected_delete_failed', 'Failed to delete some products.'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStockStatus = async (status) => {
    setIsBulkStockUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.put(`/api/v1/products/${id}`, { stockStatus: status })
        )
      );
      toast.success(
        status === 'instock'
          ? t('products.in_stock')
          : t('products.out_of_stock')
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsBulkStockUpdating(false);
    }
  };

  const resolvedTitle = pageTitle || t('products.title');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{resolvedTitle}</h2>
        {!isReadOnly && (
          <Link
            to={
              fixedCategory
                ? `/dashboard/products/new?category=${encodeURIComponent(fixedCategory.toLowerCase())}`
                : '/dashboard/products/new'
            }
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('products.add_new_product')}
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('products.search_products')}
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
                  {t('products.stock_status')}:
                </span>
                {[
                  { value: 'all', label: t('common.all'), width: 'w-[52px]' },
                  { value: 'instock', label: t('products.in_stock'), width: 'w-[84px]' },
                  { value: 'outofstock', label: t('products.out_of_stock'), width: 'w-[106px]' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all select-none whitespace-nowrap ${item.width} ${
                      stockStatusFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground font-normal'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dashboardStockStatus"
                      value={item.value}
                      checked={stockStatusFilter === item.value}
                      onChange={() => handleStockStatus(item.value)}
                      className="h-3 w-3 accent-primary cursor-pointer shrink-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {fixedCategory ? (
                <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50 text-xs font-medium text-foreground shrink-0 select-none">
                  <span>{t('products.category')}: {categoryFilter}</span>
                </div>
              ) : (
                <Select value={categoryFilter} onValueChange={handleCategory}>
                  <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                    <span>
                      {categoryFilter === 'All'
                        ? `${t('products.category')}: ${t('common.all')}`
                        : `${t('products.category')}: ${categoryFilter}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md" side="bottom">
                    <SelectItem value="All">{`${t('products.category')}: ${t('common.all')}`}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.did} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasBrand && (
                <Select value={brandFilter} onValueChange={handleBrand}>
                  <SelectTrigger className="w-[160px] h-9 cursor-pointer text-xs">
                    <span>
                      {brandFilter === 'All'
                        ? `${t('products.brand')}: ${t('common.all')}`
                        : `${t('products.brand')}: ${brandFilter}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md" side="bottom">
                    <SelectItem value="All">{`${t('products.brand')}: ${t('common.all')}`}</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.did} value={brand.name}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          {selectedIds.length > 0 && !isReadOnly && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {t('products.selected_count', { count: selectedIds.length })}
              </span>
              <Select
                value=""
                onValueChange={(val) => {
                  if (val === 'instock' || val === 'outofstock') {
                    setBulkStockConfirmStatus(val);
                  }
                }}
                disabled={isBulkStockUpdating}
              >
                <SelectTrigger className="w-[145px] h-9 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium cursor-pointer text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <PackageX className="h-4 w-4 flex-shrink-0" />
                    <span>{t('products.change_stock')}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md" side="bottom">
                  <SelectItem value="instock" className="cursor-pointer text-xs">
                    {t('products.mark_in_stock')}
                  </SelectItem>
                  <SelectItem value="outofstock" className="cursor-pointer text-xs">
                    {t('products.mark_out_of_stock')}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-9 w-9 flex items-center justify-center shrink-0 cursor-pointer"
                title={`${t('common.delete')} (${selectedIds.length})`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.table.wrapper}>
        <div className="overflow-x-auto">
          <ProductsTable
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
            <DialogTitle>{t('products.confirm_stock_change')}</DialogTitle>
            <DialogDescription>
              {t('products.confirm_stock_change_desc', {
                count: selectedIds.length,
                status: bulkStockConfirmStatus === 'instock' ? t('products.in_stock') : t('products.out_of_stock')
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="cancel"
              onClick={() => setBulkStockConfirmStatus(null)}
              disabled={isBulkStockUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={async () => {
                if (bulkStockConfirmStatus) {
                  await handleBulkStockStatus(bulkStockConfirmStatus);
                  setBulkStockConfirmStatus(null);
                }
              }}
              disabled={isBulkStockUpdating}
            >
              {isBulkStockUpdating ? t('common.updating') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={t('products.delete_selected_products')}
        description={t('products.delete_selected_desc', { count: selectedIds.length })}
      />
    </div>
  );
};

export default ProductsPage;
