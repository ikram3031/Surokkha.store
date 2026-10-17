import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useCoupons } from '@/hooks/use-coupons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Ticket, Copy, Check, Percent, Tag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDate } from '@/utils/dateHelper';

export function CouponsTable({
  searchQuery,
  statusFilter,
  typeFilter,
  page = 1,
  onTotalPagesChange,
  onEditClick,
  selectedIds,
  onSelectedIdsChange,
}) {
  const queryClient = useQueryClient();
  const { data: coupons = [], isLoading, isError, error } = useCoupons();

  const [copiedCode, setCopiedCode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponIdentifier = (coupon) => coupon.id || coupon._id;

  const handleToggleActive = async (coupon, currentStatus) => {
    const couponId = getCouponIdentifier(coupon);

    if (!couponId) {
      toast.error('Unable to update coupon because its identifier is missing.');
      return;
    }

    try {
      await apiClient.put(`/api/v1/coupons/${couponId}`, { active: !currentStatus });
      toast.success(`Coupon "${coupon.code}" is now ${!currentStatus ? 'Active' : 'Inactive'}.`);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update coupon status.'));
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/coupons/${deleteTarget.id}`);
      toast.success(`Coupon "${deleteTarget.code}" deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete coupon.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && c.active) ||
      (statusFilter === 'Inactive' && !c.active);
    const matchesType = typeFilter === 'All' || c.discountType === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE) || 1;
  const paginatedCoupons = filteredCoupons.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (onTotalPagesChange) {
      onTotalPagesChange(totalPages);
    }
  }, [totalPages, onTotalPagesChange]);

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to fetch coupons. {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const formatDiscount = (type, value) => {
    return type === 'percentage' ? `${value}% OFF` : `৳${value.toFixed(0)} OFF`;
  };

  const getValidityBadge = (validFrom, validTo) => {
    const now = new Date();
    const start = validFrom ? new Date(validFrom) : null;
    const end = validTo ? new Date(validTo) : null;

    if (end && now > end) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (start && now < start) {
      return <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/5">Scheduled</Badge>;
    }
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Live</Badge>;
  };

  const isAllPageSelected = paginatedCoupons.length > 0 && paginatedCoupons.every(c => selectedIds.includes(c.id));

  return (
    <>
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
                    const pageIds = paginatedCoupons.map(c => c.id);
                    const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
                    onSelectedIdsChange(newSelected);
                  } else {
                    const pageIds = paginatedCoupons.map(c => c.id);
                    onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[180px]">Coupon Code</TableHead>
            <TableHead className="w-[140px]">Discount</TableHead>
            <TableHead className="w-[130px]">Min Purchase</TableHead>
            <TableHead className="w-[130px]">Usage (Used/Max)</TableHead>
            <TableHead className="min-w-[180px]">Restrictions</TableHead>
            <TableHead className="w-[180px]">Validity</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
            <TableHead className="w-[90px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-[50px] px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))
          ) : paginatedCoupons.length > 0 ? (
            paginatedCoupons.map((coupon) => {
              const restrictions = [];
              if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
                restrictions.push(`Cats: ${coupon.applicableCategories.map((c) => c.name).join(', ')}`);
              }
              if (coupon.applicableBrands && coupon.applicableBrands.length > 0) {
                restrictions.push(`Brands: ${coupon.applicableBrands.map((b) => b.name).join(', ')}`);
              }
              if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
                restrictions.push(`Prods: ${coupon.applicableProducts.map((p) => p.name).join(', ')}`);
              }

              return (
                <TableRow key={coupon.id}>
                  <TableCell className="w-[50px] px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      checked={selectedIds.includes(coupon.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedIdsChange([...selectedIds, coupon.id]);
                        } else {
                          onSelectedIdsChange(selectedIds.filter(id => id !== coupon.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-1.5 group/code">
                      <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono text-sm tracking-wide bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className="opacity-0 group-hover/code:opacity-100 hover:text-primary transition-all p-1 rounded hover:bg-muted shrink-0 cursor-pointer"
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.discountType === 'percentage' ? (
                        <Percent className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span className="font-medium">{formatDiscount(coupon.discountType, coupon.discountValue)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-muted-foreground">
                    ৳{(coupon.minOrderAmount ?? 0).toFixed(0)}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    <span className="font-semibold text-foreground">{coupon.usedCount ?? 0}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-muted-foreground">
                      {coupon.usageLimit !== undefined && coupon.usageLimit !== null
                        ? coupon.usageLimit
                        : 'Unlimited'}
                    </span>
                  </TableCell>

                  <TableCell className="max-w-[240px]">
                    {restrictions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {restrictions.map((r, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 px-1.5 py-0.5 rounded truncate block"
                            title={r}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None (Site-wide)</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-medium text-foreground">
                        {coupon.validTo ? formatDate(coupon.validTo) : 'Permanent'}
                      </div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {getValidityBadge(coupon.validFrom, coupon.validTo)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={coupon.active}
                      onCheckedChange={() => handleToggleActive(coupon, coupon.active)}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0" title="Actions menu">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditClick(coupon)}>
                          Edit Coupon
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => setDeleteTarget({ id: coupon.id, code: coupon.code })}
                        >
                          Delete Coupon
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No coupons found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteCoupon}
        isDeleting={isDeleting}
        title="Delete Coupon?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete the coupon "${deleteTarget.code}"? This action cannot be undone.`
            : ''
        }
      />
    </>
  );
}
