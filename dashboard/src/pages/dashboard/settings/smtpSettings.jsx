import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Save, Activity, Inbox } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Manages SMTP and IMAP configurations for Webmail and system notifications
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

  useEffect(() => {
    if (smtpData) {
      setSmtpHost(smtpData.host || '');
      setSmtpPort(smtpData.port || 465);
      setSmtpSecure(smtpData.secure !== false);
      setSmtpUser(smtpData.user || '');
      setSmtpPassword(smtpData.password || '');
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
      setImapPassword(imapData.password || '');
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
        password: smtpPassword.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        isEnabled: smtpEnabled,
      };
      const res = await apiClient.put('/api/v1/settings/smtp', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('SMTP settings updated successfully');
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
        password: imapPassword.trim(),
        isEnabled: imapEnabled,
      };
      const res = await apiClient.put('/api/v1/settings/imap', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('IMAP settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['imap-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save IMAP settings');
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: smtpSecure,
        user: smtpUser.trim(),
        password: smtpPassword.trim(),
      };
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

  const handleTestSmtpConnection = () => {
    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPassword.trim()) {
      toast.error('Host, User, and Password are required to test connection');
      return;
    }
    testSmtpMutation.mutate();
  };

  const isSmtpConnected = smtpTestStatus === 'connected';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Mail className="h-7 w-7 text-indigo-600" />
            SMTP Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system notification emails and Webmail Inbox Synchronization.
          </p>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP (Outgoing)
          </TabsTrigger>
          <TabsTrigger value="imap" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            IMAP (Incoming Webmail)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <form onSubmit={handleSaveSmtp} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              {isSmtpConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  SMTP Connected & Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1">
                  <Activity className="h-3.5 w-3.5 text-amber-500" />
                  {smtpTestStatus === 'failed' ? 'Connection Failed' : 'Untested'}
                </Badge>
              )}
            </div>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">SMTP Credentials</CardTitle>
                <CardDescription className="text-xs">
                  Outgoing mail server used for notifications and sending Webmail replies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">SMTP Host</label>
                  <Input
                    placeholder="e.g. smtp.hostinger.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    disabled={smtpLoading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-1.5 flex flex-col justify-end pb-2 border border-transparent">
                     <div className="flex items-center gap-2">
                       <Switch id="secure-toggle" checked={smtpSecure} onCheckedChange={setSmtpSecure} disabled={smtpLoading} />
                       <label htmlFor="secure-toggle" className="text-xs font-semibold cursor-pointer">Use SSL/TLS</label>
                     </div>
                     <p className="text-[10px] text-muted-foreground">True for 465, false for 587 (STARTTLS)</p>
                  </div>
                </div>

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
                    placeholder="••••••••"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    disabled={smtpLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">Password is symmetrically encrypted before saving to database.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Sender Details & Options</CardTitle>
                <CardDescription className="text-xs">
                  Customize how system emails appear to your customers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sender Name</label>
                  <Input
                    placeholder="e.g. Surokkha Store"
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

                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Enable Database SMTP</p>
                    <p className="text-[11px] text-muted-foreground">If disabled, the server will fallback to using environment variable configurations.</p>
                  </div>
                  <Switch checked={smtpEnabled} onCheckedChange={setSmtpEnabled} />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSmtpConnection}
                disabled={testSmtpMutation.isPending || !smtpHost || !smtpUser || !smtpPassword}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testSmtpMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Test SMTP Connection</span>
              </Button>

              <Button
                type="submit"
                disabled={saveSmtpMutation.isPending}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save SMTP Settings</span>
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="imap">
          <form onSubmit={handleSaveImap} className="space-y-6">
            <Card className="border-border/60 shadow-xs mt-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">IMAP Credentials</CardTitle>
                <CardDescription className="text-xs">
                  Incoming mail server used for Webmail inbox synchronization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">IMAP Host</label>
                  <Input
                    placeholder="e.g. imap.hostinger.com"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    disabled={imapLoading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-1.5 flex flex-col justify-end pb-2 border border-transparent">
                     <div className="flex items-center gap-2">
                       <Switch id="imap-secure-toggle" checked={imapSecure} onCheckedChange={setImapSecure} disabled={imapLoading} />
                       <label htmlFor="imap-secure-toggle" className="text-xs font-semibold cursor-pointer">Use SSL</label>
                     </div>
                  </div>
                </div>

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
                    placeholder="••••••••"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    disabled={imapLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">Password is symmetrically encrypted before saving to database.</p>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Enable Database IMAP</p>
                    <p className="text-[11px] text-muted-foreground">If disabled, Webmail sync will fallback to environment variables.</p>
                  </div>
                  <Switch checked={imapEnabled} onCheckedChange={setImapEnabled} />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saveImapMutation.isPending}
                className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Save className="h-4 w-4" />
                <span>Save IMAP Settings</span>
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailServerSettingsPage;
