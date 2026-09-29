import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Package,
  CreditCard,
  DollarSign,
  Tag,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ShoppingBag,
  Clock,
  Filter,
  BarChart3,
  Layers
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useReports } from '@/hooks/use-reports';
import { exportToCsv } from '@/utils/exportCsv';
import clientConfig from '@/clientConfig';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const reportsConfig = clientConfig?.reports || {
  enableInStoreFilter: true,
  enableExport: true,
  enabledTabs: ['sales', 'products', 'payments', 'inventory']
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

// Formats a number as Bangladeshi Taka currency
const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Formats a large number into compact shorthand
const formatCompactNumber = (value) => {
  const num = Number(value) || 0;
  if (num >= 1000000) return `৳${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `৳${(num / 1000).toFixed(1)}k`;
  return `৳${num}`;
};

// Formats a date string for display in charts and labels
const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Custom tooltip renderer for sales and revenue area chart
const SalesTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm transition-all text-xs space-y-1.5 min-w-[170px]">
      <div className="font-semibold text-foreground border-b pb-1 flex items-center justify-between">
        <span>{label}</span>
        {payload[0]?.payload?.ordersCount !== undefined && (
          <span className="text-muted-foreground font-normal">
            {payload[0].payload.ordersCount} orders
          </span>
        )}
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom tooltip renderer for top products bar chart
const ProductTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;

  return (
    <div className="rounded-lg border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm transition-all text-xs space-y-1 min-w-[180px]">
      <div className="font-semibold text-foreground border-b pb-1 line-clamp-1">
        {data?.name || data?._id}
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-muted-foreground">SKU:</span>
        <span className="font-mono text-foreground">{data?.sku || 'N/A'}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Units Sold:</span>
        <span className="font-semibold text-foreground">{data?.unitsSold} units</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Revenue:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data?.revenue)}</span>
      </div>
    </div>
  );
};

// Custom tooltip renderer for payment methods pie chart
const PaymentTooltip = ({ active, payload, totalAmount }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  const share = totalAmount > 0 ? ((Number(data?.paidAmount || data?.value || 0) / totalAmount) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-lg border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm transition-all text-xs space-y-1 min-w-[170px]">
      <div className="font-semibold text-foreground border-b pb-1 flex items-center justify-between">
        <span className="capitalize">{data?.name || data?._id || 'Unknown'}</span>
        <span className="text-muted-foreground">{share}%</span>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-muted-foreground">Transactions:</span>
        <span className="font-semibold text-foreground">{data?.transactionCount || 0}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Paid Volume:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data?.paidAmount || data?.value)}</span>
      </div>
    </div>
  );
};

// Renders an empty data state placeholder with an icon and custom message
const EmptyState = ({ title = 'No Data Available', description = 'There are no records matching your current filter selection.', icon: Icon = Layers }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card/50 my-2">
      <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
};

// Renders skeleton loaders for stat cards, charts, and tables during initial data fetch
const ReportsSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </Card>
      <Card className="p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
};

// Main interactive Reports and Analytics dashboard component
const ReportsV2Page = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState('30days');
  const [channel, setChannel] = useState('all');
  const [activeTab, setActiveTab] = useState(reportsConfig.enabledTabs[0] || 'sales');
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  useEffect(() => {
    setMounted(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const pastStr = pastDate.toISOString().split('T')[0];
    setTempStartDate(pastStr);
    setTempEndDate(todayStr);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const {
    summary,
    timeline,
    products,
    payments,
    inventory,
    isLoading,
    isRefetching,
    isError,
    refetchAll
  } = useReports({
    range,
    channel,
    startDate: range === 'custom' ? customStartDate : undefined,
    endDate: range === 'custom' ? customEndDate : undefined,
  });

  // Handles date range selection change and triggers dialog for custom ranges
  const handleRangeChange = (val) => {
    if (val === 'custom') {
      setIsCustomDialogOpen(true);
    } else {
      setRange(val);
    }
  };

  // Applies custom date range filters and closes dialog
  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
      setRange('custom');
      setIsCustomDialogOpen(false);
    }
  };

  // Computes active date range description text
  const dateRangeDescription = useMemo(() => {
    if (range === 'today') return 'Today';
    if (range === 'yesterday') return 'Yesterday';
    if (range === '7days') return 'Last 7 Days';
    if (range === '30days') return 'Last 30 Days';
    if (range === 'thisMonth') return 'This Month';
    if (range === 'lastMonth') return 'Last Month';
    if (range === 'thisYear') return 'This Year';
    if (range === 'custom') {
      if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
      return 'Custom Date Range';
    }
    return 'Selected Period';
  }, [range, customStartDate, customEndDate]);

  // Exports the active report dataset to a CSV spreadsheet
  const handleExport = () => {
    let dataToExport = [];
    const dateStamp = new Date().toISOString().split('T')[0];
    const rangeSlug = range === 'custom' ? `${customStartDate}_to_${customEndDate}` : range;
    const filename = `report_${activeTab}_${channel}_${rangeSlug}_${dateStamp}.csv`;

    switch (activeTab) {
      case 'sales':
        dataToExport = timeline.data?.map((t) => ({
          Date: t._id,
          'Orders Count': t.ordersCount || 0,
          'Gross Sales (BDT)': t.grossSales || 0,
          'Discounts (BDT)': t.discount || 0,
          'Net Sales (BDT)': t.netSales || 0,
        })) || [];
        break;
      case 'products':
        dataToExport = products.data?.map((p, idx) => ({
          Rank: idx + 1,
          'Product Name': p._id,
          SKU: p.sku || 'N/A',
          'Units Sold': p.unitsSold || 0,
          'Revenue (BDT)': p.revenue || 0,
        })) || [];
        break;
      case 'payments':
        dataToExport = payments.data?.map((p) => ({
          'Payment Method': p._id || 'Unknown',
          'Transaction Count': p.transactionCount || 0,
          'Total Volume (BDT)': p.totalAmount || 0,
          'Paid Amount (BDT)': p.paidAmount || 0,
        })) || [];
        break;
      case 'inventory':
        dataToExport = inventory.data?.alerts?.map((a) => ({
          'Product Name': a.name,
          SKU: a.sku || 'N/A',
          Type: a.type,
          'Stock Count': a.stock,
          Status: a.status,
        })) || [];
        break;
    }

    exportToCsv(dataToExport, filename);
  };

  const topProductsChartData = useMemo(() => {
    if (!products.data || !Array.isArray(products.data)) return [];
    return products.data.slice(0, 8).map((p) => ({
      name: p._id?.length > 20 ? `${p._id.substring(0, 18)}...` : p._id,
      fullName: p._id,
      sku: p.sku,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
    }));
  }, [products.data]);

  const paymentChartData = useMemo(() => {
    if (!payments.data || !Array.isArray(payments.data)) return [];
    return payments.data.map((p, index) => ({
      name: (p._id || 'Unknown').toUpperCase(),
      value: Number(p.paidAmount || p.totalAmount || 0),
      transactionCount: p.transactionCount || 0,
      totalAmount: p.totalAmount || 0,
      paidAmount: p.paidAmount || 0,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [payments.data]);

  const totalPaymentVolume = useMemo(() => {
    return paymentChartData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [paymentChartData]);

  const showInStoreFilter = reportsConfig.enableInStoreFilter && clientConfig?.features?.inStoreOrder !== false;
  const showExport = reportsConfig.enableExport;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            <span>Real-time performance metrics</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="font-medium text-foreground/80">{dateRangeDescription}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[155px] h-9 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="custom">Custom Range...</SelectItem>
            </SelectContent>
          </Select>

          {range === 'custom' && customStartDate && customEndDate && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5 bg-muted/30"
              onClick={() => setIsCustomDialogOpen(true)}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{customStartDate} → {customEndDate}</span>
            </Button>
          )}

          {showInStoreFilter && (
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[145px] h-9 text-xs">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="online">Online Store</SelectItem>
                <SelectItem value="pos">In-Store POS</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={refetchAll}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {showExport && (
            <Button
              size="sm"
              className="h-9 text-xs gap-1.5 shadow-sm"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Select Custom Date Range
            </DialogTitle>
            <DialogDescription className="text-xs">
              Specify the start and end dates to filter financial and operational reports.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">End Date</label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyCustomRange}
              disabled={!tempStartDate || !tempEndDate}
            >
              Apply Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isError && (
        <Alert variant="destructive" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <div>
              <AlertTitle className="text-sm font-semibold">Failed to Load Reporting Data</AlertTitle>
              <AlertDescription className="text-xs">
                Could not retrieve complete reporting metrics from server.
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-destructive/40 hover:bg-destructive/10"
            onClick={refetchAll}
          >
            Retry
          </Button>
        </Alert>
      )}

      {isLoading && !mounted ? (
        <ReportsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border shadow-xs transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Sales
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(summary.data?.netSales)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>Gross:</span>
                  <span className="font-semibold text-foreground/80">{formatCurrency(summary.data?.grossSales)}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border shadow-xs transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Orders
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {(summary.data?.totalOrders || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  Online: <span className="font-medium text-foreground/80">{formatCurrency(summary.data?.onlineSales)}</span>
                  {' '}&bull;{' '}
                  POS: <span className="font-medium text-foreground/80">{formatCurrency(summary.data?.posSales)}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border shadow-xs transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Average Order Value
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(summary.data?.aov)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Average spend per completed order
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border shadow-xs transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Discounts
                </CardTitle>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Tag className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  -{formatCurrency(summary.data?.totalDiscount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {summary.data?.grossSales > 0
                    ? `${((Number(summary.data.totalDiscount || 0) / Number(summary.data.grossSales)) * 100).toFixed(1)}% of gross revenue`
                    : 'Total customer discounts applied'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col space-y-5">
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-10 p-1 bg-muted/60 border">
                {reportsConfig.enabledTabs.includes('sales') && (
                  <TabsTrigger value="sales" className="text-xs gap-1.5 px-3.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sales & Revenue
                  </TabsTrigger>
                )}
                {reportsConfig.enabledTabs.includes('products') && (
                  <TabsTrigger value="products" className="text-xs gap-1.5 px-3.5">
                    <Package className="w-3.5 h-3.5" />
                    Top Products
                  </TabsTrigger>
                )}
                {reportsConfig.enabledTabs.includes('payments') && (
                  <TabsTrigger value="payments" className="text-xs gap-1.5 px-3.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment Analytics
                  </TabsTrigger>
                )}
                {reportsConfig.enabledTabs.includes('inventory') && (
                  <TabsTrigger value="inventory" className="text-xs gap-1.5 px-3.5">
                    <Boxes className="w-3.5 h-3.5" />
                    Inventory Health
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {reportsConfig.enabledTabs.includes('sales') && (
              <TabsContent value="sales" className="space-y-5 outline-none">
                <Card className="border shadow-xs">
                  <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">Sales Timeline Trajectory</CardTitle>
                      <CardDescription className="text-xs">
                        Daily net sales and gross revenue performance over the selected period.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[340px] w-full">
                      {timeline.isLoading ? (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Loading timeline chart...
                        </div>
                      ) : !timeline.data?.length ? (
                        <EmptyState
                          title="No Sales Data"
                          description="No sales or order transactions recorded for this period."
                          icon={TrendingUp}
                        />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={timeline.data}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorNetSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="colorGrossSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDark ? '#334155' : '#e2e8f0'}
                              opacity={0.6}
                            />
                            <XAxis
                              dataKey="_id"
                              tickFormatter={formatDateLabel}
                              stroke={isDark ? '#94a3b8' : '#64748b'}
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tickFormatter={formatCompactNumber}
                              stroke={isDark ? '#94a3b8' : '#64748b'}
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<SalesTooltip />} />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              iconType="circle"
                              wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="grossSales"
                              name="Gross Sales"
                              stroke="#3b82f6"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              fillOpacity={1}
                              fill="url(#colorGrossSales)"
                            />
                            <Area
                              type="monotone"
                              dataKey="netSales"
                              name="Net Sales"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorNetSales)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">Timeline Breakdown</CardTitle>
                        <CardDescription className="text-xs">
                          Chronological audit of completed daily transactions.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {timeline.data?.length || 0} days recorded
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold text-center">Orders Count</TableHead>
                          <TableHead className="font-semibold text-right">Gross Sales</TableHead>
                          <TableHead className="font-semibold text-right">Discounts</TableHead>
                          <TableHead className="font-semibold text-right">Net Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {timeline.data?.map((row) => (
                          <TableRow key={row._id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-foreground">
                              {row._id}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-normal text-[11px]">
                                {row.ordersCount || 0} orders
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(row.grossSales)}
                            </TableCell>
                            <TableCell className="text-right text-rose-500 font-medium">
                              -{formatCurrency(row.discount)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(row.netSales)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {!timeline.data?.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-32">
                              <EmptyState
                                title="No timeline records"
                                description="No orders or financial activity recorded for this period."
                                icon={Calendar}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {reportsConfig.enabledTabs.includes('products') && (
              <TabsContent value="products" className="space-y-5 outline-none">
                <Card className="border shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Performing Products</CardTitle>
                    <CardDescription className="text-xs">
                      Highest revenue generating items across completed customer orders.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[340px] w-full">
                      {products.isLoading ? (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Loading top products chart...
                        </div>
                      ) : !topProductsChartData.length ? (
                        <EmptyState
                          title="No Product Sales"
                          description="No product sales records found for the selected time range."
                          icon={Package}
                        />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProductsChartData}
                            margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDark ? '#334155' : '#e2e8f0'}
                              opacity={0.6}
                            />
                            <XAxis
                              dataKey="name"
                              stroke={isDark ? '#94a3b8' : '#64748b'}
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              angle={-20}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              tickFormatter={formatCompactNumber}
                              stroke={isDark ? '#94a3b8' : '#64748b'}
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<ProductTooltip />} />
                            <Bar
                              dataKey="revenue"
                              name="Revenue"
                              fill="#6366f1"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">Product Rankings</CardTitle>
                        <CardDescription className="text-xs">
                          Complete revenue and unit volume breakdown.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {products.data?.length || 0} products ranked
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="w-16 text-center font-semibold">Rank</TableHead>
                          <TableHead className="font-semibold">Product Name</TableHead>
                          <TableHead className="font-semibold">SKU</TableHead>
                          <TableHead className="text-right font-semibold">Units Sold</TableHead>
                          <TableHead className="text-right font-semibold">Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {products.data?.map((product, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-center font-bold">
                              {i === 0 ? (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5">
                                  #1
                                </Badge>
                              ) : i === 1 ? (
                                <Badge className="bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30 text-[10px] px-2 py-0.5">
                                  #2
                                </Badge>
                              ) : i === 2 ? (
                                <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px] px-2 py-0.5">
                                  #3
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">#{i + 1}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-foreground max-w-xs truncate">
                              {product._id}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">
                              {product.sku || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="font-normal text-[11px]">
                                {product.unitsSold} sold
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatCurrency(product.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {!products.data?.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-32">
                              <EmptyState
                                title="No Products Data"
                                description="No product orders recorded for this period."
                                icon={Package}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {reportsConfig.enabledTabs.includes('payments') && (
              <TabsContent value="payments" className="space-y-5 outline-none">
                <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
                  <Card className="border shadow-xs lg:col-span-5 flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Payment Distribution</CardTitle>
                      <CardDescription className="text-xs">
                        Breakdown of collected revenue by payment gateway.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
                      {payments.isLoading ? (
                        <div className="h-[220px] w-full flex items-center justify-center text-xs text-muted-foreground">
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Loading payment chart...
                        </div>
                      ) : !paymentChartData.length ? (
                        <EmptyState
                          title="No Payment Data"
                          description="No completed payment transactions recorded for this period."
                          icon={CreditCard}
                        />
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={paymentChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={3}
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {paymentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                  ))}
                                </Pie>
                                <Tooltip content={<PaymentTooltip totalAmount={totalPaymentVolume} />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-lg font-bold text-foreground">{formatCompactNumber(totalPaymentVolume)}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid Total</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                            {paymentChartData.map((item) => (
                              <div key={item.name} className="flex items-center justify-between p-1.5 rounded-md bg-muted/30">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <span className="text-muted-foreground truncate">{item.name}</span>
                                </div>
                                <span className="font-semibold text-foreground text-[11px]">
                                  {totalPaymentVolume > 0 ? `${((item.value / totalPaymentVolume) * 100).toFixed(0)}%` : '0%'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border shadow-xs lg:col-span-7 overflow-hidden">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold">Payment Methods Summary</CardTitle>
                          <CardDescription className="text-xs">
                            Transaction volume and settled amounts.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal">
                          {payments.data?.length || 0} methods recorded
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 text-xs">
                            <TableHead className="font-semibold">Payment Method</TableHead>
                            <TableHead className="font-semibold text-center">Transactions</TableHead>
                            <TableHead className="text-right font-semibold">Total Volume</TableHead>
                            <TableHead className="text-right font-semibold">Paid Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {payments.data?.map((method, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium uppercase text-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span>{method._id || 'Unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="font-normal text-[11px]">
                                  {method.transactionCount || 0} txns
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(method.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(method.paidAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!payments.data?.length && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center h-32">
                                <EmptyState
                                  title="No Payment Records"
                                  description="No payment methods activity detected in this period."
                                  icon={CreditCard}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {reportsConfig.enabledTabs.includes('inventory') && (
              <TabsContent value="inventory" className="space-y-5 outline-none">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <Card className="border shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Inventory Valuation
                      </CardTitle>
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Boxes className="w-4 h-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight text-foreground">
                        {formatCurrency(inventory.data?.totalValuation)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total catalog stock value</p>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Out of Stock Items
                      </CardTitle>
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                        {inventory.data?.outOfStockCount || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Products requiring urgent restock</p>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Low Stock Items
                      </CardTitle>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                        {inventory.data?.lowStockCount || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Products nearing depletion</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">Low Stock & Out of Stock Alerts</CardTitle>
                        <CardDescription className="text-xs">
                          Active inventory stock warnings for simple and variant items.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {inventory.data?.alerts?.length || 0} alerts active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead className="font-semibold">Product Name</TableHead>
                          <TableHead className="font-semibold">SKU</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="text-right font-semibold">Current Stock</TableHead>
                          <TableHead className="text-right font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {inventory.data?.alerts?.map((alert, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-foreground max-w-sm truncate">
                              {alert.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">
                              {alert.sku || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[10px]">
                                {alert.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <span className={alert.stock === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                                {alert.stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={alert.stock === 0 ? 'destructive' : 'secondary'}
                                className={alert.stock > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : ''}
                              >
                                {alert.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!inventory.data?.alerts?.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-32">
                              <div className="flex flex-col items-center justify-center p-6 text-center">
                                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                                  <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">All Inventory Healthy</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  All products and variants are well above stock threshold levels.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ReportsV2Page;
