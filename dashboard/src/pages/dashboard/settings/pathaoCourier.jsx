import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Shield,
  Activity,
  HelpCircle,
  Store,
  MapPin,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateHelper';

export default function PathaoCourierSettingsPage() {
  const queryClient = useQueryClient();

  // Settings state
  const [environment, setEnvironment] = useState('production');
  const [baseUrl, setBaseUrl] = useState('https://api-hermes.pathao.com');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [defaultItemWeight, setDefaultItemWeight] = useState(0.5);
  const [defaultItemType, setDefaultItemType] = useState(2); // 2 = Parcel
  const [defaultDeliveryType, setDefaultDeliveryType] = useState(48); // 48 = Normal
  const [isEnabled, setIsEnabled] = useState(true);

  // Available stores list
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // Location tester state
  const [calcCity, setCalcCity] = useState('');
  const [calcZone, setCalcZone] = useState('');
  const [calcArea, setCalcArea] = useState('');
  const [calcWeight, setCalcWeight] = useState(0.5);
  const [calcDeliveryType, setCalcDeliveryType] = useState(48);
  const [calcItemType, setCalcItemType] = useState(2);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Fetch settings from API
  const { data: configData, isLoading } = useQuery({
    queryKey: ['pathao-courier-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/courier/pathao/config');
      return res.data?.data || {};
    },
  });

  useEffect(() => {
    if (configData) {
      setEnvironment(configData.environment || 'production');
      setBaseUrl(
        configData.baseUrl ||
          (configData.environment === 'sandbox'
            ? 'https://courier-api-sandbox.pathao.com'
            : 'https://api-hermes.pathao.com')
      );
      setClientId(configData.clientId || '');
      setClientSecret(configData.clientSecret || '');
      setUsername(configData.username || '');
      setPassword(configData.hasPassword ? '••••••••' : '');
      setStoreId(configData.storeId ? String(configData.storeId) : '');
      setStoreName(configData.storeName || '');
      setStoreAddress(configData.storeAddress || '');
      setDefaultItemWeight(configData.defaultItemWeight ?? 0.5);
      setDefaultItemType(configData.defaultItemType ?? 2);
      setDefaultDeliveryType(configData.defaultDeliveryType ?? 48);
      setIsEnabled(configData.isEnabled !== false);
    }
  }, [configData]);

  // Handle environment toggle
  const handleEnvChange = (newEnv) => {
    setEnvironment(newEnv);
    if (newEnv === 'sandbox') {
      setBaseUrl('https://courier-api-sandbox.pathao.com');
    } else {
      setBaseUrl('https://api-hermes.pathao.com');
    }
  };

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const selectedStore = stores.find((s) => String(s.store_id) === String(storeId));
      const payload = {
        environment,
        baseUrl,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        username: username.trim(),
        password: password.trim(),
        storeId: storeId ? Number(storeId) : null,
        storeName: selectedStore?.store_name || storeName,
        storeAddress: selectedStore?.store_address || storeAddress,
        defaultItemWeight: Number(defaultItemWeight) || 0.5,
        defaultItemType: Number(defaultItemType) || 2,
        defaultDeliveryType: Number(defaultDeliveryType) || 48,
        isEnabled,
      };
      const res = await apiClient.put('/api/v1/courier/pathao/config', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Pathao Courier settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pathao-courier-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Pathao settings');
    },
  });

  // Test Connection Mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        environment,
        baseUrl,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        username: username.trim(),
        password: password.trim(),
      };
      const res = await apiClient.post('/api/v1/courier/pathao/test', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pathao connection verified successfully!');
      if (data.data?.stores?.length > 0) {
        setStores(data.data.stores);
      }
      queryClient.invalidateQueries({ queryKey: ['pathao-courier-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to verify Pathao connection');
    },
  });

  // Fetch stores list
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const res = await apiClient.get('/api/v1/courier/pathao/stores');
      const storeList = res.data?.data || [];
      setStores(storeList);
      if (storeList.length === 0) {
        toast.info('No stores found on your Pathao merchant account.');
      } else {
        toast.success(`Loaded ${storeList.length} store(s) from Pathao.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch Pathao stores.');
    } finally {
      setLoadingStores(false);
    }
  };

  // Fetch cities for lookup tool
  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const res = await apiClient.get('/api/v1/courier/pathao/cities');
      setCities(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load Pathao cities.');
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle City Change in tester
  const handleCityChange = async (cityId) => {
    setCalcCity(cityId);
    setCalcZone('');
    setCalcArea('');
    setZones([]);
    setAreas([]);
    setPriceResult(null);

    if (!cityId) return;
    try {
      setLoadingZones(true);
      const res = await apiClient.get(`/api/v1/courier/pathao/zones/${cityId}`);
      setZones(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load zones for this city.');
    } finally {
      setLoadingZones(false);
    }
  };

  // Handle Zone Change in tester
  const handleZoneChange = async (zoneId) => {
    setCalcZone(zoneId);
    setCalcArea('');
    setAreas([]);
    setPriceResult(null);

    if (!zoneId) return;
    try {
      setLoadingAreas(true);
      const res = await apiClient.get(`/api/v1/courier/pathao/areas/${zoneId}`);
      setAreas(res.data?.data || []);
    } catch (err) {
      console.warn('Area lookup error or no areas found', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  // Calculate Price in tester
  const handleCalculatePrice = async () => {
    if (!calcCity || !calcZone) {
      toast.error('Please select both a City and a Zone.');
      return;
    }
    if (!storeId) {
      toast.error('Please select a Store in the settings above first.');
      return;
    }

    try {
      setCalculatingPrice(true);
      const res = await apiClient.post('/api/v1/courier/pathao/price-plan', {
        store_id: Number(storeId),
        item_type: Number(calcItemType),
        delivery_type: Number(calcDeliveryType),
        item_weight: Number(calcWeight) || 0.5,
        recipient_city: Number(calcCity),
        recipient_zone: Number(calcZone),
      });
      setPriceResult(res.data?.data || res.data);
      toast.success('Price plan calculated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate delivery price.');
    } finally {
      setCalculatingPrice(false);
    }
  };

  const isConnected = configData?.lastTestStatus === 'connected';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pathao Courier Integration</h2>
              <p className="text-muted-foreground text-sm">
                Connect your Pathao Merchant account to automate order dispatches, consignment generation, and live delivery tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || isLoading}
            className="gap-2"
          >
            {testMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 text-primary" />
            )}
            Test Connection
          </Button>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className="gap-2 shadow-sm"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <Card className={`border ${isConnected ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Status:</span>
                <Badge
                  variant="outline"
                  className={
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }
                >
                  {isConnected ? 'Connected & Verified' : configData?.lastTestStatus === 'failed' ? 'Connection Failed' : 'Not Verified'}
                </Badge>
                <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                  {environment}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {configData?.lastTestMessage || 'Save your API credentials and run Test Connection to verify authentication.'}
                {configData?.lastTestedAt && (
                  <span className="ml-1 opacity-80 font-mono">
                    (Last checked: {formatDateTime(configData.lastTestedAt)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground">Pathao Active:</span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Credentials & Default Configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Credentials */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> API Credentials
              </CardTitle>
              <CardDescription>
                Obtain your Client ID, Client Secret, Username, and Password from the Pathao Courier Merchant Developer Portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Environment Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-border/60">
                <div className="space-y-1.5">
                  <label htmlFor="environment" className="text-xs font-semibold">
                    Environment Mode
                  </label>
                  <Select value={environment} onValueChange={handleEnvChange}>
                    <SelectTrigger id="environment" className="h-9 text-xs">
                      <SelectValue placeholder="Select Environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production (Live Hermes API)</SelectItem>
                      <SelectItem value="sandbox">Sandbox (Testing / Demo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="baseUrl" className="text-xs font-semibold">
                    API Base URL
                  </label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api-hermes.pathao.com"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="clientId" className="text-xs font-semibold">
                    Client ID <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter Pathao Client ID"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="clientSecret" className="text-xs font-semibold">
                    Client Secret <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={configData?.hasClientSecret ? '••••••••••••••••' : 'Enter Client Secret'}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-xs font-semibold">
                    Merchant Email / Username <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="merchant@example.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold">
                    Merchant Password <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={configData?.hasPassword ? '••••••••' : 'Enter Account Password'}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store & Default Dispatch Settings */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" /> Store & Default Parcel Settings
              </CardTitle>
              <CardDescription>
                Configure which Pathao pickup store and parcel attributes to apply by default when dispatching orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="storeId" className="text-xs font-semibold">
                    Default Pickup Store ID <span className="text-destructive">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchStores}
                    disabled={loadingStores}
                    className="h-7 px-2 text-xs text-primary gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingStores ? 'animate-spin' : ''}`} />
                    {loadingStores ? 'Fetching Stores...' : 'Fetch My Stores from Pathao'}
                  </Button>
                </div>

                {stores.length > 0 ? (
                  <Select
                    value={storeId}
                    onValueChange={(val) => {
                      setStoreId(val);
                      const s = stores.find((st) => String(st.store_id) === String(val));
                      if (s) {
                        setStoreName(s.store_name || '');
                        setStoreAddress(s.store_address || '');
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Pickup Store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((st) => (
                        <SelectItem key={st.store_id} value={String(st.store_id)}>
                          {st.store_name} (ID: {st.store_id}) — {st.store_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="storeId"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      placeholder="e.g. 12345 (Click 'Fetch My Stores' or enter numeric Store ID)"
                      className="h-9 text-xs font-mono flex-1"
                    />
                  </div>
                )}
                {storeName && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <strong className="text-foreground">{storeName}</strong> ({storeAddress || 'No address'})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="defaultItemWeight" className="text-xs font-semibold">
                    Default Weight (KG)
                  </label>
                  <Input
                    id="defaultItemWeight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={defaultItemWeight}
                    onChange={(e) => setDefaultItemWeight(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="defaultItemType" className="text-xs font-semibold">
                    Item Type
                  </label>
                  <Select
                    value={String(defaultItemType)}
                    onValueChange={(val) => setDefaultItemType(Number(val))}
                  >
                    <SelectTrigger id="defaultItemType" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Parcel (Standard Goods)</SelectItem>
                      <SelectItem value="1">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="defaultDeliveryType" className="text-xs font-semibold">
                    Delivery Speed / Type
                  </label>
                  <Select
                    value={String(defaultDeliveryType)}
                    onValueChange={(val) => setDefaultDeliveryType(Number(val))}
                  >
                    <SelectTrigger id="defaultDeliveryType" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="48">Standard Normal (48 Hours)</SelectItem>
                      <SelectItem value="12">On Demand (Same / Next Day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Live Location Lookup & Rate Calculator */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-sm bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Live Rate & Coverage Calculator
              </CardTitle>
              <CardDescription className="text-xs">
                Test Pathao coverage areas, zones, and get real-time price estimations for any delivery destination.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {/* City Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Recipient City</label>
                  {cities.length === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchCities}
                      disabled={loadingCities}
                      className="h-6 px-1.5 text-[11px] text-primary"
                    >
                      {loadingCities ? 'Loading...' : 'Load Cities'}
                    </Button>
                  )}
                </div>
                <Select value={calcCity} onValueChange={handleCityChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={cities.length === 0 ? "Click 'Load Cities' above" : "Select City"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {cities.map((c) => (
                      <SelectItem key={c.city_id} value={String(c.city_id)}>
                        {c.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Selection */}
              {calcCity && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Zone</label>
                  <Select value={calcZone} onValueChange={handleZoneChange} disabled={loadingZones}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={loadingZones ? 'Loading zones...' : 'Select Zone'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {zones.map((z) => (
                        <SelectItem key={z.zone_id} value={String(z.zone_id)}>
                          {z.zone_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Area Selection */}
              {calcZone && areas.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Area / Thana</label>
                  <Select value={calcArea} onValueChange={setCalcArea} disabled={loadingAreas}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Specific Area" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {areas.map((a) => (
                        <SelectItem key={a.area_id} value={String(a.area_id)}>
                          {a.area_name} {a.home_delivery_available ? '(Home Delivery)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Weight & Calc Button */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Weight (KG)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleCalculatePrice}
                    disabled={calculatingPrice || !calcCity || !calcZone}
                    className="h-8 text-xs w-full gap-1.5"
                  >
                    {calculatingPrice ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Calculator className="h-3 w-3" />}
                    Calculate
                  </Button>
                </div>
              </div>

              {/* Price Calculation Result */}
              {priceResult && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1.5 mt-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Estimated Delivery Fee:</span>
                    <span className="text-base font-bold text-primary">
                      ৳{priceResult.price ?? priceResult.data?.price ?? 'N/A'}
                    </span>
                  </div>
                  {priceResult.plan_id && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-primary/15 pt-1">
                      <span>Plan ID:</span>
                      <span className="font-mono">{priceResult.plan_id}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Help Guide */}
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Integration Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                1. Login to your <strong>Pathao Merchant Dashboard</strong> and request API credentials from your Pathao account manager or Developer portal.
              </p>
              <p>
                2. Enter your <strong>Client ID</strong>, <strong>Client Secret</strong>, <strong>Merchant Email</strong>, and <strong>Password</strong>.
              </p>
              <p>
                3. Click <strong>Test Connection</strong> to verify OAuth authentication.
              </p>
              <p>
                4. Select your default pickup store from the dropdown and hit <strong>Save Configuration</strong>.
              </p>
              <div className="pt-2 border-t border-border/60">
                <a
                  href="https://merchant.pathao.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  Visit Pathao Merchant Portal <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
