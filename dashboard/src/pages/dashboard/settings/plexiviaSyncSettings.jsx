import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Wand2, Save, Copy, Eye, EyeOff, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dateHelper';

// 32 random bytes as 64 hex characters
const generateKey = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Settings → Integrations → Plexivia Sync: the shared key Plexivia uses to read the daily summaries
export default function PlexiviaSyncSettingsPage() {
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['plexivia-sync-settings'],
    queryFn: async () => (await apiClient.get('/api/v1/settings/plexivia-sync')).data?.data,
  });

  const save = useMutation({
    mutationFn: async (body) => (await apiClient.put('/api/v1/settings/plexivia-sync', body)).data,
    onSuccess: (res) => {
      queryClient.setQueryData(['plexivia-sync-settings'], res.data);
      setKey('');
      toast.success(res.message || 'Saved');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not save'),
  });

  const isEnabled = data?.isEnabled ?? false;

  const copyKey = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    toast.success('Key copied — paste the same key in Plexivia');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Link2 className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Plexivia Sync</h1>
          <p className="text-xs text-muted-foreground">Lets the Plexivia dashboard read the daily payment and bill summaries.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Connection</CardTitle>
            <CardDescription className="text-xs">
              Set the same key here and in Plexivia → Settings → Integrations. Only a hash of the key is stored.
            </CardDescription>
          </div>
          {data?.hasKey && isEnabled ? (
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30" variant="outline">
              <CheckCircle2 className="size-3" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <AlertCircle className="size-3" /> {data?.hasKey ? 'Off' : 'No key'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Allow Plexivia to sync</p>
              <p className="text-xs text-muted-foreground">Off closes the sync endpoints even with a valid key.</p>
            </div>
            <Switch
              checked={isEnabled}
              disabled={isLoading || save.isPending}
              onCheckedChange={(checked) => save.mutate({ isEnabled: checked })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Sync key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value.trim())}
                  placeholder={data?.hasKey ? `Saved key ${data.keyHint} — enter a new one to replace it` : 'Generate or paste a key (min 32 characters)'}
                  className="pr-20 font-mono text-xs"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
                  <button type="button" onClick={() => setShowKey((v) => !v)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted cursor-pointer" aria-label="Show or hide key">
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button type="button" onClick={() => setKey(generateKey())} className="rounded-md p-1.5 text-primary hover:bg-primary/10 cursor-pointer" title="Generate a random key" aria-label="Generate a random key">
                    <Wand2 className="size-4" />
                  </button>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={copyKey} disabled={!key} className="gap-1.5">
                <Copy className="size-4" /> Copy
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The key is shown only now. After saving, copy it into Plexivia — it cannot be read back from here.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save.mutate({ isEnabled: true, key })}
              disabled={key.length < 32 || save.isPending}
              className="gap-1.5"
            >
              <Save className="size-4" /> {data?.hasKey ? 'Replace key' : 'Save key'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last connection from Plexivia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {data?.lastSeenAt ? formatDateTime(data.lastSeenAt) : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IP address</p>
            <p className="font-mono font-semibold">{data?.lastSeenIp || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Key changed</p>
            <p className="font-semibold">{data?.keyUpdatedAt ? formatDateTime(data.keyUpdatedAt) : '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
