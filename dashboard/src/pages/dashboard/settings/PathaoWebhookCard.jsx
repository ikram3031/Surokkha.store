import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Webhook, Copy, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDateTime } from '@/utils/dateHelper';

const ACTION_BTN =
  'cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90';

const copy = async (value, label) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Copy failed, select and copy manually');
  }
};

// Pathao webhook setup: URL + secret to paste into Pathao, the integration header value from Pathao, and mode
export default function PathaoWebhookCard() {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('log');
  const [integrationSecret, setIntegrationSecret] = useState('');

  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canManage = role === 'owner' || role === 'admin';

  const { data } = useQuery({
    queryKey: ['pathao-webhook-config'],
    queryFn: async () => (await apiClient.get('/api/v1/courier/pathao/webhook/config')).data?.data,
    enabled: canManage,
  });

  useEffect(() => {
    if (!data) return;
    setEnabled(data.webhookEnabled);
    setMode(data.webhookMode);
    setIntegrationSecret(data.webhookIntegrationSecret);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (extra = {}) =>
      (
        await apiClient.put('/api/v1/courier/pathao/webhook/config', {
          webhookEnabled: enabled,
          webhookMode: mode,
          webhookIntegrationSecret: integrationSecret,
          ...extra,
        })
      ).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'Webhook settings saved');
      queryClient.setQueryData(['pathao-webhook-config'], res?.data);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save webhook settings')),
  });

  if (!canManage) return null;

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" /> Webhook
        </CardTitle>
        <CardDescription>
          Pathao pushes every parcel event here instantly. In Pathao's merchant panel go to Developer's API → Webhook Integration, paste the
          Callback URL and Secret below, select all events and click Add Webhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Callback URL</Label>
          <div className="flex gap-2">
            <Input readOnly value={data?.webhookUrl || ''} className="font-mono text-xs" />
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => copy(data?.webhookUrl || '', 'Callback URL')} aria-label="Copy callback URL">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Secret (goes into Pathao)</Label>
          <div className="flex gap-2">
            <Input readOnly value={data?.webhookSecret || 'Save once to generate'} className="font-mono text-xs" />
            <Button type="button" variant="outline" className="cursor-pointer" disabled={!data?.webhookSecret} onClick={() => copy(data.webhookSecret, 'Secret')} aria-label="Copy secret">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={saveMutation.isPending}
              onClick={() => {
                if (window.confirm('Generate a new secret? You must update it in Pathao too, or events will be rejected.')) {
                  saveMutation.mutate({ regenerateSecret: true });
                }
              }}
              aria-label="Generate new secret"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pathao-integration-secret">Integration header value (from Pathao)</Label>
          <Input
            id="pathao-integration-secret"
            value={integrationSecret}
            onChange={(e) => setIntegrationSecret(e.target.value)}
            placeholder="Value shown for X-Pathao-Merchant-Webhook-Integration-Secret"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">Pathao shows this value on the Webhook Integration page. It must be saved here before you click Add Webhook.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Accept events</p>
              <p className="text-xs text-muted-foreground">Off = Pathao requests are ignored</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="log">Log only (store events, don't touch orders)</SelectItem>
                <SelectItem value="process">Process (update orders and settlement)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Last event received: {data?.lastWebhookAt ? formatDateTime(data.lastWebhookAt) : 'never'}
          </p>
          <Button type="button" className={ACTION_BTN} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-4 w-4 mr-1.5" />
            Save webhook settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
