import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Fingerprint, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitorJourney, OrderRows } from '@/components/dashboard/analytics/VisitorJourney';
import { formatDateTime, formatMoney } from '@/pages/analytics/shared';

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-0">
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="break-all text-right font-medium">{value || '-'}</span>
  </div>
);

// Device, IP and visitor journey behind one order
const OrderTracking = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: async () => (await apiClient.get(`/api/v1/orders/${id}/tracking`)).data?.data,
  });

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="size-6 animate-spin" /></div>;
  if (error || !data) return <p className="p-6 text-sm text-destructive">Could not load tracking.</p>;

  const { order, visitor, related } = data;
  const tr = order.tracking || {};
  const name = [order.billingInfo?.firstName, order.billingInfo?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/orders" className="rounded-md p-1.5 hover:bg-muted"><ArrowLeft className="size-5" /></Link>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Fingerprint className="size-6" /> Tracking · #{order.orderNumber}
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Order</CardTitle></CardHeader>
          <CardContent>
            <Row label="Customer" value={`${name} · ${order.billingInfo?.phone || ''}`} />
            <Row label="Total" value={formatMoney(order.totals?.total)} />
            <Row label="Status" value={order.status} />
            <Row label="Placed" value={formatDateTime(order.createdAt)} />
            <Row label="Site" value={`${order.siteKey} · ${order.clientDomain}`} />
            <Row label="Order type" value={order.orderType} />
            <Row label="Coupon" value={order.couponCode} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Device & network</CardTitle></CardHeader>
          <CardContent>
            <Row label="IP address" value={order.ipAddress || tr.ipAddress} />
            <Row label="Device" value={tr.device} />
            <Row label="Phone model" value={tr.deviceModel} />
            <Row label="OS" value={tr.os} />
            <Row label="Browser / app" value={tr.browser} />
            <Row label="Language" value={tr.language} />
            <Row label="Visitor ID" value={tr.visitorId} />
            <Row label="Facebook click (fbc)" value={tr.fbc} />
            <Row label="Facebook browser (fbp)" value={tr.fbp} />
            <Row label="FB login ID" value={order.fb_login_id} />
            <Row label="User agent" value={<span className="text-[11px] font-normal">{tr.userAgent}</span>} />
            {!order.tracking && <p className="pt-2 text-xs text-muted-foreground">This order was placed before device tracking started; only the IP is known.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Other orders from same IP or phone ({related.length})</CardTitle></CardHeader>
        <CardContent><OrderRows orders={related} showMatch /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Visitor journey</CardTitle></CardHeader>
        <CardContent>
          {visitor ? <VisitorJourney visitor={visitor} /> : <p className="text-sm text-muted-foreground">No visitor ID on this order.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;
