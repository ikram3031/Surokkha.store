import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { EVENT_LABELS, formatDateTime, formatMoney } from '@/pages/analytics/shared';

const Stat = ({ label, value }) => (
  <div className="rounded-md border px-3 py-2">
    <div className="text-[11px] text-muted-foreground">{label}</div>
    <div className="truncate text-sm font-semibold">{value || '-'}</div>
  </div>
);

// Small linked list of orders (visitor's own or related by IP/phone)
export const OrderRows = ({ orders = [], showMatch = false }) => (
  <div className="divide-y rounded-md border">
    {orders.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">No orders.</p>}
    {orders.map((o) => (
      <Link key={o.id} to={`/dashboard/orders/${o.id}/tracking`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/50">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">#{o.orderNumber}</span>
            <Badge variant="outline" className="h-4 px-1 text-[10px]">{o.status}</Badge>
            {showMatch && o.matchedBy?.map((m) => <Badge key={m} className="h-4 px-1 text-[10px]">{m === 'ip' ? 'Same IP' : 'Same phone'}</Badge>)}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {[o.name, o.phone, o.ipAddress, o.browser, o.os].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="shrink-0 text-right text-[11px] text-muted-foreground">
          <div className="font-semibold text-foreground">{formatMoney(o.total)}</div>
          {formatDateTime(o.createdAt)}
        </div>
      </Link>
    ))}
  </div>
);

// Stats, orders and the action timeline for one browser visitor id
export const VisitorJourney = ({ visitor }) => {
  if (!visitor) return null;
  const returning = visitor.activeDays > 1;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{visitor.visitorId}</code>
        <Badge variant={returning ? 'default' : 'outline'}>{returning ? `Returning · ${visitor.activeDays} days` : 'New visitor'}</Badge>
        {visitor.orders?.length > 0 && <Badge className="bg-green-600 text-white">{visitor.orders.length} order(s)</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="First seen" value={formatDateTime(visitor.firstSeen)} />
        <Stat label="Last seen" value={formatDateTime(visitor.lastSeen)} />
        <Stat label="First source" value={visitor.firstSource} />
        <Stat label="Views / Cart / Checkout" value={`${visitor.views} / ${visitor.carts} / ${visitor.checkouts}`} />
        <Stat label="IPs used" value={visitor.ips?.join(', ')} />
        <Stat label="Devices" value={visitor.devices?.join(', ')} />
        <Stat label="Sources" value={visitor.sources?.map((s) => `${s.source} (${s.count})`).join(', ')} />
        <Stat label="Sites" value={visitor.sites?.join(', ')} />
      </div>
      <div>
        <h4 className="mb-1.5 text-sm font-semibold">Orders by this visitor</h4>
        <OrderRows orders={visitor.orders} />
      </div>
      <div>
        <h4 className="mb-1.5 text-sm font-semibold">Activity ({visitor.totalEvents})</h4>
        <div className="max-h-[420px] divide-y overflow-y-auto rounded-md border">
          {visitor.events?.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">No tracked activity.</p>}
          {visitor.events?.map((e) => (
            <div key={e._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate">
                  <span className="font-medium">{EVENT_LABELS[e.eventType] || e.eventType}</span> · {e.productName || e.productKey}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {[e.site, e.source, e.device, e.os, e.browser, e.ipAddress].filter(Boolean).join(' · ')}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(e.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
