import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Save, Plug, Unplug, CheckCircle2, XCircle, Radio } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const API = '/api/v1/support/config';
const KEY_RE = /^\d{6,24}\.[a-f0-9]{24,128}$/i;

// Business Settings card: connects this store to the Plexivia Support Desk with the key Plexivia issued
const PlexiviaSupportCard = () => {
  const queryClient = useQueryClient();
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  const [key, setKey] = useState('');
  const [lastTest, setLastTest] = useState(null);

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['plexivia-support-config'],
    queryFn: async () => (await apiClient.get(API)).data?.data,
    refetchInterval: 30000,
  });

  const urlValue = apiBaseUrl ?? cfg?.apiBaseUrl ?? '';

  const save = useMutation({
    mutationFn: async (body) => (await apiClient.put(API, body)).data,
    onSuccess: (res) => {
      setKey('');
      setLastTest(res.data?.test || null);
      if (res.data?.test && !res.data.test.ok) toast.error(res.data.test.message);
      else toast.success(res.message || 'Saved');
      queryClient.invalidateQueries({ queryKey: ['plexivia-support-config'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save the Support Desk settings'),
  });

  const test = useMutation({
    mutationFn: async () => (await apiClient.post(`${API}/test`)).data?.data,
    onSuccess: (res) => {
      setLastTest(res);
      queryClient.invalidateQueries({ queryKey: ['plexivia-support-config'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Test failed'),
  });

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed && !KEY_RE.test(trimmed)) {
      toast.error('That does not look like a Plexivia support key (1234567890123456.abcdef…)');
      return;
    }
    if (!trimmed && !cfg?.configured) {
      toast.error('Paste the support key Plexivia gave you');
      return;
    }
    save.mutate({ apiBaseUrl: urlValue, ...(trimmed ? { key: trimmed } : {}) });
  };

  const live = cfg?.live;
  const connected = Boolean(cfg?.configured);

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-primary" />
          Plexivia Support Desk
        </CardTitle>
        <CardDescription className="text-xs">
          Connects the Support Desk page to Plexivia: tickets you open go to the Plexivia engineers, and their replies
          arrive here live with a notification. Paste the support key Plexivia issued for this store. The key is stored
          encrypted and is never shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isLoading ? (
            <span className="text-muted-foreground">Loading…</span>
          ) : connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Plug className="h-3.5 w-3.5" /> Key saved <span className="font-mono">{cfg.keyHint}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                  live?.connected
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
                title={live?.lastError || ''}
              >
                <Radio className="h-3.5 w-3.5" /> {live?.connected ? 'Live updates on' : 'Live link reconnecting'}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
              <Unplug className="h-3.5 w-3.5" /> Not connected
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Plexivia API URL</label>
            <Input
              value={urlValue}
              placeholder="https://api.plexivia.com"
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Support key {connected && <span className="font-normal text-muted-foreground">(leave empty to keep the saved key)</span>}
            </label>
            <Input
              type="password"
              autoComplete="off"
              value={key}
              placeholder={connected ? `Saved ${cfg.keyHint}` : '1234567890123456.abcdef…'}
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {lastTest && (
          <p className={`flex items-center gap-1.5 text-xs ${lastTest.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {lastTest.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {lastTest.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {connected && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => save.mutate({ remove: true })}
                disabled={save.isPending}
                className="cursor-pointer"
              >
                Disconnect
              </Button>
              <Button type="button" variant="outline" onClick={() => test.mutate()} disabled={test.isPending} className="cursor-pointer">
                {test.isPending ? 'Testing…' : 'Test connection'}
              </Button>
            </>
          )}
          <Button type="button" onClick={handleSave} disabled={save.isPending} className="cursor-pointer flex items-center gap-2 font-semibold">
            <Save className="h-4 w-4" />
            {save.isPending ? 'Saving…' : connected ? 'Save' : 'Connect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlexiviaSupportCard;
