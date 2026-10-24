import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Activity,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Shop and store each keep their own pixel data behind their own API
const SITES = {
  shop: { domain: 'surokkha.shop', label: 'Shop', badge: 'SH', apiBase: '/api/v2/settings/meta-pixel' },
  store: { domain: 'surokkha.store', label: 'Store', badge: 'ST', apiBase: '/store/v2/settings/meta-pixel' },
};

// Manages one site's Meta Pixel and Conversions API configuration and verification
const MetaPixelPage = ({ site = 'shop' }) => {
  const queryClient = useQueryClient();
  const siteInfo = SITES[site] || SITES.shop;
  const queryKey = ['meta-pixel-settings', site];

  // Form state for the selected site
  const [shopPixelId, setShopPixelId] = useState('');
  const [shopAccessToken, setShopAccessToken] = useState('');
  const [shopTestEventCode, setShopTestEventCode] = useState('');
  const [shopIsEnabled, setShopIsEnabled] = useState(true);
  const [shopEnableBrowserPixel, setShopEnableBrowserPixel] = useState(true);
  const [shopEnableCapi, setShopEnableCapi] = useState(true);
  const [shopAdvancedMatching, setShopAdvancedMatching] = useState(true);

  const { data: pixelData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get(siteInfo.apiBase);
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (pixelData) {
      const shop = pixelData;

      setShopPixelId(shop.pixelId || '');
      setShopAccessToken(shop.accessToken || '');
      setShopTestEventCode(shop.testEventCode || '');
      setShopIsEnabled(shop.isEnabled !== false);
      setShopEnableBrowserPixel(shop.enableBrowserPixel !== false);
      setShopEnableCapi(shop.enableCapi !== false);
      setShopAdvancedMatching(shop.advancedMatching !== false);
    }
  }, [pixelData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pixelId: shopPixelId.trim(),
        accessToken: shopAccessToken.trim(),
        testEventCode: shopTestEventCode.trim(),
        isEnabled: shopIsEnabled,
        enableBrowserPixel: shopEnableBrowserPixel,
        enableCapi: shopEnableCapi,
        advancedMatching: shopAdvancedMatching,
      };

      const res = await apiClient.put(siteInfo.apiBase, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Meta Pixel settings updated successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Meta Pixel settings');
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({ pixelId, accessToken, testEventCode }) => {
      const payload = {
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim(),
        testEventCode: testEventCode.trim(),
      };
      const res = await apiClient.post(`${siteInfo.apiBase}/test`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Meta Conversions API connection verified!');
      queryClient.invalidateQueries({ queryKey });
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
    if (!shopPixelId.trim() || !shopAccessToken.trim()) {
      toast.error('Pixel ID and Access Token are required to test connection');
      return;
    }

    testMutation.mutate({
      pixelId: shopPixelId,
      accessToken: shopAccessToken,
      testEventCode: shopTestEventCode,
    });
  };

  const shopStatus = pixelData?.lastTestStatus || 'untested';

  const renderStatusBadge = (status) => {
    if (status === 'connected') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected & Verified
        </Badge>
      );
    }
    if (status === 'failed') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Connection Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5 px-3 py-1">
        <Activity className="h-3.5 w-3.5 text-amber-500" />
        Untested
      </Badge>
    );
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Share2 className="h-7 w-7 text-blue-600" />
            Meta Pixel & Conversions API (CAPI)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the Meta Pixel dataset and CAPI credentials for {siteInfo.domain}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {siteInfo.badge}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-foreground flex flex-wrap items-center gap-2">
                <span className="truncate">{siteInfo.domain}</span>
                <Badge variant="outline" className="text-[11px] text-emerald-700 bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-200 shrink-0">
                  Order Prefix: {siteInfo.badge}
                </Badge>
              </h4>
              <p className="hidden sm:block text-xs text-muted-foreground mt-0.5 truncate">
                Storefront webroot at <code className="text-[11px]">/opt/clients/surokkha/{site}</code>
              </p>
            </div>
          </div>
          <div className="shrink-0">{renderStatusBadge(shopStatus)}</div>
        </div>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">{siteInfo.label} Pixel Credentials</CardTitle>
            <CardDescription className="text-xs">
              Enter the dedicated Meta Pixel ID and Conversions API token for {siteInfo.domain}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Meta Pixel / Dataset ID</label>
              <Input
                placeholder="e.g. 123456789012345"
                value={shopPixelId}
                onChange={(e) => setShopPixelId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Dedicated dataset identifier for {siteInfo.domain}.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Conversions API Access Token</label>
              <Input
                type="password"
                placeholder="EAAB..."
                value={shopAccessToken}
                onChange={(e) => setShopAccessToken(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                Conversions API access token for {siteInfo.domain}.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Test Event Code (Optional)</label>
              <Input
                placeholder="e.g. TEST67890"
                value={shopTestEventCode}
                onChange={(e) => setShopTestEventCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">{siteInfo.label} Tracking Options</CardTitle>
            <CardDescription className="text-xs">
              Configure browser and server-side tracking pipelines for {siteInfo.domain}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Master Tracking Toggle</p>
                <p className="text-[11px] text-muted-foreground">Enable all Meta tracking for {siteInfo.domain}.</p>
              </div>
              <Switch checked={shopIsEnabled} onCheckedChange={setShopIsEnabled} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Browser Pixel (fbq)</p>
                <p className="text-[11px] text-muted-foreground">Inject standard fbq script tag in customer storefront.</p>
              </div>
              <Switch checked={shopEnableBrowserPixel} onCheckedChange={setShopEnableBrowserPixel} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Conversions API (CAPI)</p>
                <p className="text-[11px] text-muted-foreground">Send server-side Purchase and checkout events for iOS 14+ ad resiliency.</p>
              </div>
              <Switch checked={shopEnableCapi} onCheckedChange={setShopEnableCapi} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Advanced Customer Matching</p>
                <p className="text-[11px] text-muted-foreground">Hash customer phone, email, and location data to improve event match quality.</p>
              </div>
              <Switch checked={shopAdvancedMatching} onCheckedChange={setShopAdvancedMatching} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testMutation.isPending || !shopPixelId || !shopAccessToken}
            className="cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Test {siteInfo.label} CAPI Connection</span>
          </Button>
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Changes saved here update MongoDB instantly for {siteInfo.domain}.
          </p>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold px-6"
          >
            <Save className="h-4 w-4" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save Meta Settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MetaPixelPage;
