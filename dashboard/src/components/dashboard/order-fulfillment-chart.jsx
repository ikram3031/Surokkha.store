import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderCounts } from "@/hooks/use-order-counts";

export const description = "An interactive area chart comparing placed and delivered orders";

const chartConfig = {
  orders: {
    label: "Orders",
  },
  placed: {
    label: "Placed Orders",
    color: "#3b82f6",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
  delivered: {
    label: "Delivered Orders",
    color: "#10b981",
    theme: {
      light: "#059669",
      dark: "#34d399",
    },
  },
};

export function OrderFulfillmentChart() {
  const { t, i18n } = useTranslation();
  const [timeRange, setTimeRange] = React.useState("90d");

  // Fetch 90 days of daily order stats (returns { date, count, placed, delivered })
  const { data: rawData = [], isLoading } = useOrderCounts(90);

  const locale = i18n.language?.startsWith("bn") ? "bn-BD" : "en-US";

  // Filter last N days from the 90-day sorted dataset
  const filteredData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    let daysToTake = 90;
    if (timeRange === "30d") {
      daysToTake = 30;
    } else if (timeRange === "7d") {
      daysToTake = 7;
    }
    return rawData.slice(-daysToTake).map((item) => ({
      date: item.date,
      placed: Number(item.placed || 0),
      delivered: Number(item.delivered || 0),
    }));
  }, [rawData, timeRange]);

  // Summary aggregation metrics for badges
  const summary = React.useMemo(() => {
    const totalPlaced = filteredData.reduce((acc, curr) => acc + (curr.placed || 0), 0);
    const totalDelivered = filteredData.reduce((acc, curr) => acc + (curr.delivered || 0), 0);
    const deliveryRate = totalPlaced > 0 ? Math.round((totalDelivered / totalPlaced) * 100) : 0;
    return { totalPlaced, totalDelivered, deliveryRate };
  }, [filteredData]);

  const rangeDescription = React.useMemo(() => {
    if (timeRange === "7d") {
      return t("overview.range_desc_7d", "Showing placed vs delivered orders for the last 7 days (cancelled & fake excluded)");
    }
    if (timeRange === "30d") {
      return t("overview.range_desc_30d", "Showing placed vs delivered orders for the last 30 days (cancelled & fake excluded)");
    }
    return t("overview.range_desc_90d", "Showing placed vs delivered orders for the last 3 months (cancelled & fake excluded)");
  }, [timeRange, t]);

  if (isLoading) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b py-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-36" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b py-4 sm:py-5">
        <div className="grid flex-1 gap-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-center sm:text-left">
              {t("overview.orders_placed_vs_delivered", "Orders: Placed vs Delivered")}
            </CardTitle>
            <div className="hidden sm:flex items-center gap-1.5 sm:ml-2">
              <Badge variant="outline" className="text-[11px] font-medium border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                {t("overview.placed", "Placed")}: {summary.totalPlaced.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                {t("overview.delivered", "Delivered")}: {summary.totalDelivered.toLocaleString()} ({summary.deliveryRate}%)
              </Badge>
            </div>
          </div>
          <CardDescription className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
            {rangeDescription}
          </CardDescription>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          {/* Mobile: compact percentage chips beside the range picker */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] font-medium border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
              {t("overview.placed", "Placed")}: {summary.totalPlaced > 0 ? 100 : 0}%
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              {t("overview.delivered", "Delivered")}: {summary.deliveryRate}%
            </Badge>
          </div>
          <Select value={timeRange} onValueChange={(val) => val && setTimeRange(val)}>
            <SelectTrigger
              className="w-[125px] sm:w-[160px] rounded-lg"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t("overview.last_3_months", "Last 3 months")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("overview.last_30_days", "Last 30 days")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t("overview.last_7_days", "Last 7 days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] sm:h-[280px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPlaced" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-placed, #3b82f6)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-placed, #3b82f6)"
                  stopOpacity={0.03}
                />
              </linearGradient>
              <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-delivered, #10b981)"
                  stopOpacity={0.65}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-delivered, #10b981)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              fontSize={11}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="placed"
              type="natural"
              fill="url(#fillPlaced)"
              stroke="var(--color-placed, #3b82f6)"
              strokeWidth={2}
            />
            <Area
              dataKey="delivered"
              type="natural"
              fill="url(#fillDelivered)"
              stroke="var(--color-delivered, #10b981)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Named alias to match user prompt snippet
export const ChartAreaInteractive = OrderFulfillmentChart;
export default OrderFulfillmentChart;
