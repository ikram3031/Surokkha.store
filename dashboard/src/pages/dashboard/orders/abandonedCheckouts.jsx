import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { ShoppingCart, Trash2, Phone, Search, MessageCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Abandoned' },
  { key: 'converted', label: 'Converted' },
];

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;

export default function AbandonedCheckouts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['checkout-leads', page, status, q],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set('status', status);
      if (q) params.set('q', q);
      const res = await apiClient.get(`/api/v1/checkout-leads?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const list = data?.data || [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/v1/checkout-leads/${id}`);
    },
    onSuccess: () => {
      toast.success(t('abandoned.deleted', 'Checkout deleted'));
      queryClient.invalidateQueries({ queryKey: ['checkout-leads'] });
    },
    onError: () => toast.error(t('abandoned.delete_error', 'Failed to delete checkout')),
  });

  const handleDelete = (id) => {
    if (confirm(t('abandoned.confirm_delete', 'Delete this checkout record?'))) deleteMutation.mutate(id);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(search.trim());
  };

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          {t('nav.abandoned_checkouts', 'Abandoned Checkouts')}
        </h2>
        <p className="text-muted-foreground">
          {t('abandoned.description', 'Customers who started checkout. Call them to complete the order.')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('abandoned.stat_open', 'Abandoned')}</CardDescription>
            <CardTitle className="text-2xl">{stats?.open ?? '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('abandoned.stat_value', 'Abandoned cart value')}</CardDescription>
            <CardTitle className="text-2xl">{stats ? formatMoney(stats.openValue) : '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('abandoned.stat_converted', 'Converted to orders')}</CardDescription>
            <CardTitle className="text-2xl">{stats?.converted ?? '-'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {STATUS_TABS.map((tab) => (
                <Button
                  key={tab.key || 'all'}
                  type="button"
                  size="sm"
                  variant={status === tab.key ? 'default' : 'outline'}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                >
                  {t(`abandoned.tab_${tab.key || 'all'}`, tab.label)}
                </Button>
              ))}
            </div>
            <form onSubmit={submitSearch} className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('abandoned.search', 'Name, phone, email...')}
                className="w-full md:w-64"
              />
              <Button type="submit" size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('abandoned.customer', 'Customer')}</TableHead>
                  <TableHead>{t('abandoned.items', 'Items')}</TableHead>
                  <TableHead>{t('abandoned.total', 'Total')}</TableHead>
                  <TableHead>{t('abandoned.last_activity', 'Last activity')}</TableHead>
                  <TableHead>{t('abandoned.status', 'Status')}</TableHead>
                  <TableHead className="w-[130px] text-right">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">{t('common.loading', 'Loading...')}</TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-red-500">
                      {t('abandoned.error_loading', 'Error loading checkouts.')}
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      {t('abandoned.no_data', 'No checkouts found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <div className="font-medium">{lead.fullName || '-'}</div>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        ) : null}
                        {lead.email ? <div className="text-xs text-muted-foreground">{lead.email}</div> : null}
                        {lead.address || lead.district ? (
                          <div className="text-xs text-muted-foreground">
                            {[lead.address, lead.thana, lead.district].filter(Boolean).join(', ')}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {(lead.items || []).map((i, idx) => (
                          <div key={idx} className="text-sm">
                            {i.quantity} × {i.name || i.slug}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>{formatMoney(lead.cartTotal)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {lead.lastActivityAt
                          ? new Date(lead.lastActivityAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.status === 'converted' ? (
                          <Badge variant="secondary">
                            {t('abandoned.converted', 'Converted')}
                            {lead.convertedOrderNumber ? ` · ${lead.convertedOrderNumber}` : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t('abandoned.open', 'Abandoned')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lead.phone && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="border-none"
                                title="WhatsApp"
                                onClick={() => {
                                  const phone = lead.phone.replace(/\D/g, '').replace(/^0/, '88').replace(/^(?!880)/, '880');
                                  const items = (lead.items || []).map(i => `${i.quantity}x ${i.name || i.slug}`).join(', ');
                                  const msg = `আসসালামু আলাইকুম ${lead.fullName || ''},\nআপনি আমাদের সাইটে অর্ডার করতে গিয়েছিলেন (${items}, মোট: ৳${lead.cartTotal || 0})। অর্ডারটি সম্পূর্ণ করতে চাইলে আমাদের জানান।`;
                                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="border-none"
                                title="Copy number"
                                onClick={() => {
                                  navigator.clipboard.writeText(lead.phone);
                                  toast.success('Phone number copied');
                                }}
                              >
                                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border-none"
                            onClick={() => handleDelete(lead._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
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
