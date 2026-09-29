import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, CheckCircle2, AlertCircle, RefreshCw, Save, Shield, Activity, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Manages Meta Pixel and Conversions API configuration and verification
const MetaPixelPage = () => {
  const queryClient = useQueryClient();

  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [enableBrowserPixel, setEnableBrowserPixel] = useState(true);
  const [enableCapi, setEnableCapi] = useState(true);
  const [advancedMatching, setAdvancedMatching] = useState(true);

  const { data: pixelData, isLoading } = useQuery({
    queryKey: ['meta-pixel-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/meta-pixel');
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (pixelData) {
      setPixelId(pixelData.pixelId || '');
      setAccessToken(pixelData.accessToken || '');
      setTestEventCode(pixelData.testEventCode || '');
      setIsEnabled(pixelData.isEnabled !== false);
      setEnableBrowserPixel(pixelData.enableBrowserPixel !== false);
      setEnableCapi(pixelData.enableCapi !== false);
      setAdvancedMatching(pixelData.advancedMatching !== false);
    }
  }, [pixelData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim(),
        testEventCode: testEventCode.trim(),
        isEnabled,
        enableBrowserPixel,
        enableCapi,
        advancedMatching,
      };
      const res = await apiClient.put('/api/v1/settings/meta-pixel', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Meta Pixel settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['meta-pixel-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Meta Pixel settings');
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim(),
        testEventCode: testEventCode.trim(),
      };
      const res = await apiClient.post('/api/v1/settings/meta-pixel/test', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Meta Conversions API connection verified!');
      queryClient.invalidateQueries({ queryKey: ['meta-pixel-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify Meta connection');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleTestConnection = () => {
    if (!pixelId.trim() || !accessToken.trim()) {
      toast.error('Pixel ID and Access Token are required to test connection');
      return;
    }
    testMutation.mutate();
  };

  const isConnected = pixelData?.lastTestStatus === 'connected';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Share2 className="h-7 w-7 text-blue-600" />
            Meta Pixel & Conversions API (CAPI)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track storefront interactions, automate ad targeting, and send resilient server-side conversions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected & Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              {pixelData?.lastTestStatus === 'failed' ? 'Connection Failed' : 'Untested'}
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Pixel Credentials</CardTitle>
            <CardDescription className="text-xs">
              Enter your Meta Pixel ID and Conversions API System User access token from Meta Events Manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Pixel ID</label>
              <Input
                placeholder="e.g. 881944871465552"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Your 15-16 digit Meta Dataset or Pixel identifier.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Conversions API Access Token</label>
              <Input
                type="password"
                placeholder="EAAB..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Generated under Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate access token.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Test Event Code (Optional)</label>
              <Input
                placeholder="e.g. TEST12345"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Found under the Test Events tab in Events Manager to verify live test payloads.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Tracking Options</CardTitle>
            <CardDescription className="text-xs">
              Configure browser-side script and server-side tracking pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Master Tracking Toggle</p>
                <p className="text-[11px] text-muted-foreground">Enable or disable all Meta tracking for this store.</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Browser-Side Pixel</p>
                <p className="text-[11px] text-muted-foreground">Inject standard fbq script tag in customer storefront.</p>
              </div>
              <Switch checked={enableBrowserPixel} onCheckedChange={setEnableBrowserPixel} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Conversions API (CAPI)</p>
                <p className="text-[11px] text-muted-foreground">Send server-side Purchase and checkout events for iOS 14+ ad resiliency.</p>
              </div>
              <Switch checked={enableCapi} onCheckedChange={setEnableCapi} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Advanced Customer Matching</p>
                <p className="text-[11px] text-muted-foreground">Hash customer phone, email, and location data to improve event match quality.</p>
              </div>
              <Switch checked={advancedMatching} onCheckedChange={setAdvancedMatching} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testMutation.isPending || !pixelId || !accessToken}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Test CAPI Connection</span>
          </Button>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>Save Meta Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MetaPixelPage;
