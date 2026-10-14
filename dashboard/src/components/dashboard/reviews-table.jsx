import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useReviews } from '@/hooks/use-reviews';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDate, formatDateTime } from '@/utils/dateHelper';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Checkbox } from '@/components/ui/checkbox';

export function ReviewsTable({
  searchQuery = '',
  statusFilter = 'All',
  selectedIds = [],
  onSelectedIdsChange,
}) {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading, isError } = useReviews();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewReview, setViewReview] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleToggleApproval = async (review, currentStatus) => {
    setUpdatingId(review.id);
    try {
      await apiClient.patch(`/api/v1/reviews/${review.id}/status`, { isApproved: !currentStatus });
      toast.success(`Review is now ${!currentStatus ? 'Approved' : 'Not Approved'}.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to update review status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/reviews/${deleteTarget.id}`);
      toast.success(`Review deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      if (onSelectedIdsChange) {
        onSelectedIdsChange(selectedIds.filter((id) => id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, 'Failed to delete review.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const productName = r.productId?.name?.toLowerCase() || '';
    const productDid = r.productDid?.toLowerCase() || '';
    const memberName = r.memberId?.name?.toLowerCase() || '';
    const memberEmail = r.memberId?.email?.toLowerCase() || '';
    const memberDid = r.memberDid?.toLowerCase() || '';
    const desc = r.description?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      productName.includes(query) ||
      productDid.includes(query) ||
      memberName.includes(query) ||
      memberEmail.includes(query) ||
      memberDid.includes(query) ||
      desc.includes(query);

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Approved' && Boolean(r.isApproved)) ||
      (statusFilter === 'Pending' && !r.isApproved) ||
      (statusFilter === 'Not Approved' && !r.isApproved);

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderStars = (rating) => {
    const numRating = Math.round(Number(rating) || 0);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= numRating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="ml-1.5 text-xs font-semibold text-foreground">
          {Number(rating).toFixed(1)}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 border rounded-md bg-card">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
        Failed to load reviews. Please refresh or try again later.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[45px] px-4">
              <Checkbox
                checked={
                  filteredReviews.length > 0 &&
                  selectedIds.length === filteredReviews.length
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectedIdsChange(filteredReviews.map((r) => r.id));
                  } else {
                    onSelectedIdsChange([]);
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="min-w-[180px]">Product</TableHead>
            <TableHead className="min-w-[170px]">Customer</TableHead>
            <TableHead className="min-w-[120px]">Rating</TableHead>
            <TableHead className="min-w-[220px]">Review Content</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No reviews found matching your search and filter criteria.
              </TableCell>
            </TableRow>
          ) : (
            filteredReviews.map((review) => {
              const isApproved = Boolean(review.isApproved);
              const isSelected = selectedIds.includes(review.id);

              return (
                <TableRow
                  key={review.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="px-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectedIdsChange([...selectedIds, review.id]);
                        } else {
                          onSelectedIdsChange(
                            selectedIds.filter((id) => id !== review.id)
                          );
                        }
                      }}
                      aria-label={`Select review for ${review.productId?.name || review.productDid}`}
                    />
                  </TableCell>

                  {/* Product */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground line-clamp-1">
                        {review.productId?.name || 'Product'}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        DID: {review.productDid}
                      </span>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-border shrink-0">
                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                          {getInitials(review.memberId?.name || review.memberDid)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-xs text-foreground truncate">
                          {review.memberId?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {review.memberId?.email || review.memberDid}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>{renderStars(review.rating)}</TableCell>

                  {/* Description */}
                  <TableCell>
                    <p
                      className="text-xs text-foreground/85 line-clamp-2 max-w-[280px] cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => setViewReview(review)}
                      title="Click to view full review"
                    >
                      {review.description}
                    </p>
                  </TableCell>

                  {/* Status & Quick Toggle */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Approved</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                        >
                          <XCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>Not Approved</span>
                        </Badge>
                      )}
                      <Switch
                        size="sm"
                        checked={isApproved}
                        disabled={updatingId === review.id}
                        onCheckedChange={() =>
                          handleToggleApproval(review, isApproved)
                        }
                        title={isApproved ? 'Click to Unapprove' : 'Click to Approve'}
                      />
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {review.createdAt ? formatDate(review.createdAt) : '—'}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Actions"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewReview(review)}>
                          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleApproval(review, isApproved)
                          }
                        >
                          {isApproved ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-amber-600" />
                              Unapprove
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                              Approve
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeleteTarget(review)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* View Review Modal */}
      {viewReview && (
        <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Review Details</span>
                {viewReview.isApproved ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    Not Approved
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Detailed customer review information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Product</span>
                  <span className="font-semibold text-sm">
                    {viewReview.productId?.name || 'Product'}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    DID: {viewReview.productDid}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Customer</span>
                  <span className="font-semibold text-sm">
                    {viewReview.memberId?.name || 'Customer'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {viewReview.memberId?.email || viewReview.memberDid}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rating</span>
                  {renderStars(viewReview.rating)}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {viewReview.description}
                  </p>
                </div>
              </div>

              {viewReview.createdAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Submitted on{' '}
                    {formatDateTime(viewReview.createdAt)}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-2">
              <Button
                variant={viewReview.isApproved ? 'outline' : 'default'}
                onClick={() => {
                  handleToggleApproval(viewReview, viewReview.isApproved);
                  setViewReview({
                    ...viewReview,
                    isApproved: !viewReview.isApproved,
                  });
                }}
              >
                {viewReview.isApproved ? 'Mark as Not Approved' : 'Approve Review'}
              </Button>
              <Button variant="secondary" onClick={() => setViewReview(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Single Review Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        description="Are you sure you want to delete this customer review? This action will remove it from the system."
        isDeleting={isDeleting}
      />
    </>
  );
}
