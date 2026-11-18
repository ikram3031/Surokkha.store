import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle2, RefreshCw, Save, Activity, Inbox, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Unified Mail Settings: single SMTP server (all outgoing system emails) and single IMAP mailbox (Webmail)
const EmailServerSettingsPage = () => {
  const queryClient = useQueryClient();

  // SMTP State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState('untested');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  // IMAP State
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [imapUser, setImapUser] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [imapEnabled, setImapEnabled] = useState(false);

  const { data: smtpData, isLoading: smtpLoading } = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/smtp');
      return res.data?.data || {};
    },
  });

  const { data: imapData, isLoading: imapLoading } = useQuery({
    queryKey: ['imap-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/imap');
      return res.data?.data || {};
    },
  });

  const hasStoredSmtpPassword = Boolean(smtpData?.hasPassword || smtpData?.password);
  const hasStoredImapPassword = Boolean(imapData?.hasPassword || imapData?.password);

  useEffect(() => {
    if (smtpData) {
      setSmtpHost(smtpData.host || '');
      setSmtpPort(smtpData.port || 465);
      setSmtpSecure(smtpData.secure !== false);
      setSmtpUser(smtpData.user || '');
      setSmtpPassword('');
      setSenderName(smtpData.senderName || '');
      setSenderEmail(smtpData.senderEmail || '');
      setSmtpEnabled(smtpData.isEnabled === true);
    }
  }, [smtpData]);

  useEffect(() => {
    if (imapData) {
      setImapHost(imapData.host || '');
      setImapPort(imapData.port || 993);
      setImapSecure(imapData.secure !== false);
      setImapUser(imapData.user || '');
      setImapPassword('');
      setImapEnabled(imapData.isEnabled === true);
    }
  }, [imapData]);

  const saveSmtpMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: smtpSecure,
        user: smtpUser.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        isEnabled: smtpEnabled,
      };
      if (smtpPassword.trim()) {
        payload.password = smtpPassword.trim();
      }
      const res = await apiClient.put('/api/v1/settings/smtp', payload);
      return res.data;
    },
    onSuccess: () => {
      setSmtpPassword('');
      toast.success('SMTP settings saved. Changes take effect immediately.');
      queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings');
    },
  });

  const saveImapMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        host: imapHost.trim(),
        port: Number(imapPort),
        secure: imapSecure,
        user: imapUser.trim(),
        isEnabled: imapEnabled,
      };
      if (imapPassword.trim()) {
        payload.password = imapPassword.trim();
      }
      const res = await apiClient.put('/api/v1/settings/imap', payload);
      return res.data;
    },
    onSuccess: () => {
      setImapPassword('');
      toast.success('IMAP settings saved. Changes take effect immediately.');
      queryClient.invalidateQueries({ queryKey: ['imap-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save IMAP settings');
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: async ({ sendLiveEmail = false } = {}) => {
      const payload = {
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: smtpSecure,
        user: smtpUser.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        recipientEmail: sendLiveEmail ? (testEmailRecipient.trim() || smtpUser.trim()) : undefined,
      };
      if (smtpPassword.trim()) {
        payload.password = smtpPassword.trim();
      }
      const res = await apiClient.post('/api/v1/settings/smtp/test', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSmtpTestStatus('connected');
      toast.success(data.message || 'SMTP connection verified!');
    },
    onError: (err) => {
      setSmtpTestStatus('failed');
      toast.error(err.response?.data?.message || 'Failed to verify SMTP connection');
    },
  });

  const handleSaveSmtp = (e) => {
    e.preventDefault();
    saveSmtpMutation.mutate();
  };

  const handleSaveImap = (e) => {
    e.preventDefault();
    saveImapMutation.mutate();
  };

  const canTestSmtp = Boolean(smtpHost.trim() && smtpUser.trim() && (smtpPassword.trim() || hasStoredSmtpPassword));

  const handleTestSmtpConnection = () => {
    if (!canTestSmtp) {
      toast.error('Host, Username, and Password are required to test the connection');
      return;
    }
    testSmtpMutation.mutate({ sendLiveEmail: false });
  };

  const handleSendLiveTestEmail = () => {
    if (!canTestSmtp) {
      toast.error('Host, Username, and Password are required to send a test email');
      return;
    }
    const targetEmail = testEmailRecipient.trim() || smtpUser.trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      toast.error('Please enter a valid recipient email address');
      return;
    }
    testSmtpMutation.mutate({ sendLiveEmail: true });
  };

  const isSmtpConnected = smtpTestStatus === 'connected';

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Mail className="h-7 w-7 text-indigo-600" />
            Mail Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the outgoing SMTP server for all system emails (store, shop, and dashboard) and the incoming IMAP mailbox for Webmail. Changes take effect immediately without a restart or deploy.
          </p>
        </div>
      </div>

      {/* Card 1: Outgoing SMTP */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              SMTP (Outgoing Mail)
            </CardTitle>
            <CardDescription className="text-xs">
              Used for all outgoing system emails across store, shop, dashboard notifications, order confirmations, and Webmail replies. Saving applies immediately without restarting.
            </CardDescription>
          </div>
          {isSmtpConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected & Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1 shrink-0">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              {smtpTestStatus === 'failed' ? 'Connection Failed' : 'Untested'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSmtp} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">SMTP Host</label>
                <Input
                  placeholder="e.g. smtp.hostinger.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  disabled={smtpLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Port</label>
                  <Input
                    type="number"
                    placeholder="465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    disabled={smtpLoading}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch id="secure-toggle" checked={smtpSecure} onCheckedChange={setSmtpSecure} disabled={smtpLoading} />
                    <label htmlFor="secure-toggle" className="text-xs font-semibold cursor-pointer">Use SSL/TLS</label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enabled for port 465 (SSL), disabled for 587 (STARTTLS)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">SMTP Username (Email)</label>
                  <Input
                    placeholder="e.g. support@surokkha.store"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    disabled={smtpLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">SMTP Password</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={hasStoredSmtpPassword ? 'Leave blank to keep current password' : 'Enter SMTP password'}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    disabled={smtpLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {hasStoredSmtpPassword
                      ? 'Password is saved and encrypted. Leave blank to keep the current password.'
                      : 'Password is symmetrically encrypted before saving to database.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sender Name</label>
                  <Input
                    placeholder="e.g. Surokkha"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    disabled={smtpLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sender Email (From)</label>
                  <Input
                    placeholder="e.g. support@surokkha.store"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    disabled={smtpLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Enable Database SMTP</p>
                  <p className="text-[11px] text-muted-foreground">If disabled, outgoing mail falls back to server environment variables.</p>
                </div>
                <Switch checked={smtpEnabled} onCheckedChange={setSmtpEnabled} disabled={smtpLoading} />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              <label className="text-xs font-semibold text-foreground">Test Recipient Email Address</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendLiveTestEmail}
                  disabled={testSmtpMutation.isPending || !canTestSmtp}
                  className="flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Send className={`h-4 w-4 ${testSmtpMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Send Live Test Email</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dispatches a live test email through your SMTP settings to verify delivery to an external inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSmtpConnection}
                disabled={testSmtpMutation.isPending || !canTestSmtp}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testSmtpMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Test SMTP Connection</span>
              </Button>

              <Button
                type="submit"
                disabled={saveSmtpMutation.isPending || smtpLoading}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save SMTP Settings</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 2: Incoming IMAP (Webmail) */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Inbox className="h-4 w-4 text-indigo-600" />
            IMAP (Webmail Mailbox)
          </CardTitle>
          <CardDescription className="text-xs">
            Incoming mail server synchronized into the unified Webmail inbox. Saving applies immediately without a restart or deploy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveImap} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">IMAP Host</label>
              <Input
                placeholder="e.g. imap.hostinger.com"
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                disabled={imapLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Port</label>
                <Input
                  type="number"
                  placeholder="993"
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  disabled={imapLoading}
                />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch id="imap-secure-toggle" checked={imapSecure} onCheckedChange={setImapSecure} disabled={imapLoading} />
                  <label htmlFor="imap-secure-toggle" className="text-xs font-semibold cursor-pointer">Use SSL</label>
                </div>
                <p className="text-[10px] text-muted-foreground">Enabled for port 993 (IMAPS)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">IMAP Username</label>
                <Input
                  placeholder="e.g. support@surokkha.store"
                  value={imapUser}
                  onChange={(e) => setImapUser(e.target.value)}
                  disabled={imapLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">IMAP Password</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={hasStoredImapPassword ? 'Leave blank to keep current password' : 'Enter IMAP password'}
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  disabled={imapLoading}
                />
                <p className="text-[10px] text-muted-foreground">
                  {hasStoredImapPassword
                    ? 'Password is saved and encrypted. Leave blank to keep the current password.'
                    : 'Password is symmetrically encrypted before saving to database.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Enable Database IMAP</p>
                <p className="text-[11px] text-muted-foreground">If disabled, Webmail sync falls back to server environment variables.</p>
              </div>
              <Switch checked={imapEnabled} onCheckedChange={setImapEnabled} disabled={imapLoading} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saveImapMutation.isPending || imapLoading}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save IMAP Settings</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailServerSettingsPage;
