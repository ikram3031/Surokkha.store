import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-products';
import { getCategoryName, getBrandName } from '@/lib/category-cache';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ImageIcon, PackageX, Trash2, Eye, Copy, Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

import { clientConfig } from '@/clientConfig';

// Renders the products data table with status badges, variant stock controls, quick actions, and pagination
export const ProductsTable = ({
  searchQuery,
  categoryFilter,
  brandFilter,
  stockStatusFilter = 'all',
  page = 1,
  onTotalPagesChange,
  selectedIds,
  onSelectedIdsChange,
  fixedOnSale = false,
  isReadOnly = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setDuplicateDraft } = useDashboardStore();
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;

  const [duplicatingId, setDuplicatingId] = useState(null);

  const handleDuplicate = async (product) => {
    setDuplicatingId(product.id);
    try {
      const res = await apiClient.get(`/api/v1/products/${product.id}`);
      const fullProduct = res.data?.data || res.data;
      if (!fullProduct) throw new Error('No product data received');
      setDuplicateDraft(fullProduct);
      navigate('/dashboard/products/new');
    } catch {
      toast.error(t('products.duplicate_failed', { name: product.name, defaultValue: `Failed to duplicate "${product.name}". Please try again.` }));
    } finally {
      setDuplicatingId(null);
    }
  };

  const { data: responseData, isLoading, isError, error } = useProducts({
    search: searchQuery,
    category: categoryFilter !== 'All' && categoryFilter !== 'LowStock' ? categoryFilter : undefined,
    brand: brandFilter !== 'All' ? brandFilter : undefined,
    stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
    onSale: fixedOnSale ? true : undefined,
    page,
    limit: 15,
  });

  const products = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/products/${deleteTarget.id}`);
      toast.success(t('products.product_deleted', { name: deleteTarget.name, defaultValue: `Product "${deleteTarget.name}" deleted.` }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSelectedIdsChange(selectedIds.filter(id => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const [stockTarget, setStockTarget] = useState(null);
  const [targetStockStatus, setTargetStockStatus] = useState('instock');
  const [targetVariants, setTargetVariants] = useState([]);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  useEffect(() => {
    if (stockTarget) {
      setTargetStockStatus(stockTarget.status === 'In Stock' ? 'instock' : 'outofstock');
      if (stockTarget.type === 'variant' && Array.isArray(stockTarget.variants)) {
        setTargetVariants(
          stockTarget.variants.map((v) => ({
            ...v,
            stockStatus: v.stockStatus || 'instock',
          }))
        );
      } else {
        setTargetVariants([]);
      }
    }
  }, [stockTarget]);

  const handleVariantStockChange = (size, newStatus) => {
    setTargetVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, stockStatus: newStatus } : v))
    );
  };

  const handleMarkAllVariants = (status) => {
    setTargetVariants((prev) =>
      prev.map((v) => ({ ...v, stockStatus: status }))
    );
  };

  const handleUpdateStockStatus = async () => {
    if (!stockTarget) return;
    setIsUpdatingStock(true);
    try {
      if (stockTarget.type === 'variant' && targetVariants.length > 0) {
        const anyInStock = targetVariants.some((v) => v.stockStatus === 'instock');
        await apiClient.put(`/api/v1/products/${stockTarget.id}`, {
          variants: targetVariants,
          stockStatus: anyInStock ? 'instock' : 'outofstock',
        });
      } else {
        await apiClient.put(`/api/v1/products/${stockTarget.id}`, {
          stockStatus: targetStockStatus,
        });
      }
      toast.success(t('products.stock_updated_success', { name: stockTarget.name, defaultValue: `Stock status of "${stockTarget.name}" updated successfully.` }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStockTarget(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsUpdatingStock(false);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('common.error')}</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : t('common.error')}
        </AlertDescription>
      </Alert>
    );
  }

  const isAllPageSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));

  return (
    <div className="rounded-md border overflow-hidden">
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
                    const pageIds = products.map(p => p.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = products.map(p => p.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[280px] min-w-[180px]">{t('products.product_name')}</TableHead>
            <TableHead className="w-[120px]">{t('products.sku')}</TableHead>
            <TableHead className="w-[140px]">{t('products.category')}</TableHead>
            {hasBrand && <TableHead className="w-[120px]">{t('products.brand')}</TableHead>}
            <TableHead className="w-[100px]">{t('common.price')}</TableHead>
            <TableHead className="w-[100px]">{t('products.offer_price', 'Offer Price')}</TableHead>
            <TableHead className="w-[120px] min-w-[120px]">{t('common.status')}</TableHead>
            <TableHead className="w-[60px] text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[50px] px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md flex-shrink-0" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                {hasBrand && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, product.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== product.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Link to={`/dashboard/products/${product.id}`} className="flex items-center gap-3 min-w-0 hover:underline">
                    {product.image ? (
                      <div className="relative h-9 w-9 overflow-hidden rounded-md border flex-shrink-0">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium truncate" title={product.name}>{product.name}</span>
                  </Link>
                </TableCell>

                <TableCell className="max-w-[120px]">
                  <span className="text-muted-foreground truncate block" title={product.sku}>{product.sku}</span>
                </TableCell>

                <TableCell className="max-w-[140px]">
                  <span className="truncate block" title={getCategoryName(product.category) || product.category}>
                    {getCategoryName(product.category) || product.category}
                  </span>
                </TableCell>

                {hasBrand && (
                  <TableCell className="max-w-[120px]">
                    <span className="truncate block text-muted-foreground" title={product.brand ? (getBrandName(product.brand) || product.brand) : '—'}>
                      {product.brand ? (getBrandName(product.brand) || product.brand) : '—'}
                    </span>
                  </TableCell>
                )}

                <TableCell className="w-[100px] font-medium">৳{product.price.toFixed(2)}</TableCell>

                <TableCell className="w-[100px] font-medium text-muted-foreground">
                  {product.offerPrice != null && product.offerPrice > 0
                    ? `৳${product.offerPrice.toFixed(2)}`
                    : '—'}
                </TableCell>

                <TableCell className="w-[120px] min-w-[120px]">
                  {product.status === 'In Stock' ? (
                    <Badge className="w-[100px] inline-flex items-center justify-center text-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap shrink-0" variant="outline">
                      {t('products.in_stock')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="w-[100px] inline-flex items-center justify-center text-center bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap shrink-0">
                      {t('products.out_of_stock')}
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="text-right w-[60px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="min-w-[150px]">
                      <DropdownMenuLabel className="text-xs">{t('common.actions')}</DropdownMenuLabel>
                      <DropdownMenuItem render={
                        <Link to={`/dashboard/products/${product.id}`} className="cursor-pointer text-xs flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('products.view_edit_product', 'View / Edit Product')}
                        </Link>
                      } />
                      {!isReadOnly && (
                        <DropdownMenuItem
                          className="cursor-pointer text-xs flex items-center gap-2"
                          onClick={() => setStockTarget(product)}
                        >
                          <PackageX className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('products.change_stock')}
                        </DropdownMenuItem>
                      )}
                      {!isReadOnly && (
                        <DropdownMenuItem
                          className="cursor-pointer text-xs flex items-center gap-2"
                          onClick={() => handleDuplicate(product)}
                          disabled={duplicatingId === product.id}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          {duplicatingId === product.id ? t('products.duplicating', 'Duplicating...') : t('products.duplicate_product', 'Duplicate Product')}
                        </DropdownMenuItem>
                      )}
                      {!isReadOnly && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2"
                            onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('products.delete_product', 'Delete Product')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hasBrand ? 9 : 8} className="h-24 text-center">
                {t('products.no_products_found', 'No products found.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!stockTarget} onOpenChange={(open) => !open && setStockTarget(null)}>
        <DialogContent className={stockTarget?.type === 'variant' && targetVariants.length > 0 ? "sm:max-w-[520px]" : "sm:max-w-[420px]"}>
          <DialogHeader>
            <DialogTitle>
              {stockTarget?.type === 'variant' && targetVariants.length > 0 ? t('products.change_variation_stock', 'Change Variation Stock') : t('products.change_stock')}
            </DialogTitle>
            <DialogDescription>
              {t('products.update_availability_for', { name: stockTarget?.name, defaultValue: `Update availability status for ${stockTarget?.name}.` })}
            </DialogDescription>
          </DialogHeader>

          {stockTarget?.type === 'variant' && targetVariants.length > 0 ? (
            <div className="space-y-3.5 py-1">
              <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-lg border text-xs">
                <span className="font-medium text-muted-foreground">
                  {t('common.status')}: <span className="font-semibold text-foreground">{targetVariants.filter((v) => v.stockStatus === 'instock').length}</span> {t('common.of')} {targetVariants.length} {t('products.in_stock')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2 gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                    onClick={() => handleMarkAllVariants('instock')}
                  >
                    <Check className="h-3 w-3" /> {t('products.all_in', 'All In')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2 gap-1 text-red-600 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                    onClick={() => handleMarkAllVariants('outofstock')}
                  >
                    <X className="h-3 w-3" /> {t('products.all_out', 'All Out')}
                  </Button>
                </div>
              </div>

              <div className="max-h-[260px] overflow-y-auto divide-y border rounded-lg bg-background">
                {targetVariants.map((v, idx) => (
                  <div key={v.size || idx} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{v.size}</p>
                      {v.sku && <p className="text-[10px] text-muted-foreground font-mono truncate">{v.sku}</p>}
                    </div>

                    <div className="w-[145px] shrink-0">
                      <Select
                        value={v.stockStatus || 'instock'}
                        onValueChange={(val) => handleVariantStockChange(v.size, val || 'instock')}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-md">
                          <SelectItem value="instock" className="text-xs cursor-pointer">
                            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                              <span className="h-2 w-2 rounded bg-emerald-500 inline-block" />
                              {t('products.in_stock')}
                            </span>
                          </SelectItem>
                          <SelectItem value="outofstock" className="text-xs cursor-pointer">
                            <span className="flex items-center gap-1.5 font-medium text-red-600">
                              <span className="h-2 w-2 rounded bg-red-500 inline-block" />
                              {t('products.out_of_stock')}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">{t('products.current_status', 'Current Status:')}</span>
                <span className="text-sm font-semibold">
                  {stockTarget?.status === 'In Stock' ? (
                    <span className="text-emerald-600">{t('products.in_stock')}</span>
                  ) : (
                    <span className="text-red-600">{t('products.out_of_stock')}</span>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">{t('products.new_availability', 'New Availability:')}</span>
                <Select value={targetStockStatus} onValueChange={(val) => setTargetStockStatus(val || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.select_option')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    <SelectItem value="instock" className="cursor-pointer">{t('products.in_stock')}</SelectItem>
                    <SelectItem value="outofstock" className="cursor-pointer">{t('products.out_of_stock')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockTarget(null)}
              disabled={isUpdatingStock}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              onClick={handleUpdateStockStatus}
              disabled={isUpdatingStock}
            >
              {isUpdatingStock ? t('common.updating') : t('common.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        isDeleting={isDeleting}
        title={t('products.delete_product', 'Delete Product')}
        description={t('products.delete_confirm_desc', { name: deleteTarget?.name ?? '', defaultValue: `Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.` })}
      />
    </div>
  );
};
