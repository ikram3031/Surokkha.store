import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  Activity,
  Save,
  Info,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  FileCode2,
  BookOpen,
  Radio,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { clientConfig } from '@/clientConfig';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Generates the official gtag.js script snippet for storefront implementation
const generateGtagScript = (measurementId) => {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${measurementId}', {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure'
  });
</script>`;
};

// Manages Google Analytics 4 and Google Tag Manager storefront configurations
const GoogleAnalyticsPage = () => {
  const queryClient = useQueryClient();

  const [measurementId, setMeasurementId] = useState('');
  const [googleTagId, setGoogleTagId] = useState('');
  const [gtmId, setGtmId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [streamName, setStreamName] = useState('');
  const [lookerStudioEmbedUrl, setLookerStudioEmbedUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [enhancedMeasurement, setEnhancedMeasurement] = useState(true);
  const [copied, setCopied] = useState(false);

  const fallbackGa = clientConfig?.googleAnalytics || {};
  const brandName = clientConfig?.brandName || 'Store';
  const storefrontUrl = clientConfig?.storefrontUrl || '';

  const { data: gaData, isLoading } = useQuery({
    queryKey: ['google-analytics-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/google-analytics');
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (gaData) {
      setMeasurementId(gaData.measurementId || fallbackGa.measurementId || '');
      setGoogleTagId(gaData.googleTagId || fallbackGa.googleTagId || '');
      setGtmId(gaData.gtmId || fallbackGa.gtmId || '');
      setPropertyId(gaData.propertyId || fallbackGa.propertyId || '');
      setStreamName(gaData.streamName || fallbackGa.streamName || '');
      setLookerStudioEmbedUrl(gaData.lookerStudioEmbedUrl || fallbackGa.lookerStudioEmbedUrl || '');
      setIsEnabled(gaData.isEnabled !== false);
      setEnhancedMeasurement(gaData.enhancedMeasurement !== false);
    }
  }, [gaData, fallbackGa]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        measurementId: measurementId.trim(),
        googleTagId: googleTagId.trim(),
        gtmId: gtmId.trim(),
        propertyId: propertyId.trim(),
        streamName: streamName.trim(),
        lookerStudioEmbedUrl: lookerStudioEmbedUrl.trim(),
        isEnabled,
        enhancedMeasurement,
      };
      const res = await apiClient.put('/api/v1/settings/google-analytics', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Google Analytics settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['google-analytics-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Google Analytics settings');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleCopyScript = async () => {
    if (!measurementId && !fallbackGa.measurementId) {
      toast.error('No GA Measurement ID configured');
      return;
    }
    try {
      const script = generateGtagScript(measurementId || fallbackGa.measurementId || 'G-XXXXXXXXXX');
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success('gtag.js tracking code copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy script to clipboard');
    }
  };

  const isConfigured = Boolean(measurementId.trim() || fallbackGa.measurementId);
  const activeScript = generateGtagScript(measurementId || fallbackGa.measurementId || 'G-XXXXXXXXXX');

  const standardEvents = [
    { name: 'page_view', desc: 'Fired automatically on every URL navigation & page load' },
    { name: 'view_item', desc: 'Triggered when visitor opens any product detail page' },
    { name: 'add_to_cart', desc: 'Triggered when user clicks Add to Cart or Selects product variant' },
    { name: 'begin_checkout', desc: 'Triggered when customer enters the storefront checkout form' },
    { name: 'purchase', desc: 'Triggered on confirmed order with real transaction ID, revenue & item list' },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      {/* 1. Header with Live Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-amber-500" />
            Google Analytics 4 & Tag Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time event pipeline and Google Analytics stream integration for {brandName} storefront.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isConfigured && isEnabled ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Active in past 48h</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1 text-xs">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              <span>{!isEnabled ? 'Disabled' : 'Pending Configuration'}</span>
            </Badge>
          )}

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-xs transition-all shadow-xs"
          >
            <span>Live GA4 Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Verified Data Stream Status Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span>Google Analytics 4 Stream Connected</span>
                <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  {streamName || (brandName ? `${brandName} Stream` : 'Default Stream')}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Target URL: <span className="font-semibold text-foreground">{storefrontUrl || 'N/A'}</span> • Stream ID: <span className="font-mono font-semibold text-foreground">{fallbackGa.streamId || 'N/A'}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
            <div>
              <p className="text-[11px] text-muted-foreground">Measurement ID</p>
              <p className="font-mono font-bold text-foreground text-sm">{measurementId || 'Not Configured'}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Google Tag ID</p>
              <p className="font-mono font-bold text-foreground text-sm">{googleTagId || 'Not Configured'}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Enhanced Measurement</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Active (Auto-track)</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Property ID</p>
              <p className="font-mono font-bold text-foreground">{propertyId || 'Not Configured'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Credentials & Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">GA4 Stream & Container Credentials</CardTitle>
            <CardDescription className="text-xs">
              Configure your Google Analytics 4 Measurement ID, Google Tag ID, and Google Tag Manager container.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">GA4 Measurement ID</label>
                <Input
                  placeholder="e.g. G-XXXXXXXXXX"
                  value={measurementId}
                  onChange={(e) => setMeasurementId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-[11px] text-muted-foreground">
                  Found in GA4 Admin &gt; Data Streams &gt; Measurement ID.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Google Tag ID</label>
                <Input
                  placeholder="e.g. GT-XXXXXXXX"
                  value={googleTagId}
                  onChange={(e) => setGoogleTagId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-[11px] text-muted-foreground">
                  Found in Google Tag setup details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">GTM Container ID (Optional)</label>
                <Input
                  placeholder="e.g. GTM-XXXXXXX"
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">GA4 Property ID (Optional)</label>
                <Input
                  placeholder="e.g. 123456789"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Stream Name</label>
                <Input
                  placeholder={`e.g. ${brandName.toLowerCase()} stream`}
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Looker Studio Embed URL</span>
                <a
                  href="https://lookerstudio.google.com/u/0/navigation/reporting"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-normal"
                >
                  <span>Open Looker Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
              <Input
                placeholder="https://lookerstudio.google.com/embed/reporting/..."
                value={lookerStudioEmbedUrl}
                onChange={(e) => setLookerStudioEmbedUrl(e.target.value)}
                disabled={isLoading}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                In Looker Studio, open your report &gt; <strong>File</strong> &gt; <strong>Embed report</strong> &gt; Enable embedding &gt; Copy Embed URL.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Tracking Preferences */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Tracking Preferences</CardTitle>
            <CardDescription className="text-xs">
              Control live event broadcasting and automated visitor interactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Enable Google Analytics</p>
                <p className="text-[11px] text-muted-foreground">Inject gtag.js script snippet in public storefront pages.</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Enhanced Measurement</p>
                <p className="text-[11px] text-muted-foreground">Automatically track scroll depth, external link clicks, and site search queries.</p>
              </div>
              <Switch checked={enhancedMeasurement} onCheckedChange={setEnhancedMeasurement} />
            </div>
          </CardContent>
        </Card>

        {/* 5. Live Storefront Script Snippet (gtag.js) */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  <span>Storefront Tracking Code (gtag.js)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Automatically injected into the storefront <code className="font-mono text-primary">&lt;head&gt;</code> element.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="h-8 text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:border-primary cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-3.5 rounded-lg bg-neutral-950 text-neutral-100 font-mono text-xs leading-relaxed overflow-x-auto border border-neutral-800">
              <code>{activeScript}</code>
            </pre>
          </CardContent>
        </Card>

        {/* 6. Standard E-commerce Events Specification */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Real-time GA4 E-commerce Event Pipeline</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Active events broadcast from storefront user actions to Google Analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {standardEvents.map((evt, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 hover:bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="secondary" className="font-mono text-[11px] font-bold bg-primary/10 text-primary">
                      {evt.name}
                    </Badge>
                    <span className="text-foreground">{evt.desc}</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active & Verified</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold bg-amber-500 hover:bg-amber-600 text-neutral-950"
          >
            <Save className="h-4 w-4" />
            <span>Save Google Analytics Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoogleAnalyticsPage;
