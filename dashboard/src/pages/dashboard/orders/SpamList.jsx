import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { ShieldAlert, Trash2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowActions, TableCheckbox, TableBulkBar, useTableSelection } from '@/components/ui/table-v2';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/error-handler';
import { PageHeader } from '@/components/ui/page-header';

export default function SpamList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');

  // Debounced search, resets to page 1
  useEffect(() => {
    const handler = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch spam list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['spam-list', page, q],
    queryFn: async () => {
      const params = { page, limit };
      if (q) params.q = q;
      const res = await apiClient.get('/api/v1/orders/spam/list', { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  const list = data?.data || [];
  const pagination = data?.pagination;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/v1/orders/spam/${id}`);
    },
    onSuccess: () => {
      toast.success(t('spam.deleted_success', 'Spam entry deleted successfully'));
      queryClient.invalidateQueries({ queryKey: ['spam-list'] });
    },
    onError: (error) => {
      toast.error(t('spam.deleted_error', 'Failed to delete spam entry'));
      console.error(error);
    }
  });

  // Manual add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      await apiClient.post('/api/v1/orders/spam', payload);
    },
    onSuccess: () => {
      toast.success(t('spam.added_success', 'Added to spam list'));
      queryClient.invalidateQueries({ queryKey: ['spam-list'] });
      setIsAddOpen(false);
      setNewPhone('');
      setNewEmail('');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('spam.added_error', 'Failed to add to spam list')));
    },
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const phone = newPhone.trim();
    const email = newEmail.trim();
    if (!phone && !email) {
      toast.error(t('spam.phone_or_email_required', 'Enter a phone number or email'));
      return;
    }
    addMutation.mutate({ phone, email });
  };

  const handleDelete = (id) => {
    if (confirm(t('spam.confirm_delete', 'Are you sure you want to remove this from the spam list?'))) {
      deleteMutation.mutate(id);
    }
  };

  const selection = useTableSelection(list, (e) => e._id || e.id);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selection.selected.map((id) => apiClient.delete(`/api/v1/orders/spam/${id}`))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed) toast.error(`${failed} entr${failed === 1 ? 'y' : 'ies'} could not be removed`);
      else toast.success(t('spam.bulk_deleted', 'Selected entries removed'));
      selection.clear();
      queryClient.invalidateQueries({ queryKey: ['spam-list'] });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        icon={<ShieldAlert />}
        title={t('nav.spam_list', 'Spam List')}
        description={t('spam.description', 'Manage and view blocked emails and phone numbers from fake orders.')}
        actions={
          <>
            <Button type="button" onClick={() => setIsAddOpen(true)} className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          {t('spam.add_new', 'Add New')}
        </Button>
          </>
        }
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t('spam.add_title', 'Add to Spam List')}</DialogTitle>
              <DialogDescription>
                {t('spam.add_description', 'Orders from this phone number or email will be blocked. Fill in at least one.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="spam-phone">{t('spam.phone', 'Phone')}</Label>
              <Input
                id="spam-phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spam-email">{t('spam.email', 'Email')}</Label>
              <Input
                id="spam-email"
                type="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={() => setIsAddOpen(false)} disabled={addMutation.isPending}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={addMutation.isPending} className="cursor-pointer">
                {addMutation.isPending ? t('common.saving', 'Saving...') : t('spam.add_new', 'Add New')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t('spam.blocked_entries', 'Blocked Entries')}</CardTitle>
          <CardDescription>
            {t('spam.blocked_description', 'These details are prevented from placing new orders.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3 w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('spam.search', 'Phone or email...')}
              className="h-9 pl-8 pr-8 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <TableBulkBar
            count={selection.count}
            onDelete={() => setBulkDeleteOpen(true)}
            onClear={selection.clear}
            deleting={isBulkDeleting}
          />
          <div className="mt-3 rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <TableCheckbox
                      checked={selection.allOnPage}
                      indeterminate={selection.someOnPage}
                      onChange={selection.togglePage}
                      label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>{t('spam.email', 'Email')}</TableHead>
                  <TableHead>{t('spam.phone', 'Phone')}</TableHead>
                  <TableHead>{t('spam.date_added', 'Date Added')}</TableHead>
                  <TableHead className="w-[100px] text-right">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      {t('common.loading', 'Loading...')}
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-red-500">
                      {t('common.error_loading', 'Error loading spam list.')}
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      {t('spam.no_data', 'No spam entries found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((entry) => (
                    <TableRow
                      key={entry._id || entry.id}
                      data-state={selection.isSelected(entry._id || entry.id) ? 'selected' : undefined}
                    >
                      <TableCell>
                        <TableCheckbox
                          checked={selection.isSelected(entry._id || entry.id)}
                          onChange={(on) => selection.toggle(entry._id || entry.id, on)}
                        />
                      </TableCell>
                      <TableCell>
                        {entry.email ? (
                          <span className="text-sm text-foreground">{entry.email}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.phone ? (
                          <span className="font-mono text-sm text-foreground">{entry.phone}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <TableRowActions label={t('common.actions', 'Actions')}>
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(entry._id || entry.id)}
                          >
                            <Trash2 /> {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </TableRowActions>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.previous', 'Previous')}
              </Button>
              <div className="text-sm text-muted-foreground">
                {t('common.page', 'Page')} {page} {t('common.of', 'of')} {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                {t('common.next', 'Next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
        title={`Remove ${selection.count} entr${selection.count === 1 ? 'y' : 'ies'} from the spam list?`}
        description="These phone numbers and emails will be able to place orders again."
      />
    </div>
  );
}
