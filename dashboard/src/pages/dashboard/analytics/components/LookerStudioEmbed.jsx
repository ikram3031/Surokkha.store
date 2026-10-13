import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cleanLookerStudioEmbedUrl } from '../analyticsData';

// Renders the live interactive Google Looker Studio report iframe connected to GA4
export const LookerStudioEmbed = ({
  embedUrl = '',
  brandName = 'Store',
  propertyId = '',
  measurementId = '',
  onOpenConfig,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  const cleanedUrl = cleanLookerStudioEmbedUrl(embedUrl);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
    toast.success('Refreshing Looker Studio dashboard...');
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`space-y-3 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-auto flex flex-col' : ''
      }`}
    >
      {/* Top Toolbar Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-2.5 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>GA4 Live Stream Connected</span>
          </Badge>

          {propertyId && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              Property ID: <strong className="text-foreground font-mono">{propertyId}</strong>
            </span>
          )}

          {measurementId && (
            <span className="text-xs text-muted-foreground hidden lg:inline">
              Tag: <strong className="text-foreground font-mono">{measurementId}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-muted"
            title="Reload Looker Studio Dashboard"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleFullscreen}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-muted"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </Button>

          <a
            href={cleanedUrl.replace('/embed/reporting/', '/reporting/')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground text-xs font-medium h-8 transition-all cursor-pointer"
            title="Open in Looker Studio tab"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Open in Looker Studio</span>
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenConfig}
            className="h-8 px-2.5 text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            title="Change Looker Studio Embed URL or GA4 IDs"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Edit Embed URL</span>
          </Button>
        </div>
      </div>

      {/* Embed Iframe Container */}
      <Card className={`border-border/70 overflow-hidden relative shadow-sm ${isFullscreen ? 'flex-1 min-h-[90vh]' : ''}`}>
        <CardContent className="p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs min-h-[500px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-semibold text-foreground">Loading Official Looker Studio GA4 Dashboard...</p>
                <p className="text-[11px] text-muted-foreground">Streaming real-time metrics for {brandName}</p>
              </div>
            </div>
          )}

          <iframe
            key={refreshKey}
            src={cleanedUrl}
            title={`${brandName} Google Analytics Looker Studio Dashboard`}
            className="w-full border-0 rounded-lg"
            style={{
              height: isFullscreen ? 'calc(100vh - 120px)' : '820px',
              minHeight: '650px',
            }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setIsLoading(false)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
