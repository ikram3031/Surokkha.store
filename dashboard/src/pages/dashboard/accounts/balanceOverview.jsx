import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Receipt,
  CreditCard,
  Landmark,
  TrendingUp,
  TrendingDown,
  Scale,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  DollarSign,
  PlusCircle,
  FileText,
  Users,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useBillings } from '@/hooks/use-billings';
import { usePayments } from '@/hooks/use-payments';
import { useInvestments } from '@/hooks/use-investments';
import { useInvestors } from '@/hooks/use-investors';
import { DateRangeFilter, getDateRangeBounds } from '@/components/dashboard/accounts/DateRangeFilter';
import { Link } from 'react-router-dom';

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `৳${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border bg-popover/95 p-3.5 text-popover-foreground shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[190px]">
      <div className="font-semibold text-foreground border-b pb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          {label}
        </span>
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded"
              style={{ backgroundColor: entry.color || entry.stroke }}
            />
            <span className="text-muted-foreground font-medium">{entry.name}:</span>
          </div>
          <span className="font-bold text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const BalanceOverview = () => {
  const { t } = useTranslation();
  const [dateFilter, setDateFilter] = useState(() => getDateRangeBounds('thisMonth'));

  const { allBillings = [], isLoading: isLoadingBills } = useBillings();
  const { allPayments = [], isLoading: isLoadingPayments } = usePayments();
  const { allInvestments = [], isLoading: isLoadingInvestments } = useInvestments();
  const { allInvestors = [] } = useInvestors();

  // Helper to filter data by current date range
  const filterByRange = (items, dateGetter) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return items;
    const start = dateFilter.startDate ? new Date(dateFilter.startDate).getTime() : 0;
    const end = dateFilter.endDate ? new Date(dateFilter.endDate).getTime() + 86400000 : Infinity;

    return items.filter((item) => {
      const d = new Date(dateGetter(item)).getTime();
      return d >= start && d <= end;
    });
  };

  const filteredBills = useMemo(
    () => filterByRange(allBillings, (b) => b.billingDate || b.date || b.createdAt),
    [allBillings, dateFilter]
  );

  const filteredPayments = useMemo(
    () => filterByRange(allPayments, (p) => p.date || p.createdAt),
    [allPayments, dateFilter]
  );

  const filteredInvestments = useMemo(
    () => filterByRange(allInvestments, (inv) => inv.takenDate || inv.createdAt),
    [allInvestments, dateFilter]
  );

  // 1. Top Section - 4 Metrics
  const totalReceipt = useMemo(() => {
    return filteredPayments.reduce((sum, p) => {
      const isPaid = p.status === 'Completed' || p.status === 'Paid';
      const amt = Number(p.paidAmount !== undefined ? p.paidAmount : isPaid ? p.amount : 0);
      return sum + (amt || 0);
    }, 0);
  }, [filteredPayments]);

  const totalBills = useMemo(() => {
    return filteredBills.reduce((sum, b) => {
      const isPaid = b.status === 'Paid' || b.status === 'Completed';
      const amt = Number(b.paidAmount !== undefined && b.paidAmount > 0 ? b.paidAmount : isPaid ? b.totalAmount : b.totalAmount || b.amount || 0);
      return sum + (amt || 0);
    }, 0);
  }, [filteredBills]);

  const totalInvestmentsTaken = useMemo(() => {
    return filteredInvestments.reduce((sum, inv) => sum + (Number(inv.takenAmount) || 0), 0);
  }, [filteredInvestments]);

  const totalInvestmentsReturned = useMemo(() => {
    return filteredInvestments.reduce((sum, inv) => sum + (Number(inv.returnedAmount) || 0), 0);
  }, [filteredInvestments]);

  const netInvestmentsTaken = Math.max(0, totalInvestmentsTaken - totalInvestmentsReturned);

  // Total Cash Balance = (Total Receipts + Total Investments Taken) - Total Bills
  const totalCashBalance = totalReceipt + totalInvestmentsTaken - totalBills;

  // Operating Balance: Total Payments - Total Bills
  const operatingBalance = totalReceipt - totalBills;

  // Second Section - Business Asset Calculation
  // Business Asset = Total Cash Balance - Net Outstanding Investments
  const businessAsset = totalCashBalance - netInvestmentsTaken;

  // Chart Data Generator: Daily breakdown of Payments and Bills
  const chartData = useMemo(() => {
    const dayMap = {};

    // Populate timeline entries
    filteredPayments.forEach((p) => {
      const day = (p.date || p.createdAt || '').slice(0, 10);
      if (!day) return;
      if (!dayMap[day]) dayMap[day] = { date: day, payments: 0, bills: 0 };
      const isPaid = p.status === 'Completed' || p.status === 'Paid';
      const amt = Number(p.paidAmount !== undefined ? p.paidAmount : isPaid ? p.amount : 0);
      dayMap[day].payments += amt;
    });

    filteredBills.forEach((b) => {
      const day = (b.billingDate || b.date || b.createdAt || '').slice(0, 10);
      if (!day) return;
      if (!dayMap[day]) dayMap[day] = { date: day, payments: 0, bills: 0 };
      const isPaid = b.status === 'Paid' || b.status === 'Completed';
      const amt = Number(b.paidAmount !== undefined && b.paidAmount > 0 ? b.paidAmount : isPaid ? b.totalAmount : b.totalAmount || b.amount || 0);
      dayMap[day].bills += amt;
    });

    const sortedDays = Object.keys(dayMap).sort();
    return sortedDays.map((d) => ({
      date: d,
      payments: dayMap[d].payments,
      bills: dayMap[d].bills,
    }));
  }, [filteredPayments, filteredBills]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header Bar with Title and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {t('accounts.balance_overview_title', 'Account Balance & Financial Overview')}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {t('accounts.balance_overview_subtitle', 'Real-time financial metrics, business asset calculation, receipts, and expense tracking.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangeFilter
            value="thisMonth"
            onChange={(range) => setDateFilter(range)}
          />
        </div>
      </div>

      {/* Top Section - 4 Metric Cards (4 Columns) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Receipt */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-emerald-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('accounts.total_receipt', 'Total Receipt')}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalReceipt)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>{filteredPayments.length} transactions received</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Bills */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('accounts.total_bills', 'Total Bills & Returns')}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalBills)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{filteredBills.length} bills in range</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Total Investments */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-purple-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('accounts.total_investments', 'Total Investments')}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatCurrency(totalInvestmentsTaken)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
              <span>Outstanding Due: {formatCurrency(netInvestmentsTaken)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Total Cash Balance (Receipts + Investments - Bills) */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-blue-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('accounts.total_cash_balance', 'Total Cash Balance')}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className={`text-2xl font-bold tracking-tight ${totalCashBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalCashBalance)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Badge
                variant="outline"
                className={totalCashBalance >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}
              >
                {totalCashBalance >= 0 ? t('accounts.surplus', 'Surplus') : t('accounts.deficit', 'Deficit')}
              </Badge>
              <span className="text-muted-foreground text-[11px]">(Receipts + Investments) − Bills</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Section - 2 Columns */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column (5 Cols): Business Asset Calculation Section */}
        <Card className="lg:col-span-5 border-border/70 shadow-sm bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    {t('accounts.business_asset', 'Business Asset Valuation')}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t('accounts.business_asset_desc', 'True retained business capital after deducting outstanding external investor obligations')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5 flex-1 flex flex-col justify-between">
            {/* Step-by-step Visual Formula Breakdown */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>1. {t('accounts.total_receipt', 'Total Customer Receipts')}</span>
                  <span className="font-bold text-emerald-600 font-mono">+{formatCurrency(totalReceipt)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>2. {t('accounts.investments_taken', 'Investments Taken (Capital In)')}</span>
                  <span className="font-bold text-purple-600 font-mono">+{formatCurrency(totalInvestmentsTaken)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>3. {t('accounts.total_bills', 'Total Bills & Repayments (Outflow)')}</span>
                  <span className="font-bold text-red-600 font-mono">−{formatCurrency(totalBills)}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex items-center justify-between font-semibold text-foreground">
                  <span>= {t('accounts.total_cash_balance', 'Total Cash Balance in Hand')}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(totalCashBalance)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Investments Taken:</span>
                  <span className="font-bold text-purple-600 font-mono">{formatCurrency(totalInvestmentsTaken)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Investments Returned:</span>
                  <span className="font-bold text-emerald-600 font-mono">−{formatCurrency(totalInvestmentsReturned)}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex items-center justify-between font-semibold text-foreground">
                  <span>= {t('accounts.net_investments_taken', 'Net Investor Due Obligation')}</span>
                  <span className="font-mono text-purple-600">{formatCurrency(netInvestmentsTaken)}</span>
                </div>
              </div>
            </div>

            {/* True Business Asset Highlight Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-inner space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {t('accounts.true_business_asset', 'True Business Asset (Retained Capital)')}
                </span>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  Net Capital
                </Badge>
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {formatCurrency(businessAsset)}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                {t('accounts.asset_explanation', 'Deducting outstanding investor debt from total cash balance reflects the store’s actual self-owned equity & retained earnings.')}
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
              <Link
                to="/dashboard/accounts/bills"
                className="p-2 rounded-lg bg-muted/40 hover:bg-muted/80 text-[11px] font-semibold text-foreground transition-all flex flex-col items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>All Bills</span>
              </Link>
              <Link
                to="/dashboard/accounts/payments"
                className="p-2 rounded-lg bg-muted/40 hover:bg-muted/80 text-[11px] font-semibold text-foreground transition-all flex flex-col items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>All Payments</span>
              </Link>
              <Link
                to="/dashboard/accounts/investments"
                className="p-2 rounded-lg bg-muted/40 hover:bg-muted/80 text-[11px] font-semibold text-foreground transition-all flex flex-col items-center gap-1"
              >
                <Landmark className="w-3.5 h-3.5 text-purple-500" />
                <span>Investments</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (7 Cols): Interactive Graphs using Recharts */}
        <Card className="lg:col-span-7 border-border/70 shadow-sm bg-card overflow-hidden flex flex-col">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  {t('accounts.chart_title', 'Payments & Bills Timeline')}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t('accounts.chart_subtitle', 'Comparative daily trends of cash inflows (payments) versus cash outflows (bills)')}
                </CardDescription>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Payments (Green)
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2.5 h-2.5 rounded bg-red-500" /> Bills (Red)
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-6 flex-1 min-h-[360px] flex flex-col justify-center">
            {chartData.length === 0 ? (
              <div className="h-[340px] flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
                <Scale className="w-8 h-8 opacity-30" />
                <p>No payment or bill transactions found for the selected date range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paymentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="billsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      const d = new Date(val);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="payments"
                    name="Payments (Inflow)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#paymentsGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="bills"
                    name="Bills (Outflow)"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#billsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceOverview;
