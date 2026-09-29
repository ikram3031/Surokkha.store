import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewsTable } from '@/components/dashboard/reviews-table';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

// Renders the root dashboard product reviews moderation table and actions
const ReviewsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIds([]);
  };

  const handleStatusFilter = (v) => {
    setStatusFilter(v ?? 'All');
    setSelectedIds([]);
  };

  const handleBulkApprove = async (isApproved) => {
    try {
      await apiClient.post('/api/v1/reviews/bulk-update', {
        ids: selectedIds,
        isApproved,
      });
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSelectedIds([]);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await apiClient.post('/api/v1/reviews/bulk-delete', { ids: selectedIds });
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('categories_brands.reviews_title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('products.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 w-full sm:max-w-sm relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search_placeholder')}
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shadow-sm">
                    {t('common.actions')} ({selectedIds.length})
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkApprove(true)}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    {t('categories_brands.approve')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkApprove(false)}>
                    <XCircle className="mr-2 h-4 w-4 text-orange-600" />
                    {t('categories_brands.reject')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                className="shadow-sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </Button>
            </>
          )}

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('common.all')}</SelectItem>
              <SelectItem value="Approved">{t('categories_brands.approved')}</SelectItem>
              <SelectItem value="Pending">{t('categories_brands.pending_review')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReviewsTable
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
      />

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={t('common.delete')}
        description={`${t('common.confirm_delete')} (${selectedIds.length})`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
};

export default ReviewsPage;
