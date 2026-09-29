import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, ShieldCheck, FileCode2, BookOpen, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateGtagScript } from '../analyticsData';

// Tab component detailing GA4 tag setup, script integration, and event specifications
export const GA4SetupTab = ({ config, brandName = 'Store', onOpenConfigModal }) => {
  const [copied, setCopied] = useState(false);

  // Handles copying the generated gtag.js script snippet to clipboard
  const handleCopy = async () => {
    try {
      const snippet = generateGtagScript(config.measurementId || 'G-XXXXXXXXXX');
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('gtag.js script copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy script to clipboard');
    }
  };

  const scriptSnippet = generateGtagScript(config.measurementId || 'G-XXXXXXXXXX');

  const standardEvents = [
    { name: 'page_view', desc: 'Fired automatically on every URL navigation' },
    { name: 'view_item', desc: 'Triggered when visitor opens a product details page' },
    { name: 'add_to_cart', desc: 'Triggered when user clicks Add to Cart or Selects variant' },
    { name: 'begin_checkout', desc: 'Triggered when customer enters checkout form' },
    { name: 'purchase', desc: 'Triggered on order completion page with transaction_id and revenue' },
  ];

  return (
    <div className="space-y-4">
      {/* Stream Verification & Settings Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  Google Analytics 4 Stream Connected
                </CardTitle>
                <CardDescription className="text-xs">
                  Active Property ID: <span className="font-mono font-semibold">{config.propertyId || 'Not Configured'}</span> • Stream: <span className="font-semibold">{config.streamName || `${brandName} Web Stream`}</span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenConfigModal}
                className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Configure IDs</span>
              </Button>
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Google Analytics Console</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
            <div>
              <p className="text-[11px] text-muted-foreground">Measurement ID</p>
              <p className="font-mono font-bold text-foreground">{config.measurementId || 'G-XXXXXXXXXX'}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Google Tag Manager</p>
              <p className="font-mono font-bold text-foreground">{config.gtmId || 'Not Configured (Optional)'}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Enhanced Measurement</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Enabled (Automatic)</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Data Retention</p>
              <p className="font-bold text-foreground">14 Months (Standard)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Snippet Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary" />
                <span>Storefront Tracking Code (gtag.js)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Copy and insert this script in the <code className="font-mono text-primary">&lt;head&gt;</code> element of your website.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:border-primary cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Script'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-3 rounded-lg bg-neutral-950 text-neutral-100 font-mono text-xs leading-relaxed overflow-x-auto border border-neutral-800">
            <code>{scriptSnippet}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Standard Ecommerce Events Specification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>GA4 Standard Ecommerce Events Reference</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Events recognized automatically for conversion funnel tracking and reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border text-xs">
            {standardEvents.map((evt, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 hover:bg-muted/40">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[11px] font-bold bg-primary/10 text-primary">
                    {evt.name}
                  </Badge>
                  <span className="text-foreground">{evt.desc}</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                  Active & Verified
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
