import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  Share2,
  ShoppingCart,
  Users,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { getGA4ReportUrls } from '../analyticsData';

// Tab component presenting official GA4 console deep links with zero dummy data
export const GA4DirectReportsTab = ({
  propertyId = '',
  measurementId = '',
  streamName = '',
  brandName = 'Store',
}) => {
  const urls = getGA4ReportUrls(propertyId);

  const reportCards = [
    {
      title: 'Real-Time User Stream',
      category: 'Realtime Traffic',
      desc: 'Monitor active users on your storefront in the last 30 minutes, current active URLs, geographic locations, and instant conversions.',
      icon: Radio,
      badge: 'Live Stream',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      url: urls.realtime,
      features: ['Active users in last 30 mins', 'Live top page paths', 'Real-time device breakdown', 'Instant event stream'],
    },
    {
      title: 'Traffic & User Acquisition',
      category: 'Marketing Channels',
      desc: 'Discover which channels drive visitors to your store — Organic Search (Google), Paid Social (Meta Ads), Organic Social, Direct, or Referrals.',
      icon: Share2,
      badge: 'Acquisition',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      url: urls.acquisition,
      features: ['Session default channel group', 'Source / Medium breakdown', 'Engaged sessions rate', 'New vs returning visitors'],
    },
    {
      title: 'Monetization & Ecommerce Purchases',
      category: 'Sales & Revenue',
      desc: 'Analyze e-commerce performance, total checkout volume, average purchase revenue, cart additions, and product catalog engagement.',
      icon: ShoppingCart,
      badge: 'Ecommerce',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      url: urls.monetization,
      features: ['Item views & add-to-carts', 'Checkout completion rate', 'E-commerce purchase revenue', 'Top performing items'],
    },
    {
      title: 'Demographics & Geographic Locations',
      category: 'Audience Insight',
      desc: 'Understand who your customers are by country, division/city (Dhaka, Chittagong, Sylhet, etc.), language, and gender demographics.',
      icon: Users,
      badge: 'Demographics',
      badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      url: urls.demographics,
      features: ['City & division breakdown', 'Country visitor distribution', 'Language preferences', 'New user demographic trends'],
    },
    {
      title: 'Tech Stack & Device Category',
      category: 'Devices & Platforms',
      desc: 'Inspect visitor browsers (Chrome, Safari, Firefox), devices (Mobile vs Desktop vs Tablet), screen resolutions, and OS versions.',
      icon: Smartphone,
      badge: 'Technology',
      badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      url: urls.tech,
      features: ['Mobile vs Desktop share', 'Operating system distribution', 'Browser share & versions', 'Screen resolution telemetry'],
    },
    {
      title: 'GA4 Admin & Data Stream Console',
      category: 'Administration',
      desc: 'Manage Measurement ID, Google Tag configuration, Enhanced Measurement settings, and Measurement Protocol API secrets.',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeClass: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
      url: urls.streams,
      features: ['Data stream health status', 'Measurement Protocol secrets', 'Enhanced measurement triggers', 'Custom definitions & events'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stream Verification Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  Google Analytics 4 Property {propertyId ? `#${propertyId}` : ''}
                </CardTitle>
                <CardDescription className="text-xs">
                  Connected Stream: <strong className="text-foreground">{streamName || `${brandName} Stream`}</strong> • Measurement ID: <strong className="text-foreground font-mono">{measurementId || 'Not Configured'}</strong>
                </CardDescription>
              </div>
            </div>

            <a
              href={urls.console}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Main GA4 Dashboard</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>
      </Card>

      {/* Grid of Direct GA4 Deep Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold ${card.badgeClass}`}>
                    {card.badge}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold text-foreground">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {card.desc}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <ul className="text-[11px] text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  {card.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all"
                >
                  <span>Open in Google Analytics</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
