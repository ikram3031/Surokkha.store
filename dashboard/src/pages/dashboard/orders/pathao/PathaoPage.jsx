import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Truck, RefreshCw, PackageCheck, PackageX, AlertTriangle, Package, Wallet, Receipt, BadgeCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDateTime } from '@/utils/dateHelper';
import ParcelsTab from './ParcelsTab';
import WebhookEventsTab from './WebhookEventsTab';
import { ACTION_BTN, money } from './pathaoUtils';

const StatCard = ({ icon: Icon, iconClass, label, value, hint }) => (
  <Card className="border border-border/80 shadow-sm">
    <CardContent className="p-4 flex items-start gap-3">
      <div className={`rounded-lg p-2 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tracking-tight truncate">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

// Dedicated Pathao page under Orders: parcel tracking, courier settlement and webhook activity
export default function PathaoPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = String(user?.role || '').toLowerCase();
  const canManageWebhook = role === 'owner' || role === 'admin';

  const [range, setRange] = useState({ from: '', to: '' });

  const { data: summary } = useQuery({
    queryKey: ['pathao-summary', range],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/courier/pathao/parcels/summary', { params: range });
      return res.data?.data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ['pathao-config-sync'],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/config')).data?.data,
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/courier/pathao/orders/sync')).data?.data,
    onSuccess: (data) => {
      toast.success(data?.summary || data?.reason || 'Pathao sync finished');
      queryClient.invalidateQueries({ queryKey: ['pathao-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-config-sync'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Pathao sync failed')),
  });

  const settlement = summary?.settlement;

  return (
    <div className="page-container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8 text-red-500" />
            {t('nav.pathao', 'Pathao')}
          </h2>
          <p className="text-muted-foreground text-sm">
            Parcel status, courier charges and payouts from Pathao.
            {config?.lastOrderSyncAt && <> Last sync: {formatDateTime(config.lastOrderSyncAt)}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="w-auto" aria-label="From" />
          <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="w-auto" aria-label="To" />
          <Button type="button" className={ACTION_BTN} onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Package} iconClass="bg-muted text-foreground" label="Total parcels" value={summary?.total ?? '—'} />
        <StatCard icon={Truck} iconClass="bg-blue-500/10 text-blue-600" label="In transit" value={summary?.inTransit ?? '—'} />
        <StatCard icon={PackageCheck} iconClass="bg-emerald-500/10 text-emerald-600" label="Delivered" value={summary?.delivered ?? '—'} />
        <StatCard icon={PackageX} iconClass="bg-red-500/10 text-red-600" label="Returned" value={summary?.returned ?? '—'} />
        <StatCard icon={AlertTriangle} iconClass="bg-amber-500/10 text-amber-600" label="Needs attention" value={summary?.attention ?? '—'} />
      </div>

      {summary?.canSeeMoney && settlement && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Wallet}
            iconClass="bg-amber-500/10 text-amber-600"
            label="Pathao owes (not invoiced)"
            value={money(settlement.pending.netPayout)}
            hint={`${settlement.pending.count} parcel(s), estimated`}
          />
          <StatCard
            icon={Receipt}
            iconClass="bg-blue-500/10 text-blue-600"
            label="Invoiced, awaiting payout"
            value={money(settlement.invoiced.netPayout)}
            hint={`${settlement.invoiced.count} parcel(s)`}
          />
          <StatCard
            icon={BadgeCheck}
            iconClass="bg-emerald-500/10 text-emerald-600"
            label="Settled (paid out)"
            value={money(settlement.settled.netPayout)}
            hint={`${settlement.settled.count} parcel(s)`}
          />
          <StatCard
            icon={Undo2}
            iconClass="bg-red-500/10 text-red-600"
            label="Courier charges"
            value={money(summary.totalCharges)}
            hint={`Return charges ${money(summary.returnCharges)}`}
          />
        </div>
      )}

      <Tabs defaultValue="parcels" className="space-y-3">
        <TabsList>
          <TabsTrigger value="parcels">Parcels</TabsTrigger>
          {canManageWebhook && <TabsTrigger value="webhook">Webhook activity</TabsTrigger>}
        </TabsList>
        <TabsContent value="parcels">
          <ParcelsTab range={range} />
        </TabsContent>
        {canManageWebhook && (
          <TabsContent value="webhook">
            <WebhookEventsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
