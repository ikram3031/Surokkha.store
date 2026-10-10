import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SpamList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch spam list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['spam-list', page],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/orders/spam/list?page=${page}&limit=${limit}`);
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

  const handleDelete = (id) => {
    if (confirm(t('spam.confirm_delete', 'Are you sure you want to remove this from the spam list?'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            {t('nav.spam_list', 'Spam List')}
          </h2>
          <p className="text-muted-foreground">
            {t('spam.description', 'Manage and view blocked emails and phone numbers from fake orders.')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('spam.blocked_entries', 'Blocked Entries')}</CardTitle>
          <CardDescription>
            {t('spam.blocked_description', 'These details are prevented from placing new orders.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('spam.email', 'Email')}</TableHead>
                  <TableHead>{t('spam.phone', 'Phone')}</TableHead>
                  <TableHead>{t('spam.date_added', 'Date Added')}</TableHead>
                  <TableHead className="w-[100px] text-right">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      {t('common.loading', 'Loading...')}
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-red-500">
                      {t('common.error_loading', 'Error loading spam list.')}
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      {t('spam.no_data', 'No spam entries found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((entry) => (
                    <TableRow key={entry._id || entry.id}>
                      <TableCell>
                        {entry.email ? (
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            {entry.email}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.phone ? (
                          <Badge variant="outline" className="text-red-500 border-red-200">
                            {entry.phone}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry._id || entry.id)}
                          disabled={deleteMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
                        </Button>
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
    </div>
  );
}
