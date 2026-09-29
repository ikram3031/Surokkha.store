import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink, Settings2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateGtagScript, getGA4Settings, saveGA4Settings, cleanLookerStudioEmbedUrl } from '../analyticsData';

// Modal component for viewing and managing client Google Analytics 4 & Looker Studio integration credentials
export const GA4ConfigModal = ({ open, onOpenChange, brandName = 'Store', onSettingsSaved }) => {
  const [config, setConfig] = useState(() => getGA4Settings());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(getGA4Settings());
    }
  }, [open]);

  // Handles copying the generated gtag.js script snippet to system clipboard
  const handleCopySnippet = async () => {
    try {
      const snippet = generateGtagScript(config.measurementId || 'G-XXXXXXXXXX');
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('gtag.js snippet copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy snippet to clipboard');
    }
  };

  // Persists the updated GA4 configuration parameters
  const handleSave = () => {
    const cleanedConfig = {
      ...config,
      lookerStudioEmbedUrl: cleanLookerStudioEmbedUrl(config.lookerStudioEmbedUrl || ''),
    };
    saveGA4Settings(cleanedConfig);
    toast.success('Google Analytics 4 configuration saved');
    if (onSettingsSaved) {
      onSettingsSaved(cleanedConfig);
    }
    onOpenChange(false);
  };

  const scriptSnippet = generateGtagScript(config.measurementId || 'G-XXXXXXXXXX');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Google Analytics 4 & Looker Studio Config
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage measurement stream, Tag Manager IDs, and Looker Studio embed URL for {brandName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Status Banner */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  GA4 Measurement Stream Active
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Events, pageviews, and ecommerce conversion data stream are linked.
                </p>
              </div>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
            >
              <span>GA Console</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
                <span>GA4 Measurement ID</span>
                <span className="text-[10px] text-muted-foreground">Format: G-XXXXXXXXXX</span>
              </label>
              <Input
                value={config.measurementId}
                onChange={(e) => setConfig((prev) => ({ ...prev, measurementId: e.target.value.trim().toUpperCase() }))}
                placeholder="G-XXXXXXXXXX"
                className="font-mono text-xs uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Google Tag Manager ID
                </label>
                <Input
                  value={config.gtmId || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, gtmId: e.target.value.trim().toUpperCase() }))}
                  placeholder="GTM-XXXXXXX"
                  className="font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  GA4 Property ID
                </label>
                <Input
                  value={config.propertyId || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, propertyId: e.target.value.trim() }))}
                  placeholder="e.g. 123456789"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Web Stream Name
              </label>
              <Input
                value={config.streamName || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, streamName: e.target.value }))}
                placeholder={`e.g. ${brandName} Web Stream`}
                className="text-xs"
              />
            </div>

            <div className="pt-2 border-t border-border/50">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
                <span>Google Looker Studio Embed URL</span>
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
                value={config.lookerStudioEmbedUrl || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, lookerStudioEmbedUrl: e.target.value }))}
                placeholder="https://lookerstudio.google.com/embed/reporting/..."
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                File &gt; Embed report &gt; Enable embedding &gt; Copy Embed URL.
              </p>
            </div>
          </div>

          {/* Script Snippet Block */}
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Storefront Tag Script (gtag.js)</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySnippet}
                className="h-7 px-2.5 text-xs flex items-center gap-1 border-primary/30 hover:border-primary text-primary cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Script'}</span>
              </Button>
            </div>
            <pre className="p-2.5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-neutral-800">
              <code>{scriptSnippet}</code>
            </pre>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
