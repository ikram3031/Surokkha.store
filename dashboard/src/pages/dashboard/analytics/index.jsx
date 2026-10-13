import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  ExternalLink,
  Settings2,
  ShieldCheck,
  Radio,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clientConfig } from '@/clientConfig';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { getGA4Settings, cleanLookerStudioEmbedUrl } from './analyticsData';
import { LookerStudioEmbed } from './components/LookerStudioEmbed';
import { LookerStudioSetup } from './components/LookerStudioSetup';
import { GA4DirectReportsTab } from './components/GA4DirectReportsTab';
import { GA4SetupTab } from './components/GA4SetupTab';
import { GA4ConfigModal } from './components/GA4ConfigModal';

// Main Google Analytics dashboard page integrating Google Looker Studio Live GA4 Embed
const AnalyticsPage = () => {
  const queryClient = useQueryClient();
  const brandName = clientConfig?.brandName || 'Store';
  const fallbackGa = clientConfig?.googleAnalytics || {};

  const [activeTab, setActiveTab] = useState('looker');
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Fetches verified Google Analytics & Looker Studio credentials from database
  const { data: gaData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['google-analytics-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/google-analytics');
      return res.data?.data || {};
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const localDefaults = useMemo(() => getGA4Settings(), []);

  // Merges server settings, local defaults, and client configuration
  const currentConfig = useMemo(() => {
    return {
      measurementId: gaData?.measurementId || fallbackGa.measurementId || localDefaults.measurementId || '',
      googleTagId: gaData?.googleTagId || fallbackGa.googleTagId || localDefaults.googleTagId || '',
      gtmId: gaData?.gtmId || fallbackGa.gtmId || localDefaults.gtmId || '',
      propertyId: gaData?.propertyId || fallbackGa.propertyId || localDefaults.propertyId || '',
      streamName: gaData?.streamName || fallbackGa.streamName || localDefaults.streamName || (brandName ? `${brandName} Stream` : ''),
      lookerStudioEmbedUrl: gaData?.lookerStudioEmbedUrl || fallbackGa.lookerStudioEmbedUrl || localDefaults.lookerStudioEmbedUrl || '',
      isEnabled: gaData?.isEnabled !== false,
      enhancedMeasurement: gaData?.enhancedMeasurement !== false,
    };
  }, [gaData, fallbackGa, localDefaults, brandName]);

  // Mutation to persist updated Looker Studio Embed URL
  const saveMutation = useMutation({
    mutationFn: async (updatedUrl) => {
      const payload = {
        ...currentConfig,
        lookerStudioEmbedUrl: cleanLookerStudioEmbedUrl(updatedUrl),
      };
      const res = await apiClient.put('/api/v1/settings/google-analytics', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Looker Studio live dashboard connected successfully!');
      queryClient.invalidateQueries({ queryKey: ['google-analytics-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save Looker Studio Embed URL');
    },
  });

  const handleSaveEmbedUrl = (url) => {
    saveMutation.mutate(url);
  };

  const handleManualRefresh = () => {
    refetch()
      .then(() => toast.success('Analytics settings synchronized'))
      .catch(() => toast.error('Failed to sync settings'));
  };

  const hasEmbedUrl = Boolean(currentConfig.lookerStudioEmbedUrl?.trim());

  const tabs = [
    { id: 'looker', label: 'Looker Studio Live Embed', icon: BarChart3, badge: hasEmbedUrl ? 'Live' : 'Connect' },
    { id: 'reports', label: 'GA4 Direct Live Reports', icon: Radio, badge: 'Official' },
    { id: 'setup', label: 'gtag.js Tag & Events Pipeline', icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full">
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-amber-500" />
              <span>Google Analytics</span>
            </h2>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Stream Active (Past 48h)</span>
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Official Google Analytics 4 (Property <strong className="text-foreground font-mono">{currentConfig.propertyId}</strong>) live reporting and embedded Looker Studio dashboard for {brandName}.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="h-9 px-2.5 text-xs cursor-pointer hover:bg-muted"
            title="Refresh stream settings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="h-9 px-3 text-xs flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>GA4 & Looker Config</span>
          </Button>

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-xs h-9 transition-all shadow-xs"
            title="Open official Google Analytics Console"
          >
            <span>Live GA Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="border-b border-border pb-3">
        <div className="inline-flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold border ${
                      t.badge === 'Live'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* TAB 1: LOOKER STUDIO LIVE EMBED */}
        {activeTab === 'looker' && (
          <div>
            {hasEmbedUrl ? (
              <LookerStudioEmbed
                embedUrl={currentConfig.lookerStudioEmbedUrl}
                brandName={brandName}
                propertyId={currentConfig.propertyId}
                measurementId={currentConfig.measurementId}
                onOpenConfig={() => setConfigModalOpen(true)}
              />
            ) : (
              <LookerStudioSetup
                brandName={brandName}
                propertyId={currentConfig.propertyId}
                measurementId={currentConfig.measurementId}
                streamName={currentConfig.streamName}
                onSaveEmbedUrl={handleSaveEmbedUrl}
                isSaving={saveMutation.isPending}
              />
            )}
          </div>
        )}

        {/* TAB 2: GA4 DIRECT LIVE REPORTS */}
        {activeTab === 'reports' && (
          <GA4DirectReportsTab
            propertyId={currentConfig.propertyId}
            measurementId={currentConfig.measurementId}
            streamName={currentConfig.streamName}
            brandName={brandName}
          />
        )}

        {/* TAB 3: GTAG.JS TAG & EVENTS PIPELINE */}
        {activeTab === 'setup' && (
          <GA4SetupTab
            config={currentConfig}
            brandName={brandName}
            onOpenConfigModal={() => setConfigModalOpen(true)}
          />
        )}
      </div>

      {/* GA4 Configuration Modal Dialog */}
      <GA4ConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        brandName={brandName}
        onSettingsSaved={(newCfg) => {
          queryClient.invalidateQueries({ queryKey: ['google-analytics-settings'] });
        }}
      />
    </div>
  );
};

export default AnalyticsPage;
