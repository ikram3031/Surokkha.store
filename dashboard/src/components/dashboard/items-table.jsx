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
import { useItems } from '@/hooks/use-items';
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

// Renders the items data table with status badges, variant stock controls, quick actions, and pagination
export const ItemsTable = ({
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

  const handleDuplicate = async (item) => {
    setDuplicatingId(item.id);
    try {
      const res = await apiClient.get(`/api/items/${item.id}`);
      const fullItem = res.data?.data || res.data;
      if (!fullItem) throw new Error('No item data received');
      setDuplicateDraft(fullItem);
      navigate('/dashboard/items/new');
    } catch {
      toast.error(t('items.duplicate_failed', { name: item.name, defaultValue: `Failed to duplicate "${item.name}". Please try again.` }));
    } finally {
      setDuplicatingId(null);
    }
  };

  const { data: responseData, isLoading, isError, error } = useItems({
    search: searchQuery,
    category: categoryFilter !== 'All' && categoryFilter !== 'LowStock' ? categoryFilter : undefined,
    brand: brandFilter !== 'All' ? brandFilter : undefined,
    stockStatus: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
    onSale: fixedOnSale ? true : undefined,
    page,
    limit: 15,
  });

  const items = responseData?.data ?? [];
  const totalPages = responseData?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (onTotalPagesChange && responseData?.meta) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange, responseData]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/items/${deleteTarget.id}`);
      toast.success(t('items.item_deleted', { name: deleteTarget.name, defaultValue: `Item "${deleteTarget.name}" deleted.` }));
      queryClient.invalidateQueries({ queryKey: ['items'] });
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

  const handleSaveStock = async () => {
    if (!stockTarget) return;
    setIsUpdatingStock(true);
    try {
      if (stockTarget.type === 'variant') {
        await apiClient.put(`/api/items/${stockTarget.id}`, {
          variants: targetVariants,
        });
      } else {
        await apiClient.put(`/api/items/${stockTarget.id}`, {
          stockStatus: targetStockStatus,
        });
      }
      toast.success(t('items.stock_updated_success', { name: stockTarget.name, defaultValue: `Stock status of "${stockTarget.name}" updated successfully.` }));
      queryClient.invalidateQueries({ queryKey: ['items'] });
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

  const isAllPageSelected = items.length > 0 && items.every(p => selectedIds.includes(p.id));

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
                    const pageIds = items.map(p => p.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = items.map(p => p.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[280px] min-w-[180px]">{t('items.item_name', 'Item Name')}</TableHead>
            <TableHead className="w-[120px]">{t('items.sku', 'SKU')}</TableHead>
            <TableHead className="w-[140px]">{t('items.category', 'Category')}</TableHead>
            {hasBrand && <TableHead className="w-[120px]">{t('items.brand', 'Brand')}</TableHead>}
            <TableHead className="w-[100px]">{t('common.price')}</TableHead>
            <TableHead className="w-[100px]">{t('items.offer_price', 'Offer Price')}</TableHead>
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
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="w-[50px] px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectedIdsChange([...selectedIds, item.id]);
                      } else {
                        onSelectedIdsChange(selectedIds.filter(id => id !== item.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Link to={`/dashboard/items/${item.id}`} className="flex items-center gap-3 min-w-0 hover:underline">
                    {item.image ? (
                      <div className="relative h-9 w-9 overflow-hidden rounded-md border flex-shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium truncate" title={item.name}>{item.name}</span>
                  </Link>
                </TableCell>

                <TableCell className="max-w-[120px]">
                  <span className="text-muted-foreground truncate block" title={item.sku}>{item.sku}</span>
                </TableCell>

                <TableCell className="max-w-[140px]">
                  <span className="truncate block" title={getCategoryName(item.category) || item.category}>
                    {getCategoryName(item.category) || item.category}
                  </span>
                </TableCell>

                {hasBrand && (
                  <TableCell className="max-w-[120px]">
                    <span className="truncate block text-muted-foreground" title={item.brand ? (getBrandName(item.brand) || item.brand) : '—'}>
                      {item.brand ? (getBrandName(item.brand) || item.brand) : '—'}
                    </span>
                  </TableCell>
                )}

                <TableCell className="w-[100px] font-medium">৳{item.price.toFixed(2)}</TableCell>

                <TableCell className="w-[100px] font-medium text-muted-foreground">
                  {item.offerPrice != null && item.offerPrice > 0
                    ? `৳${item.offerPrice.toFixed(2)}`
                    : '—'}
                </TableCell>

                <TableCell className="w-[120px] min-w-[120px]">
                  {item.status === 'In Stock' ? (
                    <Badge className="w-[100px] inline-flex items-center justify-center text-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap shrink-0" variant="outline">
                      {t('items.in_stock', 'In Stock')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="w-[100px] inline-flex items-center justify-center text-center bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap shrink-0">
                      {t('items.out_of_stock', 'Out of Stock')}
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
                        <Link to={`/dashboard/items/${item.id}`} className="cursor-pointer text-xs flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('items.view_edit_item', 'View / Edit Item')}
                        </Link>
                      } />
                      {!isReadOnly && (
                        <DropdownMenuItem
                          className="cursor-pointer text-xs flex items-center gap-2"
                          onClick={() => setStockTarget(item)}
                        >
                          <PackageX className="h-3.5 w-3.5 text-muted-foreground" />
                          {t('items.change_stock', 'Change Stock')}
                        </DropdownMenuItem>
                      )}
                      {!isReadOnly && (
                        <DropdownMenuItem
                          className="cursor-pointer text-xs flex items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hasBrand ? 9 : 8} className="h-32 text-center text-muted-foreground">
                {t('items.no_items_found', 'No items found.')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('items.delete_item_title', 'Delete Item')}
        description={t('items.delete_item_desc', {
          name: deleteTarget?.name,
          defaultValue: `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        })}
        onConfirm={handleDeleteItem}
        isDeleting={isDeleting}
      />

      {stockTarget && (
        <Dialog open={!!stockTarget} onOpenChange={(open) => !open && setStockTarget(null)}>
          <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>{t('items.update_stock_status', 'Update Stock Status')}</DialogTitle>
              <DialogDescription>{stockTarget.name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {stockTarget.type === 'variant' && targetVariants.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('items.variant_stock_title', 'Variant Stock')}
                  </p>
                  {targetVariants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="font-medium">{v.size}</span>
                      <Select
                        value={v.stockStatus || 'instock'}
                        onValueChange={(val) => {
                          const updated = [...targetVariants];
                          updated[i] = { ...updated[i], stockStatus: val };
                          setTargetVariants(updated);
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instock">{t('items.in_stock', 'In Stock')}</SelectItem>
                          <SelectItem value="outofstock">{t('items.out_of_stock', 'Out of Stock')}</SelectItem>
                          <SelectItem value="preorder">{t('items.preorder', 'Pre-order')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('items.stock_status', 'Stock Status')}
                  </label>
                  <Select value={targetStockStatus} onValueChange={setTargetStockStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instock">{t('items.in_stock', 'In Stock')}</SelectItem>
                      <SelectItem value="outofstock">{t('items.out_of_stock', 'Out of Stock')}</SelectItem>
                      <SelectItem value="preorder">{t('items.preorder', 'Pre-order')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStockTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveStock} disabled={isUpdatingStock}>
                {isUpdatingStock ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
