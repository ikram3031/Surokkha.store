import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MembersTable } from '@/components/dashboard/members-table';
import { Input } from '@/components/ui/input';
import { Search, Trash2, UserMinus, X } from 'lucide-react';
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

// Renders the customers directory page with pagination, search, segment filtering, and bulk actions
const MembersPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const segmentFilter = searchParams.get('segment') || 'All';
  const urlSearch = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkInactiveOpen, setBulkInactiveOpen] = useState(false);
  const [isBulkInactiveUpdating, setIsBulkInactiveUpdating] = useState(false);

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

  const handleSegment = (v) => {
    updateParams({ segment: v ?? 'All', page: 1 });
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
        selectedIds.map((id) => apiClient.delete(`/api/v1/members/${id}`))
      );
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkInactive = async () => {
    setIsBulkInactiveUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.put(`/api/v1/members/${id}`, { active: false })
        )
      );
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setSelectedIds([]);
      setBulkInactiveOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsBulkInactiveUpdating(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.customer_list')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('common.showing')} {t('common.entries')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('common.search_placeholder')}
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <div className="flex gap-1.5 items-center mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkInactiveOpen(true)}
                className="flex items-center gap-1 text-xs"
              >
                <UserMinus className="h-3.5 w-3.5" />
                {t('common.disabled')} ({selectedIds.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('common.delete')} ({selectedIds.length})
              </Button>
            </div>
          )}
          <Select value={segmentFilter} onValueChange={handleSegment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.filter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('common.all')}</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Returning">Returning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <MembersTable
            searchQuery={debouncedSearch}
            segmentFilter={segmentFilter}
            page={currentPage}
            onTotalPagesChange={setTotalPages}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
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

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={t('common.delete')}
        description={`${t('common.confirm_delete')} (${selectedIds.length})`}
      />

      <Dialog open={bulkInactiveOpen} onOpenChange={setBulkInactiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-destructive" />
              {t('common.disabled')}
            </DialogTitle>
            <DialogDescription>
              {t('common.confirm_delete_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkInactiveOpen(false)}
              disabled={isBulkInactiveUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkInactive}
              disabled={isBulkInactiveUpdating}
            >
              {isBulkInactiveUpdating ? t('common.updating') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
