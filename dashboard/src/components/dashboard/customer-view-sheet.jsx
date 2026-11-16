import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dateHelper';

const formatMoney = (v) => `৳${Number(v || 0).toLocaleString('en-US')}`;

const Stat = ({ label, value }) => (
  <div className="rounded-md border bg-background p-3 text-center">
    <div className="text-base font-bold tabular-nums">{value}</div>
    <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
  </div>
);

// Right-side drawer with one customer's details (order-based Customers list)
export function CustomerViewSheet({ customer, onClose }) {
  const id = customer?.id;
  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await apiClient.get(`/api/v1/customers/${id}`)).data?.data,
    enabled: Boolean(id),
  });

  const c = { ...customer, ...(data || {}) };
  const name = c.fullName || c.name || '-';
  const address = [c.address, c.thana, c.district].filter(Boolean).join(', ');
  const searchKey = c.phone || c.email || '';

  return (
    <Sheet open={Boolean(customer)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {customer && (
          <>
            <SheetHeader className="border-b p-5">
              <SheetTitle className="pr-8 text-lg font-semibold">{name}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Orders" value={customer.totalOrders ?? 0} />
                <Stat label="Spent" value={formatMoney(customer.lifetimeSpent)} />
                <Stat label="Joined" value={customer.joinedDate ? formatDate(customer.joinedDate) : '-'} />
              </div>
              <div className="space-y-2.5 rounded-lg border p-4">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 hover:underline">
                    <Phone className="size-4 text-muted-foreground" /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 hover:underline">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="truncate">{c.email}</span>
                  </a>
                )}
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : address ? (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {address}
                  </p>
                ) : null}
              </div>
              {Array.isArray(c.parsedHistory) && c.parsedHistory.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">History</h3>
                  <div className="divide-y rounded-lg border">
                    {c.parsedHistory.slice(-10).reverse().map((h, i) => (
                      <div key={i} className="flex justify-between gap-3 p-3 text-xs">
                        <span className="truncate">{h.action || h.event || h.type || h.raw || 'Update'}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {h.date || h.at || h.createdAt ? formatDate(h.date || h.at || h.createdAt) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {searchKey && (
              <div className="border-t p-4">
                <Link
                  to={`/dashboard/orders?q=${encodeURIComponent(searchKey)}`}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <ShoppingBag className="size-4" /> View orders
                </Link>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
