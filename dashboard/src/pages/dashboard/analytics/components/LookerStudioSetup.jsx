import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  Share2,
  ShoppingCart,
  Users,
  CheckCircle2,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cleanLookerStudioEmbedUrl, getGA4ReportUrls } from '../analyticsData';

// Component displayed when Looker Studio Embed URL is not yet connected
export const LookerStudioSetup = ({
  brandName = 'Store',
  propertyId = '',
  measurementId = '',
  streamName = '',
  onSaveEmbedUrl,
  isSaving = false,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [copiedPropId, setCopiedPropId] = useState(false);
  const urls = getGA4ReportUrls(propertyId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = cleanLookerStudioEmbedUrl(urlInput);
    if (!cleaned) {
      toast.error('Please enter a valid Looker Studio Embed URL');
      return;
    }
    if (onSaveEmbedUrl) {
      onSaveEmbedUrl(cleaned);
    }
  };

  const handleCopyPropertyId = async () => {
    if (!propertyId) {
      toast.error('No Property ID configured');
      return;
    }
    try {
      await navigator.clipboard.writeText(propertyId);
      setCopiedPropId(true);
      toast.success('Property ID copied to clipboard');
      setTimeout(() => setCopiedPropId(false), 2000);
    } catch {
      toast.error('Failed to copy Property ID');
    }
  };

  const ga4DirectLinks = [
    {
      title: 'Real-time Live Visitors',
      desc: 'Live traffic, active pages & current user stream',
      icon: Radio,
      badge: 'Live',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      url: urls.realtime,
    },
    {
      title: 'Traffic Acquisition',
      desc: 'Organic search, Meta Ads, social & direct channels',
      icon: Share2,
      badge: 'Channels',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      url: urls.acquisition,
    },
    {
      title: 'Ecommerce Monetization',
      desc: 'Product views, checkout funnels, orders & revenue',
      icon: ShoppingCart,
      badge: 'Revenue',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      url: urls.monetization,
    },
    {
      title: 'Audience & Demographics',
      desc: 'Visitor cities, mobile vs desktop & browser tech',
      icon: Users,
      badge: 'Tech',
      badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      url: urls.demographics,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Verified Stream Connection Status Bar */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 flex-wrap">
                  <span>Google Analytics 4 Stream Verified</span>
                  {streamName && (
                    <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                      {streamName}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Measurement ID: <span className="font-mono font-bold text-foreground">{measurementId || 'Not Configured'}</span> • Property ID: <span className="font-mono font-bold text-foreground">{propertyId || 'Not Configured'}</span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPropertyId}
                className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPropId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPropId ? 'Copied ID' : 'Copy Property ID'}</span>
              </Button>
              <a
                href={urls.console}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Open GA4 Console</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Main Looker Studio Setup Card */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-bold">
                  Connect Google Looker Studio Live Dashboard
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Render 100% genuine Google Analytics 4 charts, acquisition breakdown, and ecommerce funnels live inside your store dashboard with zero synthetic data.
              </CardDescription>
            </div>
            <a
              href="https://lookerstudio.google.com/u/0/navigation/reporting"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-semibold transition-all shadow-xs shrink-0"
            >
              <span>Create in Looker Studio</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 4-Step Visual Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5 relative">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                1
              </span>
              <h4 className="text-xs font-bold text-foreground">Open Looker Studio</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click <strong>Blank Report</strong> or pick a GA4 Ecommerce template in Google Looker Studio.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5 relative">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                2
              </span>
              <h4 className="text-xs font-bold text-foreground">Select GA4 Connector</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Choose <strong>Google Analytics</strong> and select Property <strong className="font-mono">{propertyId || '[Your Property ID]'}</strong> ({brandName}).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5 relative">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                3
              </span>
              <h4 className="text-xs font-bold text-foreground">Enable Embedding</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click <strong>File &gt; Embed report</strong>, check <strong>Enable embedding</strong>, and copy the <strong>Embed URL</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5 relative">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                4
              </span>
              <h4 className="text-xs font-bold text-foreground">Paste & Connect</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Paste the URL below to immediately load your official real-time visual dashboard.
              </p>
            </div>
          </div>

          {/* Quick Connect URL Input Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Paste Looker Studio Embed URL</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://lookerstudio.google.com/embed/reporting/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="font-mono text-xs h-10 bg-background"
                disabled={isSaving}
              />
              <Button
                type="submit"
                disabled={isSaving || !urlInput.trim()}
                className="h-10 px-5 font-semibold text-xs cursor-pointer bg-amber-500 hover:bg-amber-600 text-neutral-950 shrink-0 flex items-center gap-1.5"
              >
                <span>{isSaving ? 'Connecting...' : 'Connect Live Dashboard'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Tip: You can paste either the full iframe tag or just the URL. Antigravity will automatically format and secure it.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* 3. Official GA4 Direct Reporting Console Deep Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Official Google Analytics 4 Live Reports</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Open verified live reports directly in Google Analytics with 1-click authentication
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ga4DirectLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${item.badgeClass}`}>
                      {item.badge}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                      <span>{item.title}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-primary font-medium">
                  <span>Open Report</span>
                  <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
