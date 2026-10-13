import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Shield,
  Activity,
  HelpCircle,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Renders the standard TikTok musical note brand icon
const TikTokBrandIcon = ({ className = "h-7 w-7" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.96-4.49V8.75a8.16 8.16 0 0 0 4.81 1.54V6.85a4.87 4.87 0 0 1-1-.16z" />
  </svg>
);

// Formats UTC date string to localized readable timestamp
const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
};

// Manages TikTok Pixel and Events API server-side tracking configuration and verification
const TikTokPixelPage = () => {
  const queryClient = useQueryClient();

  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [enableBrowserPixel, setEnableBrowserPixel] = useState(true);
  const [enableEventsApi, setEnableEventsApi] = useState(true);
  const [advancedMatching, setAdvancedMatching] = useState(true);
  const [showAccessToken, setShowAccessToken] = useState(false);

  const { data: pixelData, isLoading } = useQuery({
    queryKey: ['tiktok-pixel-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/tiktok-pixel');
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
      setEnableEventsApi(pixelData.enableEventsApi !== false);
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
        enableEventsApi,
        advancedMatching,
      };
      const res = await apiClient.put('/api/v1/settings/tiktok-pixel', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('TikTok Pixel settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixel-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save TikTok Pixel settings');
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim(),
        testEventCode: testEventCode.trim(),
      };
      const res = await apiClient.post('/api/v1/settings/tiktok-pixel/test', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'TikTok Events API connection verified successfully!');
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixel-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify TikTok connection');
      queryClient.invalidateQueries({ queryKey: ['tiktok-pixel-settings'] });
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleTestConnection = () => {
    if (!pixelId.trim() || !accessToken.trim()) {
      toast.error('Pixel ID and Events API Access Token are required to test connection');
      return;
    }
    testMutation.mutate();
  };

  const isConnected = pixelData?.lastTestStatus === 'connected';
  const isFailed = pixelData?.lastTestStatus === 'failed';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-black text-white dark:bg-zinc-800 dark:text-zinc-100 flex items-center justify-center">
              <TikTokBrandIcon className="h-6 w-6" />
            </span>
            TikTok Pixel & Events API
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer journeys, power TikTok ad targeting, and dispatch resilient server-side CompletePayment events.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected & Verified
            </Badge>
          ) : isFailed ? (
            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 px-3 py-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Connection Failed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              Untested
            </Badge>
          )}
        </div>
      </div>

      {/* Last Verified Status Alert Banner if available */}
      {pixelData?.lastVerifiedAt && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Last verified with TikTok Events API on <strong>{formatTimestamp(pixelData.lastVerifiedAt)}</strong></span>
          </div>
          {pixelData?.lastTestMessage && (
            <span className="font-mono text-[11px] opacity-80">{pixelData.lastTestMessage}</span>
          )}
        </div>
      )}

      {isFailed && pixelData?.lastTestMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Verification error: {pixelData.lastTestMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Pixel Credentials */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Pixel Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your TikTok Pixel ID and Events API access token from TikTok Ads Manager &gt; Events Manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>TikTok Pixel ID / Code</span>
                <span className="text-[11px] text-muted-foreground font-normal">Required</span>
              </label>
              <Input
                placeholder="e.g. C6XXXXXXXXXXXXXXXXXX"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Found in TikTok Ads Manager &gt; Assets &gt; Event &gt; Web Events &gt; Pixel Code / ID.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Events API Access Token</span>
                <span className="text-[11px] text-muted-foreground font-normal">Required for server-side events</span>
              </label>
              <div className="relative">
                <Input
                  type={showAccessToken ? 'text' : 'password'}
                  placeholder="Enter TikTok Long-Lived Access Token..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessToken((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title={showAccessToken ? 'Hide Access Token' : 'Show Access Token'}
                >
                  {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Generated under TikTok Events Manager &gt; Settings &gt; Events API &gt; Generate Access Token.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Test Event Code (Optional)</span>
                <span className="text-[11px] text-muted-foreground font-normal">For debugging only</span>
              </label>
              <Input
                placeholder="e.g. TEST12345"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Copy from TikTok Events Manager &gt; Test Events tab to preview real-time server payloads without affecting production reporting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tracking Options */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Tracking Options &amp; Pipelines
            </CardTitle>
            <CardDescription className="text-xs">
              Configure browser-side script and server-side tracking pipelines for maximum ad attribution accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Master Tracking Toggle</p>
                <p className="text-[11px] text-muted-foreground">Enable or disable all TikTok tracking globally across this store.</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Browser-Side Pixel (ttq.js)</p>
                <p className="text-[11px] text-muted-foreground">Inject standard TikTok Pixel JavaScript snippet on the customer storefront.</p>
              </div>
              <Switch checked={enableBrowserPixel} onCheckedChange={setEnableBrowserPixel} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">TikTok Events API (Server-Side Tracking)</p>
                <p className="text-[11px] text-muted-foreground">
                  Dispatch server-side CompletePayment events directly to TikTok to bypass browser ad-blockers and iOS privacy restrictions.
                </p>
              </div>
              <Switch checked={enableEventsApi} onCheckedChange={setEnableEventsApi} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Advanced Customer Matching</p>
                <p className="text-[11px] text-muted-foreground">
                  Securely hash customer phone numbers and emails using SHA-256 to increase event match rate on TikTok.
                </p>
              </div>
              <Switch checked={advancedMatching} onCheckedChange={setAdvancedMatching} />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Quick Setup Guide & Technical Overview */}
        <Card className="border-border/60 shadow-xs bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              TikTok Pixel &amp; Events API Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border/60 bg-background/60 space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                  Where to find your Pixel ID
                </p>
                <p className="text-[11px] leading-relaxed">
                  Log in to <strong>TikTok Ads Manager</strong> &gt; Click <strong>Assets</strong> &gt; <strong>Event</strong> &gt; Web Events. Click on your Pixel name or copy the alphanumeric Pixel Code.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-background/60 space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                  Generating Events API Token
                </p>
                <p className="text-[11px] leading-relaxed">
                  Inside your Pixel in Events Manager, open the <strong>Settings</strong> tab. Scroll down to <strong>Events API</strong> and click <strong>Generate Access Token</strong>. Paste it into the field above.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-background/60 space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                  Event Deduplication
                </p>
                <p className="text-[11px] leading-relaxed">
                  Every order includes an identical <code className="text-primary font-mono text-[10px]">purchase_&#123;orderNumber&#125;</code> event ID on both browser and server payloads, ensuring TikTok deduplicates multiple triggers.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-background/60 space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                  Testing &amp; Verification
                </p>
                <p className="text-[11px] leading-relaxed">
                  Enter your Pixel ID and Access Token, optionally add a <strong>Test Event Code</strong>, and click <strong>Test Events API Connection</strong> to send an immediate verification payload to TikTok.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testMutation.isPending || !pixelId || !accessToken}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Test Events API Connection</span>
          </Button>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>Save TikTok Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TikTokPixelPage;
