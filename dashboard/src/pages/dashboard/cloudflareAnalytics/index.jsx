import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Printer,
  Link as LinkIcon,
  Plus,
  Filter,
  Radio,
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  RefreshCw,
  Lock,
  Globe,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { clientConfig } from '@/clientConfig';
import { apiClient } from '@/lib/api-client';

// Cloudflare official design tokens & colors
const CF_BLUE = '#0051C3';
const CF_ACCENT_BLUE = '#1E88E5';
const CF_LIGHT_BLUE = '#60A5FA';
const CF_AMBER = '#F59E0B';
const CF_PINK = '#EC4899';
const CF_CYAN = '#06B6D4';

// Mini Sparkline component matching Cloudflare's card bottoms
const MiniSparkline = ({ data = [], color = '#0051C3' }) => {
  const points = data.length > 0 ? data : [
    { v: 12 }, { v: 45 }, { v: 22 }, { v: 85 }, { v: 34 }, { v: 110 }, { v: 65 }, { v: 130 }, { v: 40 }, { v: 95 }, { v: 60 }
  ];
  return (
    <div className="h-10 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace('#', '')})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Globe Wireframe Visualizer for Country Distribution
const GlobeVisualizer = () => {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-sky-500/5 to-transparent border border-blue-500/20 shadow-inner" />
      <svg viewBox="0 0 160 160" className="w-40 h-40 text-blue-500/80 animate-pulse">
        <circle cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="80" cy="80" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <ellipse cx="80" cy="80" rx="72" ry="28" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="80" cy="80" rx="72" ry="54" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="80" cy="80" rx="28" ry="72" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="80" cy="80" rx="54" ry="72" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <line x1="8" y1="80" x2="152" y2="80" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        <line x1="80" y1="8" x2="80" y2="152" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        {/* Globe node highlights */}
        <circle cx="95" cy="65" r="3" fill="#0051C3" className="animate-ping" />
        <circle cx="95" cy="65" r="2.5" fill="#3B82F6" />
        <circle cx="65" cy="95" r="2" fill="#10B981" />
        <circle cx="110" cy="90" r="2" fill="#F59E0B" />
      </svg>
    </div>
  );
};

export default function CloudflareTrafficOverviewPage() {
  const { theme, systemTheme } = useTheme();
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  const cfConfig = clientConfig?.cloudFlareAnalytics;
  const isAccessAllowed = Boolean(cfConfig?.active || clientConfig?.clientKey === 'surokkha');
  const domain = cfConfig?.domain || clientConfig?.domain || 'surokkha.store';

  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [data, setData] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!isAccessAllowed) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/api/v1/system/cloudflare-analytics?range=${range}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Cloudflare overview:', err);
    } finally {
      setLoading(false);
    }
  }, [range, isAccessAllowed]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Live Auto-Refresh Heartbeat (every 25s)
  useEffect(() => {
    if (!isLiveActive || !isAccessAllowed) return;
    const timer = setInterval(() => {
      fetchOverview();
    }, 25000);
    return () => clearInterval(timer);
  }, [isLiveActive, isAccessAllowed, fetchOverview]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Dashboard link copied to clipboard');
  };

  if (!isAccessAllowed) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Traffic Overview Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Cloudflare Live Traffic Overview is enabled exclusively for <strong>Surokkha</strong> personal wellness storefront.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center space-x-2 bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground font-medium">Loading Cloudflare Data...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalRequests: '0',
    requestsChange: '0%',
    totalVisits: '0',
    visitsChange: '0%',
    cacheHitRate: '0%',
    cacheHitChange: '0%',
    totalDataTransferMB: '0 MB',
    dataTransferChange: '0%',
  };

  const requestsOverTime = data?.requestsOverTime || [];
  const devices = data?.devices || [];
  const countries = data?.countries || [];
  const statusCodes = data?.statusCodes || {
    '2xx': { formattedCount: '0', percentage: '0' },
    '3xx': { formattedCount: '0', percentage: '0' },
    '4xx': { formattedCount: '0', percentage: '0' },
    '5xx': { formattedCount: '0', percentage: '0' },
  };

  const topPaths = data?.topPaths || [];
  const topHosts = data?.topHosts || [];
  const topClientIps = data?.topClientIps || [];
  const topBrowsers = data?.topBrowsers || [];
  const topOperatingSystems = data?.topOperatingSystems || [];
  const topUserAgents = data?.topUserAgents || [];

  const sparkline1 = (requestsOverTime.slice(0, 14)).map((r) => ({ v: r.requests || 0 }));
  const sparkline2 = (requestsOverTime.slice(0, 14)).map((r) => ({ v: r.requests ? Math.round(r.requests * 0.45) : 0 }));
  const sparkline3 = (requestsOverTime.slice(0, 14)).map((r) => ({ v: r.requests ? Math.round(r.requests * 0.1) : 0 }));
  const sparkline4 = (requestsOverTime.slice(0, 14)).map((r) => ({ v: r.requests || 0 }));

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1440px] mx-auto bg-background min-h-screen font-sans text-foreground">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          Traffic overview
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/70 text-foreground transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Print</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/70 text-foreground transition-all cursor-pointer"
          >
            <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Copy link</span>
          </button>

          <button
            onClick={() => toast.info('Custom charts are automatically configured for your Cloudflare edge.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0051C3] hover:bg-[#0040A1] text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add a chart</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Header Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <button
          onClick={() => toast.info('Edge filter applied: Surokkha Zone')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/70 text-foreground w-fit cursor-pointer"
        >
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Add filter</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setIsLiveActive(!isLiveActive);
              fetchOverview();
              toast.success(isLiveActive ? 'Live refresh paused' : 'Live refresh active');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isLiveActive
                ? 'border-[#0051C3]/40 bg-[#0051C3]/10 text-[#0051C3] dark:text-blue-400'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isLiveActive ? 'animate-pulse text-[#0051C3]' : ''}`} />
            <span>Live refresh</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer pr-1 text-foreground"
            >
              <option value="24h" className="bg-popover text-popover-foreground">Last 24 hours</option>
              <option value="7days" className="bg-popover text-popover-foreground">Last 7 days</option>
              <option value="30days" className="bg-popover text-popover-foreground">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Top KPI Cards Strip (4 Cards with mini Sparkline charts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total requests */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-normal text-[12px]">Total requests</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">{summary.totalRequests}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{summary.requestsChange}</span>
          </div>
          <MiniSparkline data={sparkline1} color="#0051C3" />
        </div>

        {/* Card 2: Total visits */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-normal text-[12px]">Total visits</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">{summary.totalVisits}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{summary.visitsChange}</span>
          </div>
          <MiniSparkline data={sparkline2} color="#0051C3" />
        </div>

        {/* Card 3: Cache-hit rate */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-normal text-[12px]">Cache-hit rate</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">{summary.cacheHitRate}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{summary.cacheHitChange}</span>
          </div>
          <MiniSparkline data={sparkline3} color="#0051C3" />
        </div>

        {/* Card 4: Total data transfer */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-normal text-[12px]">Total data transfer</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">{summary.totalDataTransferMB}</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{summary.dataTransferChange}</span>
          </div>
          <MiniSparkline data={sparkline4} color="#0051C3" />
        </div>
      </div>

      {/* 4. Requests over time (Main Line Chart) */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Requests over time</span>
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-[#0051C3]" />
          <span className="text-xs font-semibold text-foreground">Requests: {summary.totalRequests}</span>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={requestsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
              <XAxis dataKey="time" stroke={isDark ? '#94A3B8' : '#94A3B8'} fontSize={10.5} tickLine={false} />
              <YAxis stroke={isDark ? '#94A3B8' : '#94A3B8'} fontSize={10.5} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  padding: '6px 10px',
                }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#0051C3"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, fill: '#0051C3' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Device Type & Requests by country Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Requests by device type */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Requests by device type</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>

          <div className="flex items-center gap-4 text-xs font-medium mb-2">
            {devices.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name} <strong className="font-semibold text-foreground">{d.formattedCount}</strong></span>
              </div>
            ))}
          </div>

          <div className="h-[210px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Requests by country */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Requests by country</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <GlobeVisualizer />

            <div className="w-full space-y-2 flex-1">
              {countries.slice(0, 10).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-3">
                  <span className="text-muted-foreground truncate w-32 shrink-0">{c.name}</span>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex-1">
                    <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${c.relativeWidth}%` }} />
                  </div>
                  <span className="font-mono text-foreground font-semibold text-right w-12 shrink-0">{c.formattedCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Status Codes Horizontal Segmented Bar Card */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Status codes</span>
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
        </div>

        <div className="flex items-center gap-5 text-xs font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#0051C3]" />
            <span>2xx <strong className="font-semibold text-foreground">{statusCodes['2xx']?.formattedCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            <span>3xx <strong className="font-semibold text-foreground">{statusCodes['3xx']?.formattedCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            <span>4xx <strong className="font-semibold text-foreground">{statusCodes['4xx']?.formattedCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EC4899]" />
            <span>5xx <strong className="font-semibold text-foreground">{statusCodes['5xx']?.formattedCount}</strong></span>
          </div>
        </div>

        {/* Full-width continuous segmented progress bar */}
        <div className="w-full h-4 rounded-md overflow-hidden flex bg-muted">
          <div style={{ width: `${statusCodes['2xx']?.percentage}%` }} className="h-full bg-[#0051C3] hover:opacity-90 transition-all" title={`2xx: ${statusCodes['2xx']?.percentage}%`} />
          <div style={{ width: `${statusCodes['3xx']?.percentage}%` }} className="h-full bg-[#06B6D4] hover:opacity-90 transition-all" title={`3xx: ${statusCodes['3xx']?.percentage}%`} />
          <div style={{ width: `${statusCodes['4xx']?.percentage}%` }} className="h-full bg-[#F59E0B] hover:opacity-90 transition-all" title={`4xx: ${statusCodes['4xx']?.percentage}%`} />
          <div style={{ width: `${statusCodes['5xx']?.percentage}%` }} className="h-full bg-[#EC4899] hover:opacity-90 transition-all" title={`5xx: ${statusCodes['5xx']?.percentage}%`} />
        </div>
      </div>

      {/* 7. Row 4: Top Paths, Top Hosts, Top Client IPs (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Top paths */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top paths</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topPaths.slice(0, 12).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="font-mono text-[11px] text-foreground truncate w-44 shrink-0" title={item.name}>{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top hosts */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top hosts</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topHosts.slice(0, 12).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="font-mono text-[11px] text-foreground truncate w-44 shrink-0" title={item.name}>{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top client IPs */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top client IPs</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topClientIps.slice(0, 12).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="font-mono text-[11px] text-foreground truncate w-36 shrink-0" title={item.name}>{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Row 5: Top Browsers, Top Operating Systems, Top User Agents (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Top browsers */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top browsers</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topBrowsers.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="text-[11.5px] text-foreground truncate w-36 shrink-0">{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top operating systems */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top operating systems</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topOperatingSystems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="text-[11.5px] text-foreground truncate w-36 shrink-0">{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top user agents */}
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground">Top user agents</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            {topUserAgents.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                <span className="font-mono text-[10px] text-foreground truncate w-40 shrink-0" title={item.name}>{item.name}</span>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-[#0051C3] rounded-full" style={{ width: `${item.relativeWidth}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground text-right w-10 shrink-0">{item.formattedCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
