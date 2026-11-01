import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import {
  ShoppingCart, Trash2, Phone, Search, Copy, Eye, FilePlus, UserCheck, Mail, MapPin, Package, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { WhatsAppIcon, handleCopyText } from '@/utils/orderDetailsHelper';
import { LIGHT_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from './orderList/constants';

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const splitLeadSlug = (slug = '') => {
  const [base, variant] = String(slug).split(':::');
  return { base, variant: variant || '' };
};

const whatsAppUrl = (lead) => {
  const phone = lead.phone.replace(/\D/g, '').replace(/^0/, '88').replace(/^(?!880)/, '880');
  const items = (lead.items || []).map((i) => `${i.quantity}x ${i.name || i.slug}`).join(', ');
  const msg = `আসসালামু আলাইকুম ${lead.fullName || ''},\nআপনি আমাদের সাইটে অর্ডার করতে গিয়েছিলেন (${items}, মোট: ৳${lead.cartTotal || 0})। অর্ডারটি সম্পূর্ণ করতে চাইলে আমাদের জানান।`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

const actionTile = 'h-auto min-w-0 flex-col gap-1 whitespace-normal px-1 py-2 text-[11px] leading-tight';
const contactBtn = 'inline-flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors';

const Section = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    {children}
  </section>
);

const Line = ({ label, value, className }) => (
  <div className={cn('flex justify-between gap-3', className)}>
    <span className="text-muted-foreground">{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

// Right-side drawer with one abandoned checkout, laid out like the order quick view
const LeadDrawer = ({ lead, onClose, onCreateOrder }) => {
  const { t } = useTranslation();
  const lastLeadRef = React.useRef(null);
  if (lead) lastLeadRef.current = lead;
  const shown = lead ?? lastLeadRef.current;

  const customer = shown?.customer;
  const items = shown?.items || [];
  const subtotal = items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const adjustment = (Number(shown?.cartTotal) || 0) - subtotal;
  const address = shown ? [shown.address, shown.thana, shown.district].filter(Boolean).join(', ') : '';

  return (
    <Sheet open={Boolean(lead)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {shown && (
          <>
            <SheetHeader className="gap-4 border-b p-5">
              <SheetTitle className="pr-8 text-lg font-semibold">{shown.fullName || shown.phone || '-'}</SheetTitle>
              <div className="grid grid-cols-3 gap-2">
                {shown.phone ? (
                  <Button
                    variant="outline"
                    onClick={() => window.open(whatsAppUrl(shown), '_blank')}
                    className={cn(actionTile, LIGHT_BUTTON_CLASS)}
                  >
                    <WhatsAppIcon className="size-3.5" /> WhatsApp
                  </Button>
                ) : null}
                {shown.phone ? (
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = `tel:${shown.phone}`)}
                    className={cn(actionTile, LIGHT_BUTTON_CLASS)}
                  >
                    <Phone className="size-3.5" /> {t('abandoned.call', 'Call')}
                  </Button>
                ) : null}
                <Button onClick={() => onCreateOrder(shown)} className={cn(actionTile, PRIMARY_BUTTON_CLASS)}>
                  <FilePlus className="size-3.5" /> {t('abandoned.create_order', 'Create order')}
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <Section title={t('abandoned.name', 'Name')}>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-medium text-foreground">{shown.fullName || '-'}</p>
                  <div className="mt-3 space-y-2.5">
                    {shown.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="size-4 shrink-0 text-muted-foreground" />
                        <a href={`tel:${shown.phone}`} className="font-medium text-primary hover:underline">{shown.phone}</a>
                        <span className="ml-auto flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyText(shown.phone, 'Phone number')}
                            className={cn(contactBtn, 'border-border bg-muted text-muted-foreground hover:text-foreground')}
                            title="Copy phone number"
                          >
                            <Copy className="size-3" />
                          </button>
                          <a
                            href={whatsAppUrl(shown)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(contactBtn, 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400')}
                            title="Message on WhatsApp"
                          >
                            <WhatsAppIcon className="size-3" />
                          </a>
                        </span>
                      </div>
                    )}
                    {shown.email && (
                      <a href={`mailto:${shown.email}`} className="flex items-center gap-2.5 hover:underline">
                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{shown.email}</span>
                      </a>
                    )}
                    {address && (
                      <p className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span>{address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Section>

              {customer && (
                <Section title={t('abandoned.existing_customer', 'Existing customer')}>
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserCheck className="size-4 text-primary" />
                        {customer.fullName}
                      </span>
                      <Link
                        to={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        {t('abandoned.open_customer', 'Open customer page')}
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md border bg-background p-2">
                        <div className="text-lg font-bold">{customer.totalOrders}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.orders', 'Orders')}</div>
                      </div>
                      <div className="rounded-md border bg-background p-2">
                        <div className="text-base font-bold">{formatMoney(customer.totalSpent)}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.spent', 'Spent')}</div>
                      </div>
                      <div className="rounded-md border bg-background p-2">
                        <div className="text-xs font-semibold leading-7">
                          {customer.lastOrderAt
                            ? new Date(customer.lastOrderAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
                            : '-'}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground">{t('abandoned.last_order', 'Last order')}</div>
                      </div>
                    </div>
                    {customer.recentOrders?.length ? (
                      <div className="space-y-1">
                        {customer.recentOrders.map((o, idx) => (
                          <div key={`${o.orderNumber}-${idx}`} className="flex items-center justify-between text-xs">
                            <span className="font-mono">#{o.orderNumber || '-'}</span>
                            <span className="text-muted-foreground">
                              {o.date ? new Date(o.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                            </span>
                            <span className="font-medium tabular-nums">{formatMoney(o.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Section>
              )}

              <Section title={`${t('abandoned.items', 'Items')} (${items.reduce((n, i) => n + (Number(i.quantity) || 1), 0)})`}>
                <div className="divide-y rounded-lg border">
                  {items.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">{t('abandoned.no_items', 'No items saved.')}</p>
                  ) : (
                    items.map((i, idx) => {
                      const { base, variant } = splitLeadSlug(i.slug);
                      const price = Number(i.unitPrice) || 0;
                      const qty = Number(i.quantity) || 1;
                      return (
                        <div key={`${i.slug}-${idx}`} className="flex items-center gap-3 p-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Package className="size-4 text-muted-foreground" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" title={i.name || base}>{i.name || base}</p>
                            <p className="text-xs text-muted-foreground">
                              {variant ? `${variant} · ` : ''}
                              {qty} × {formatMoney(price)}
                            </p>
                          </div>
                          <p className="text-sm font-medium tabular-nums">{formatMoney(price * qty)}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </Section>

              <Section title={t('abandoned.total', 'Total')}>
                <div className="space-y-2 rounded-lg border p-4 text-sm">
                  <Line label={t('abandoned.subtotal', 'Subtotal')} value={formatMoney(subtotal)} />
                  {adjustment !== 0 && subtotal > 0 ? (
                    <Line
                      label={t('abandoned.delivery_discount', 'Delivery / discounts')}
                      value={`${adjustment > 0 ? '+' : '−'} ${formatMoney(Math.abs(adjustment))}`}
                    />
                  ) : null}
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold">
                    <span>{t('abandoned.total', 'Total')}</span>
                    <span className="tabular-nums">{formatMoney(shown.cartTotal)}</span>
                  </div>
                </div>
              </Section>

              <Section title={t('abandoned.activity', 'Activity')}>
                <div className="space-y-2 rounded-lg border p-4 text-sm">
                  <Line label={t('abandoned.last_activity', 'Last activity')} value={formatDateTime(shown.lastActivityAt)} />
                  <Line label={t('abandoned.started', 'Started')} value={formatDateTime(shown.createdAt)} />
                  {shown.sourceUrl ? (
                    <p className="truncate text-xs text-muted-foreground" title={shown.sourceUrl}>{shown.sourceUrl}</p>
                  ) : null}
                </div>
              </Section>
            </div>

            <div className="border-t p-4">
              <Button onClick={() => onCreateOrder(shown)} className={cn('h-9 w-full gap-2 text-sm', PRIMARY_BUTTON_CLASS)}>
                <FilePlus className="size-4" />
                {t('abandoned.create_order', 'Create order')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default function AbandonedCheckouts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const limit = 20;

  const createOrderFromLead = (lead) => navigate(`/dashboard/orders/custom/new?lead=${lead._id}`);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['checkout-leads', page, q],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), status: 'open' });
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
          {t('abandoned.description', 'People who started checkout but did not place an order. Call them to complete it.')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      <Card>
        <CardHeader>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('abandoned.name', 'Name')}</TableHead>
                  <TableHead>{t('abandoned.phone', 'Phone')}</TableHead>
                  <TableHead className="text-center">{t('abandoned.details', 'Details')}</TableHead>
                  <TableHead>{t('abandoned.total', 'Total')}</TableHead>
                  <TableHead>{t('abandoned.activity', 'Activity')}</TableHead>
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
                      {t('abandoned.no_data', 'No abandoned checkouts.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((lead) => (
                    <TableRow key={lead._id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell className="font-medium">{lead.fullName || '-'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="font-mono text-sm text-muted-foreground hover:text-foreground">
                            {lead.phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          title={t('abandoned.view', 'View details')}
                          aria-label={t('abandoned.view', 'View details')}
                        >
                          <Eye className="size-4" />
                        </button>
                      </TableCell>
                      <TableCell>{formatMoney(lead.cartTotal)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(lead.lastActivityAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="border-none"
                              title="WhatsApp"
                              onClick={() => window.open(whatsAppUrl(lead), '_blank')}
                            >
                              <WhatsAppIcon className="h-4 w-4 text-green-500" />
                            </Button>
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

      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onCreateOrder={createOrderFromLead} />
    </div>
  );
}
