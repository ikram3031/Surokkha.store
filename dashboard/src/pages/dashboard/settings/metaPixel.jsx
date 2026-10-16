import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Shield,
  Activity,
  Globe,
  Hash,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Manages Multi-Site Meta Pixel and Conversions API configuration and verification
const MetaPixelPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('store');

  // Store Site State (surokkha.store / SST)
  const [storePixelId, setStorePixelId] = useState('');
  const [storeAccessToken, setStoreAccessToken] = useState('');
  const [storeTestEventCode, setStoreTestEventCode] = useState('');
  const [storeIsEnabled, setStoreIsEnabled] = useState(true);
  const [storeEnableBrowserPixel, setStoreEnableBrowserPixel] = useState(true);
  const [storeEnableCapi, setStoreEnableCapi] = useState(true);
  const [storeAdvancedMatching, setStoreAdvancedMatching] = useState(true);

  // Shop Site State (surokkha.shop / SSH)
  const [shopPixelId, setShopPixelId] = useState('');
  const [shopAccessToken, setShopAccessToken] = useState('');
  const [shopTestEventCode, setShopTestEventCode] = useState('');
  const [shopIsEnabled, setShopIsEnabled] = useState(true);
  const [shopEnableBrowserPixel, setShopEnableBrowserPixel] = useState(true);
  const [shopEnableCapi, setShopEnableCapi] = useState(true);
  const [shopAdvancedMatching, setShopAdvancedMatching] = useState(true);

  const { data: pixelData, isLoading } = useQuery({
    queryKey: ['meta-pixel-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/meta-pixel');
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (pixelData) {
      const sites = pixelData.sites || {};
      const store = sites.store || pixelData;
      const shop = sites.shop || {};

      // Store site
      setStorePixelId(store.pixelId || pixelData.pixelId || '');
      setStoreAccessToken(store.accessToken || pixelData.accessToken || '');
      setStoreTestEventCode(store.testEventCode || pixelData.testEventCode || '');
      setStoreIsEnabled(store.isEnabled !== false);
      setStoreEnableBrowserPixel(store.enableBrowserPixel !== false);
      setStoreEnableCapi(store.enableCapi !== false);
      setStoreAdvancedMatching(store.advancedMatching !== false);

      // Shop site
      setShopPixelId(shop.pixelId || store.pixelId || pixelData.pixelId || '');
      setShopAccessToken(shop.accessToken || store.accessToken || pixelData.accessToken || '');
      setShopTestEventCode(shop.testEventCode || '');
      setShopIsEnabled(shop.isEnabled !== false);
      setShopEnableBrowserPixel(shop.enableBrowserPixel !== false);
      setShopEnableCapi(shop.enableCapi !== false);
      setShopAdvancedMatching(shop.advancedMatching !== false);
    }
  }, [pixelData]);

  const saveMutation = useMutation({
    mutationFn: async ({ targetSiteKey = null } = {}) => {
      const payload = {
        sites: {
          store: {
            siteKey: 'store',
            domain: 'surokkha.store',
            brandName: 'Surokkha Store',
            orderPrefix: 'SST',
            pixelId: storePixelId.trim(),
            accessToken: storeAccessToken.trim(),
            testEventCode: storeTestEventCode.trim(),
            isEnabled: storeIsEnabled,
            enableBrowserPixel: storeEnableBrowserPixel,
            enableCapi: storeEnableCapi,
            advancedMatching: storeAdvancedMatching,
          },
          shop: {
            siteKey: 'shop',
            domain: 'surokkha.shop',
            brandName: 'Surokkha Shop',
            orderPrefix: 'SSH',
            pixelId: shopPixelId.trim(),
            accessToken: shopAccessToken.trim(),
            testEventCode: shopTestEventCode.trim(),
            isEnabled: shopIsEnabled,
            enableBrowserPixel: shopEnableBrowserPixel,
            enableCapi: shopEnableCapi,
            advancedMatching: shopAdvancedMatching,
          },
        },
      };

      if (targetSiteKey) {
        payload.siteKey = targetSiteKey;
      }

      const res = await apiClient.put('/api/v1/settings/meta-pixel', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Meta Pixel settings updated successfully for all sites');
      queryClient.invalidateQueries({ queryKey: ['meta-pixel-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Meta Pixel settings');
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({ siteKey, pixelId, accessToken, testEventCode }) => {
      const payload = {
        siteKey,
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim(),
        testEventCode: testEventCode.trim(),
      };
      const res = await apiClient.post('/api/v1/settings/meta-pixel/test', payload);
      return { ...res.data, siteKey };
    },
    onSuccess: (data) => {
      toast.success(data.message || `Meta Conversions API connection verified for ${data.siteKey || 'site'}!`);
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

  const handleTestConnection = (siteKey) => {
    const isShop = siteKey === 'shop';
    const targetPixelId = isShop ? shopPixelId : storePixelId;
    const targetAccessToken = isShop ? shopAccessToken : storeAccessToken;
    const targetTestEventCode = isShop ? shopTestEventCode : storeTestEventCode;

    if (!targetPixelId.trim() || !targetAccessToken.trim()) {
      toast.error('Pixel ID and Access Token are required to test connection');
      return;
    }

    testMutation.mutate({
      siteKey,
      pixelId: targetPixelId,
      accessToken: targetAccessToken,
      testEventCode: targetTestEventCode,
    });
  };

  const storeStatus = pixelData?.sites?.store?.lastTestStatus || pixelData?.lastTestStatus || 'untested';
  const shopStatus = pixelData?.sites?.shop?.lastTestStatus || 'untested';

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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Share2 className="h-7 w-7 text-blue-600" />
            Meta Pixel & Conversions API (CAPI)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage multi-site Meta Pixel datasets, CAPI credentials, and track conversions separately per domain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1.5 font-medium">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Dual-Domain Active
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md h-11 p-1 bg-muted/60">
            <TabsTrigger value="store" className="flex items-center gap-2 font-semibold">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Surokkha Store</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                SST
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="shop" className="flex items-center gap-2 font-semibold">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span>Surokkha Shop</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                SSH
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────── TAB 1: SUROKKHA STORE ─────────────────── */}
          <TabsContent value="store" className="space-y-6 focus:outline-none">
            <div className="flex items-center justify-between p-4 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  SST
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    surokkha.store
                    <Badge variant="outline" className="text-[11px] text-blue-700 bg-blue-100/60 dark:bg-blue-900/40 border-blue-200">
                      Order Prefix: SST
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Primary storefront webroot at <code className="text-[11px]">/opt/clients/surokkha/store</code>
                  </p>
                </div>
              </div>
              <div>{renderStatusBadge(storeStatus)}</div>
            </div>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Store Pixel Credentials</CardTitle>
                <CardDescription className="text-xs">
                  Enter the Meta Pixel ID and Conversions API System User token for surokkha.store.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Meta Pixel / Dataset ID</label>
                  <Input
                    placeholder="e.g. 123456789012345"
                    value={storePixelId}
                    onChange={(e) => setStorePixelId(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Active dataset identifier for surokkha.store.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Conversions API Access Token</label>
                  <Input
                    type="password"
                    placeholder="EAAB..."
                    value={storeAccessToken}
                    onChange={(e) => setStoreAccessToken(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Generated in Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate access token.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Test Event Code (Optional)</label>
                  <Input
                    placeholder="e.g. TEST12345"
                    value={storeTestEventCode}
                    onChange={(e) => setStoreTestEventCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Storefront Tracking Options</CardTitle>
                <CardDescription className="text-xs">
                  Configure browser and server-side tracking pipelines for surokkha.store.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Master Tracking Toggle</p>
                    <p className="text-[11px] text-muted-foreground">Enable all Meta tracking for surokkha.store.</p>
                  </div>
                  <Switch checked={storeIsEnabled} onCheckedChange={setStoreIsEnabled} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Browser Pixel (fbq)</p>
                    <p className="text-[11px] text-muted-foreground">Inject standard fbq script tag in customer storefront.</p>
                  </div>
                  <Switch checked={storeEnableBrowserPixel} onCheckedChange={setStoreEnableBrowserPixel} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Conversions API (CAPI)</p>
                    <p className="text-[11px] text-muted-foreground">Send server-side Purchase and checkout events for iOS 14+ ad resiliency.</p>
                  </div>
                  <Switch checked={storeEnableCapi} onCheckedChange={setStoreEnableCapi} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Advanced Customer Matching</p>
                    <p className="text-[11px] text-muted-foreground">Hash customer phone, email, and location data to improve event match quality.</p>
                  </div>
                  <Switch checked={storeAdvancedMatching} onCheckedChange={setStoreAdvancedMatching} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestConnection('store')}
                disabled={testMutation.isPending || !storePixelId || !storeAccessToken}
                className="cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Test Store CAPI Connection</span>
              </Button>
            </div>
          </TabsContent>

          {/* ─────────────────── TAB 2: SUROKKHA SHOP ─────────────────── */}
          <TabsContent value="shop" className="space-y-6 focus:outline-none">
            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  SSH
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    surokkha.shop
                    <Badge variant="outline" className="text-[11px] text-emerald-700 bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-200">
                      Order Prefix: SSH
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Secondary storefront webroot at <code className="text-[11px]">/opt/clients/surokkha/shop</code>
                  </p>
                </div>
              </div>
              <div>{renderStatusBadge(shopStatus)}</div>
            </div>

            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Shop Pixel Credentials</CardTitle>
                <CardDescription className="text-xs">
                  Enter the dedicated Meta Pixel ID and Conversions API token for surokkha.shop.
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
                    Dedicated dataset identifier for surokkha.shop.
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
                    Conversions API access token for surokkha.shop.
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
                <CardTitle className="text-base font-semibold">Shop Tracking Options</CardTitle>
                <CardDescription className="text-xs">
                  Configure browser and server-side tracking pipelines for surokkha.shop.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Master Tracking Toggle</p>
                    <p className="text-[11px] text-muted-foreground">Enable all Meta tracking for surokkha.shop.</p>
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
                onClick={() => handleTestConnection('shop')}
                disabled={testMutation.isPending || !shopPixelId || !shopAccessToken}
                className="cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Test Shop CAPI Connection</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Changes saved here update MongoDB instantly and apply across both storefront domains.
          </p>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold px-6"
          >
            <Save className="h-4 w-4" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save All Meta Settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MetaPixelPage;
