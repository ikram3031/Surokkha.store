import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, CheckCircle2, AlertCircle, Activity, Save, PlugZap, DatabaseBackup, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dateHelper';

const SCHEDULE_PRESETS = [
  { label: 'Daily 3:00 AM', cron: '0 3 * * *' },
  { label: 'Twice a day', cron: '0 3,15 * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Weekly (Fri 3 AM)', cron: '0 3 * * 5' },
];

const EMPTY_FORM = {
  isEnabled: false,
  accountId: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  publicUrl: '',
  backupEnabled: true,
  backupCron: '0 3 * * *',
  backupTimezone: 'Asia/Dhaka',
  retentionDays: 30,
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-foreground">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const BACKUP_BADGES = {
  success: { cls: 'bg-[#052E16] text-[#4ADE80] border-[#166534]', icon: CheckCircle2, text: 'Last backup succeeded' },
  failed: { cls: 'bg-[#450A0A] text-[#F87171] border-[#991B1B]', icon: AlertCircle, text: 'Last backup failed' },
  running: { cls: 'bg-[#082F49] text-[#38BDF8] border-[#0369A1]', icon: Loader2, text: 'Backup running…' },
  never: { cls: 'bg-[#292524] text-[#A8A29E] border-[#57534E]', icon: Activity, text: 'No backup yet' },
};

// Cloudflare R2 storage credentials and the automated backup schedule
const R2StorageSettingsPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const { data, isLoading } = useQuery({
    queryKey: ['r2-storage-settings'],
    queryFn: async () => (await apiClient.get('/api/v1/settings/r2-storage')).data?.data || {},
    refetchInterval: (query) => (query.state.data?.lastBackupStatus === 'running' ? 5000 : false),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      isEnabled: data.isEnabled ?? false,
      accountId: data.accountId || '',
      accessKeyId: data.accessKeyId || '',
      secretAccessKey: '',
      bucketName: data.bucketName || '',
      publicUrl: data.publicUrl || '',
      backupEnabled: data.backupEnabled ?? true,
      backupCron: data.backupCron || '0 3 * * *',
      backupTimezone: data.backupTimezone || 'Asia/Dhaka',
      retentionDays: data.retentionDays ?? 30,
    });
  }, [data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['r2-storage-settings'] });
  const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

  const saveMutation = useMutation({
    mutationFn: async () => (await apiClient.put('/api/v1/settings/r2-storage', form)).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'R2 storage settings saved.');
      refresh();
    },
    onError: (err) => toast.error(errMsg(err, 'Failed to save R2 settings.')),
  });

  const testMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/settings/r2-storage/test', form)).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'Connected.');
      refresh();
    },
    onError: (err) => {
      toast.error(errMsg(err, 'Connection failed.'));
      refresh();
    },
  });

  const backupMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/api/v1/settings/r2-storage/backup-now')).data,
    onSuccess: (res) => {
      toast.success(res?.message || 'Backup started.');
      setTimeout(refresh, 1000);
    },
    onError: (err) => toast.error(errMsg(err, 'Could not start backup.')),
  });

  const isConnected = data?.lastTestStatus === 'connected';
  const backupBadge = BACKUP_BADGES[data?.lastBackupStatus] || BACKUP_BADGES.never;
  const BackupIcon = backupBadge.icon;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <HardDrive className="h-7 w-7 text-orange-400" />
          R2 Storage
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cloudflare R2 bucket for automatic database and uploads backups.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isConnected ? (
          <Badge className="bg-[#052E16] text-[#4ADE80] border border-[#166534] flex items-center gap-1.5 px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Bucket connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1">
            <Activity className="h-3.5 w-3.5 text-amber-500" />
            {data?.lastTestStatus === 'failed' ? 'Connection failed' : 'Untested'}
          </Badge>
        )}
        <Badge className={`border flex items-center gap-1.5 px-3 py-1 ${backupBadge.cls}`}>
          <BackupIcon className={`h-3.5 w-3.5 ${data?.lastBackupStatus === 'running' ? 'animate-spin' : ''}`} />
          {backupBadge.text}
        </Badge>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">R2 Credentials</CardTitle>
            <CardDescription className="text-xs">
              Create an R2 API token in Cloudflare scoped to this bucket only (Object Read &amp; Write).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch id="r2-enabled" checked={form.isEnabled} onCheckedChange={set('isEnabled')} disabled={isLoading} />
              <label htmlFor="r2-enabled" className="text-xs font-semibold cursor-pointer">Use these R2 settings</label>
            </div>
            <Field label="Account ID">
              <Input value={form.accountId} onChange={(e) => set('accountId')(e.target.value)} placeholder="Cloudflare account ID" disabled={isLoading} />
            </Field>
            <Field label="Access Key ID">
              <Input value={form.accessKeyId} onChange={(e) => set('accessKeyId')(e.target.value)} placeholder="R2 access key ID" disabled={isLoading} autoComplete="off" />
            </Field>
            <Field
              label="Secret Access Key"
              hint={data?.hasSecretAccessKey ? `Saved (${data.secretAccessKeyMasked}). Leave empty to keep it.` : 'Not saved yet.'}
            >
              <Input
                type="password"
                value={form.secretAccessKey}
                onChange={(e) => set('secretAccessKey')(e.target.value)}
                placeholder={data?.hasSecretAccessKey ? '•••••••• (unchanged)' : 'R2 secret access key'}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Bucket Name">
              <Input value={form.bucketName} onChange={(e) => set('bucketName')(e.target.value)} placeholder="e.g. surokkha" disabled={isLoading} />
            </Field>
            <Field label="Public URL (optional)">
              <Input value={form.publicUrl} onChange={(e) => set('publicUrl')(e.target.value)} placeholder="https://pub-xxxx.r2.dev" disabled={isLoading} />
            </Field>
            {data?.lastTestMessage && (
              <p className={`text-xs ${isConnected ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                {data.lastTestMessage}
                {data.lastTestedAt ? ` · ${formatDateTime(data.lastTestedAt)}` : ''}
              </p>
            )}
            <Button type="button" variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending || isLoading}>
              <PlugZap className="mr-2 h-4 w-4" />
              {testMutation.isPending ? 'Testing…' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Automatic Backup</CardTitle>
            <CardDescription className="text-xs">Database and uploads are backed up on this schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch id="r2-backup" checked={form.backupEnabled} onCheckedChange={set('backupEnabled')} disabled={isLoading} />
              <label htmlFor="r2-backup" className="text-xs font-semibold cursor-pointer">Enable scheduled backups</label>
            </div>
            <Field label="Schedule (cron)" hint="minute hour day month weekday, in the timezone below">
              <Input value={form.backupCron} onChange={(e) => set('backupCron')(e.target.value)} className="font-mono" disabled={isLoading} />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SCHEDULE_PRESETS.map((p) => (
                  <button
                    key={p.cron}
                    type="button"
                    onClick={() => set('backupCron')(p.cron)}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                      form.backupCron === p.cron ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Timezone">
                <Input value={form.backupTimezone} onChange={(e) => set('backupTimezone')(e.target.value)} disabled={isLoading} />
              </Field>
              <Field label="Keep backups (days)">
                <Input type="number" min={1} max={365} value={form.retentionDays} onChange={(e) => set('retentionDays')(e.target.value)} disabled={isLoading} />
              </Field>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Next run:{' '}
                <span className="font-medium text-foreground">{data?.nextBackupAt ? formatDateTime(data.nextBackupAt) : 'Not scheduled'}</span>
              </div>
              <div className="text-muted-foreground">
                Last backup:{' '}
                <span className="font-medium text-foreground">{data?.lastBackupAt ? formatDateTime(data.lastBackupAt) : 'Never'}</span>
                {data?.lastBackupSize ? ` · ${data.lastBackupSize}` : ''}
              </div>
              {data?.lastBackupMessage && (
                <div className={data?.lastBackupStatus === 'failed' ? 'text-[#F87171]' : 'text-muted-foreground'}>{data.lastBackupMessage}</div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending || data?.lastBackupStatus === 'running' || !data?.hasSecretAccessKey}
            >
              <DatabaseBackup className="mr-2 h-4 w-4" />
              {data?.lastBackupStatus === 'running' ? 'Backup running…' : 'Backup Now'}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-end">
          <Button type="submit" size="lg" className="h-9 px-5" disabled={saveMutation.isPending || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default R2StorageSettingsPage;
