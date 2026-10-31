import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Phone, Search, MessageCircle, Copy, Eye, FilePlus, UserCheck, Mail, MapPin,
  Package, Clock, Link as LinkIcon, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Abandoned' },
  { key: 'converted', label: 'Converted' },
];

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const splitLeadSlug = (slug = '') => {
  const [base, variant] = String(slug).split(':::');
  return { base, variant: variant || '' };
};

const openWhatsApp = (lead) => {
  const phone = lead.phone.replace(/\D/g, '').replace(/^0/, '88').replace(/^(?!880)/, '880');
  const items = (lead.items || []).map((i) => `${i.quantity}x ${i.name || i.slug}`).join(', ');
  const msg = `আসসালামু আলাইকুম ${lead.fullName || ''},\nআপনি আমাদের সাইটে অর্ডার করতে গিয়েছিলেন (${items}, মোট: ৳${lead.cartTotal || 0})। অর্ডারটি সম্পূর্ণ করতে চাইলে আমাদের জানান।`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

const InfoRow = ({ icon: Icon, children }) =>
  children ? (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  ) : null;

// Order-page style view of one saved checkout, with the matching customer-list profile when there is one
const LeadDetailDialog = ({ lead, onClose, onCreateOrder }) => {
  const { t } = useTranslation();
  if (!lead) return null;

  const customer = lead.customer;
  const items = lead.items || [];
  const subtotal = items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const adjustment = (Number(lead.cartTotal) || 0) - subtotal;
  const address = [lead.address, lead.thana, lead.district].filter(Boolean).join(', ');

  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <DialogTitle className="text-lg">
              {t('abandoned.checkout', 'Checkout')} · {lead.fullName || lead.phone || '-'}
            </DialogTitle>
            {lead.status === 'converted' ? (
              <Badge variant="secondary">
                {t('abandoned.converted', 'Converted')}
                {lead.convertedOrderNumber ? ` · ${lead.convertedOrderNumber}` : ''}
              </Badge>
            ) : (
              <Badge variant="outline">{t('abandoned.open', 'Abandoned')}</Badge>
            )}
            {customer && (
              <Badge className="gap-1">
                <UserCheck className="h-3 w-3" />
                {t('abandoned.existing_customer', 'Existing customer')}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {t('abandoned.last_activity', 'Last activity')}: {formatDateTime(lead.lastActivityAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t('abandoned.customer_details', 'Customer details')}</h4>
            <div className="font-medium">{lead.fullName || '-'}</div>
            <InfoRow icon={Phone}>
              {lead.phone ? <span className="font-mono">{lead.phone}</span> : null}
            </InfoRow>
            <InfoRow icon={Mail}>{lead.email}</InfoRow>
            <InfoRow icon={MapPin}>{address}</InfoRow>
          </div>

          {customer ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {t('abandoned.customer_profile', 'Customer profile')}
                </h4>
                <Link
                  to={`/dashboard/customers/${customer.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {t('abandoned.open_customer', 'Open customer page')}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div>
                <div className="font-medium">{customer.fullName}</div>
                <div className="text-xs font-mono text-muted-foreground">{customer.phone}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-background border p-2">
                  <div className="text-lg font-bold">{customer.totalOrders}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.orders', 'Orders')}</div>
                </div>
                <div className="rounded-lg bg-background border p-2">
                  <div className="text-lg font-bold">{formatMoney(customer.totalSpent)}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.spent', 'Spent')}</div>
                </div>
                <div className="rounded-lg bg-background border p-2">
                  <div className="text-xs font-semibold leading-6">
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
                      : '-'}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.last_order', 'Last order')}</div>
                </div>
              </div>
              {customer.recentOrders?.length ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t('abandoned.recent_orders', 'Recent orders')}</div>
                  {customer.recentOrders.map((o, idx) => (
                    <div key={`${o.orderNumber}-${idx}`} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{o.orderNumber || '-'}</span>
                      <span className="text-muted-foreground">
                        {o.date ? new Date(o.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                      </span>
                      <span className="font-medium">{formatMoney(o.total)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {customer.notes ? <p className="text-xs text-muted-foreground">{customer.notes}</p> : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground flex items-center justify-center text-center">
              {t('abandoned.new_customer', 'Not in the customer list yet — a new customer will be created when the order is placed.')}
            </div>
          )}
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/40 text-sm font-semibold flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            {t('abandoned.items', 'Items')}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('abandoned.product', 'Product')}</TableHead>
                <TableHead className="text-right">{t('abandoned.unit_price', 'Unit price')}</TableHead>
                <TableHead className="text-right">{t('abandoned.qty', 'Qty')}</TableHead>
                <TableHead className="text-right">{t('abandoned.line_total', 'Total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-16">
                    {t('abandoned.no_items', 'No items saved.')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((i, idx) => {
                  const { base, variant } = splitLeadSlug(i.slug);
                  return (
                    <TableRow key={`${i.slug}-${idx}`}>
                      <TableCell>
                        <div className="font-medium">{i.name || base}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-mono">{base}</span>
                          {variant ? <Badge variant="outline" className="text-[10px] px-1 py-0">{variant}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(i.unitPrice)}</TableCell>
                      <TableCell className="text-right">{i.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney((Number(i.unitPrice) || 0) * (Number(i.quantity) || 0))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="border-t p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('abandoned.subtotal', 'Subtotal')}</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {adjustment !== 0 && subtotal > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('abandoned.delivery_discount', 'Delivery / discounts')}</span>
                <span>{adjustment > 0 ? '+' : '-'}{formatMoney(Math.abs(adjustment))}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>{t('abandoned.total', 'Total')}</span>
              <span>{formatMoney(lead.cartTotal)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {t('abandoned.started', 'Started')}: {formatDateTime(lead.createdAt)}
          </div>
          {lead.sourceUrl ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={lead.sourceUrl}>{lead.sourceUrl}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {lead.phone ? (
            <>
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(lead)} className="gap-1.5">
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = `tel:${lead.phone}`)} className="gap-1.5">
                <Phone className="h-4 w-4" />
                {t('abandoned.call', 'Call')}
              </Button>
            </>
          ) : null}
          <Button size="sm" onClick={() => onCreateOrder(lead)} className="gap-1.5">
            <FilePlus className="h-4 w-4" />
            {t('abandoned.create_order', 'Create order')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AbandonedCheckouts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState(null);

  const createOrderFromLead = (lead) => navigate(`/dashboard/orders/custom/new?lead=${lead._id}`);
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
                  <TableHead className="w-[200px] text-right">{t('common.actions', 'Actions')}</TableHead>
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
                    <TableRow key={lead._id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{lead.fullName || '-'}</span>
                          {lead.customer ? (
                            <Link
                              to={`/dashboard/customers/${lead.customer.id}`}
                              onClick={(e) => e.stopPropagation()}
                              title={t('abandoned.open_customer', 'Open customer page')}
                            >
                              <Badge className="gap-1 text-[10px] px-1.5 py-0">
                                <UserCheck className="h-3 w-3" />
                                {t('abandoned.existing_customer', 'Existing customer')} · {lead.customer.totalOrders}
                              </Badge>
                            </Link>
                          ) : null}
                        </div>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground">
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border-none"
                            title={t('abandoned.view', 'View details')}
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border-none"
                            title={t('abandoned.create_order', 'Create order')}
                            onClick={() => createOrderFromLead(lead)}
                          >
                            <FilePlus className="h-4 w-4 text-primary" />
                          </Button>
                          {lead.phone && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="border-none"
                                title="WhatsApp"
                                onClick={() => openWhatsApp(lead)}
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

      <LeadDetailDialog lead={selectedLead} onClose={() => setSelectedLead(null)} onCreateOrder={createOrderFromLead} />
    </div>
  );
}
