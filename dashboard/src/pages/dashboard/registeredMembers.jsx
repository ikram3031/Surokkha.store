import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Eye, Search, Trash2, UserCheck, X } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  TableRowActions, TableCheckbox, TableBulkBar, useTableSelection,
} from '@/components/ui/table-v2';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { PageHeader } from '@/components/ui/page-header';

const LIMIT = 15;

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;
const formatDate = (v) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

// Accounts created on the storefront (the "members" collection), separate from the order-based Customers list
export default function RegisteredMembers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);

  const updateParams = (updates) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || (key === 'page' && Number(val) === 1)) next.delete(key);
        else next.set(key, String(val));
      });
      return next;
    });

  useEffect(() => setSearchInput(q), [q]);

  // Debounced search, resets to page 1
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== q) updateParams({ q: trimmed, page: 1 });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['registered-members', page, q],
    queryFn: async () => {
      const params = { page, limit: LIMIT };
      if (q) params.q = q;
      return (await apiClient.get('/api/v1/members', { params })).data;
    },
    keepPreviousData: true,
  });

  const list = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const queryClient = useQueryClient();
  const selection = useTableSelection(list, (m) => m.id || m._id);
  const [deleteIds, setDeleteIds] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(deleteIds.map((id) => apiClient.delete(`/api/v1/members/${id}`)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed) toast.error(`${failed} member(s) could not be deleted`);
      else toast.success(t('members.deleted', 'Member(s) deleted'));
      selection.clear();
      queryClient.invalidateQueries({ queryKey: ['registered-members'] });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        icon={<UserCheck />}
        title={t('nav.members', 'Members')}
        description={<>{t('members.description', 'People who created an account on the website.')} · {t('common.showing', 'Showing')} {meta.total} {t('common.entries', 'entries')}</>}
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('members.search', 'Name, email or phone...')}
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
        onDelete={() => setDeleteIds(selection.selected)}
        onClear={selection.clear}
        deleting={isDeleting}
      />

      <div className="overflow-x-auto rounded-md border bg-card">
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
              <TableHead>{t('members.name', 'Name')}</TableHead>
              <TableHead>{t('members.email', 'Email')}</TableHead>
              <TableHead>{t('members.phone', 'Phone')}</TableHead>
              <TableHead className="text-center">{t('members.orders', 'Orders')}</TableHead>
              <TableHead className="text-right">{t('members.spent', 'Spent')}</TableHead>
              <TableHead>{t('members.joined', 'Registered')}</TableHead>
              <TableHead>{t('members.status', 'Status')}</TableHead>
              <TableHead className="w-[60px] text-right">{t('common.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">{t('common.loading', 'Loading...')}</TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-destructive">
                  {t('members.error', 'Error loading members.')}
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  {t('members.empty', 'No members found.')}
                </TableCell>
              </TableRow>
            ) : (
              list.map((m) => {
                const id = m.id || m._id;
                return (
                  <TableRow
                    key={id}
                    className="cursor-pointer"
                    data-state={selection.isSelected(id) ? 'selected' : undefined}
                    onClick={() => navigate(`/dashboard/members/${id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox checked={selection.isSelected(id)} onChange={(on) => selection.toggle(id, on)} />
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{m.email}</span>
                        {m.isEmailVerified && (
                          <Badge variant="outline" className="text-[10px]">{t('members.verified', 'Verified')}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{m.phone || '-'}</TableCell>
                    <TableCell className="text-center tabular-nums">{m.totalOrders ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(m.lifetimeSpent ?? m.totalOrderAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={m.isActive === false ? 'secondary' : 'default'}>
                        {m.isActive === false ? t('common.disabled', 'Inactive') : t('common.active', 'Active')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TableRowActions label={t('common.actions', 'Actions')}>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/members/${id}`)}>
                          <Eye className="size-4" /> {t('common.view', 'View')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteIds([id])}>
                          <Trash2 className="size-4" /> {t('common.delete', 'Delete')}
                        </DropdownMenuItem>
                      </TableRowActions>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteIds)}
        onOpenChange={(open) => !open && setDeleteIds(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Delete ${deleteIds?.length || 0} member(s)?`}
        description="Their website accounts will be removed. Orders stay."
      />

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => updateParams({ page: page + 1 })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
