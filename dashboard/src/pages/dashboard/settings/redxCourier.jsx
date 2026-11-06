import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Save, Activity, RefreshCw, Copy, Webhook, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dateHelper';

const KEY = ['redx-courier-settings'];

// RedX OpenAPI credentials, pickup store, dispatch defaults and webhook URL
export default function RedxCourierSettingsPage() {
  const queryClient = useQueryClient();
  const [environment, setEnvironment] = useState('production');
  const [accessToken, setAccessToken] = useState('');
  const [pickupStoreId, setPickupStoreId] = useState('');
  const [defaultParcelWeight, setDefaultParcelWeight] = useState(500);
  const [isClosedBox, setIsClosedBox] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get('/api/v1/courier/redx/config')).data?.data || {},
  });

  useEffect(() => {
    if (!data) return;
    setEnvironment(data.environment || 'production');
    setAccessToken(data.accessToken || '');
    setPickupStoreId(data.pickupStoreId ? String(data.pickupStoreId) : '');
    setDefaultParcelWeight(data.defaultParcelWeight || 500);
    setIsClosedBox(Boolean(data.isClosedBox));
  }, [data]);

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      const res = await apiClient.get('/api/v1/courier/redx/pickup-stores');
      setStores(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load RedX pickup stores');
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    if (data?.hasAccessToken) loadStores();
  }, [data?.hasAccessToken]);

  const save = useMutation({
    mutationFn: async () =>
      (
        await apiClient.put('/api/v1/courier/redx/config', {
          environment,
          accessToken,
          pickupStoreId: pickupStoreId ? Number(pickupStoreId) : null,
          defaultParcelWeight: Number(defaultParcelWeight) || 500,
          isClosedBox,
        })
      ).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'RedX settings saved');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save RedX settings'),
  });

  const test = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/courier/redx/test', { accessToken, environment })).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'Connected to RedX');
      setStores(res?.data?.pickupStores || []);
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'RedX connection failed');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
  });

  const sync = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/courier/redx/orders/sync')).data?.data,
    onSuccess: (res) => {
      toast.success(res?.summary || res?.reason || 'RedX sync done');
      queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'RedX sync failed'),
  });

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Callback URL copied');
  };

  const statusBadge =
    data?.lastTestStatus === 'connected' ? (
      <Badge className="gap-1"><CheckCircle2 className="size-3" /> Connected</Badge>
    ) : data?.lastTestStatus === 'failed' ? (
      <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" /> Failed</Badge>
    ) : (
      <Badge variant="secondary">Untested</Badge>
    );

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Truck className="size-5" /> RedX Courier</span>
            {statusBadge}
          </CardTitle>
          <CardDescription>
            Get the API token from the RedX merchant panel → Developer API (
            <a href="https://redx.com.bd/developer-api/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
              redx.com.bd/developer-api <ExternalLink className="size-3" />
            </a>
            ). Turn RedX on for new dispatches from Settings → Couriers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Environment
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              API token
              <Input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={data?.hasAccessToken ? 'Saved — paste a new token to replace' : 'Paste RedX API token'}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="space-y-1 text-sm font-medium">
            <div className="flex items-center justify-between">
              Pickup store
              <Button type="button" variant="ghost" size="sm" onClick={loadStores} disabled={loadingStores} className="h-7 gap-1 text-xs">
                <RefreshCw className={`size-3 ${loadingStores ? 'animate-spin' : ''}`} /> Reload
              </Button>
            </div>
            <Select value={pickupStoreId} onValueChange={setPickupStoreId}>
              <SelectTrigger>
                <SelectValue placeholder={stores.length ? 'Select pickup store' : 'Save a token first, then reload'} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} — {s.area_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs font-normal text-muted-foreground">
              The pickup store's area is used to estimate delivery charges. Current: {data?.pickupStoreName || 'none'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Default parcel weight (grams)
              <Input type="number" min="1" value={defaultParcelWeight} onChange={(e) => setDefaultParcelWeight(e.target.value)} />
            </label>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>Closed box by default</span>
              <Switch checked={isClosedBox} onCheckedChange={setIsClosedBox} />
            </div>
          </div>

          {data?.lastTestMessage && (
            <p className="text-xs text-muted-foreground">
              Last test {data.lastTestedAt ? formatDateTime(data.lastTestedAt) : ''}: {data.lastTestMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => test.mutate()} disabled={test.isPending} className="gap-1.5">
              <Activity className="size-4" /> {test.isPending ? 'Testing…' : 'Test connection'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
              <Save className="size-4" /> {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Webhook className="size-5" /> Webhook & sync</CardTitle>
          <CardDescription>
            Paste this callback URL into RedX Developer API → Webhook so parcel status changes arrive instantly.
            Parcels are also polled every 30 minutes, even when RedX is disabled for new dispatches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={data?.webhookUrl || 'Save settings once to generate the URL'} className="font-mono text-xs" />
            <Button type="button" variant="outline" disabled={!data?.webhookUrl} onClick={() => copy(data.webhookUrl)} aria-label="Copy callback URL">
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <span>Last webhook: {data?.lastWebhookAt ? formatDateTime(data.lastWebhookAt) : 'never'}</span>
            <span>
              Last sync: {data?.lastOrderSyncAt ? formatDateTime(data.lastOrderSyncAt) : 'never'}
              {data?.lastOrderSyncSummary ? ` — ${data.lastOrderSyncSummary}` : ''}
            </span>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending} className="gap-1.5">
              <RefreshCw className={`size-4 ${sync.isPending ? 'animate-spin' : ''}`} /> Sync RedX parcels now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
