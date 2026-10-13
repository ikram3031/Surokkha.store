# 17. Dashboard Overview: Interactive Order Fulfillment Area Chart (Placed vs Delivered)

## 1. Overview & Objective
In e-commerce management, tracking raw order counts alone does not provide sufficient visibility into fulfillment health. Cancelled and fake orders artificially inflate metrics, while the true operational measure of success is the **cohort delivery conversion** (how many genuine placed orders actually get delivered).

This document outlines the implementation of the **Interactive Order Fulfillment Area Chart (`ChartAreaInteractive` / `OrderFulfillmentChart`)** placed directly above the Recent Orders table on the Dashboard Overview page. The chart visualizes **Total Valid Placed Orders** (excluding cancelled and fake orders) against **Delivered Orders** (completed orders) with interactive time-range filtering (`7d`, `30d`, `90d`).

---

## 2. Business & Data Logic

1. **Placed Orders (Genuine Demand):**
   - Represents all legitimate customer orders placed within each day.
   - **Exclusions:** Cancelled (`status === "cancelled"`) and fraudulent/fake (`status === "fake"`) orders are strictly excluded.
   - **Included Statuses:** `processing`, `shipped`, `completed`, `return`.

2. **Delivered Orders (Successful Fulfillment):**
   - Orders that have been successfully fulfilled and delivered (`status === "completed"`).

3. **Cohort Delivery Rate:**
   $$\text{Fulfillment Rate (\%)} = \left(\frac{\text{Total Delivered Orders}}{\text{Total Valid Placed Orders}}\right) \times 100$$
   - Displayed dynamically in the chart header badges for the active time range.

---

## 3. Backend Architecture

### 3.1 Aggregation Pipeline (`backend/src/service/controllers/DashboardController.js`)
Enhanced the `dailyOrders` endpoint to calculate `placed` and `delivered` metrics in a single database aggregation pass, while maintaining `count` for backward compatibility with the revenue line chart:

```javascript
export const dailyOrders = async (req, res, next) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '30', 10));

    // Bangladesh timezone (+06:00) alignment
    const OFFSET_MS = 6 * 60 * 60 * 1000;
    const nowLocal = new Date(Date.now() + OFFSET_MS);
    const todayLocal = new Date(nowLocal);
    todayLocal.setUTCHours(0, 0, 0, 0);
    const from = new Date(todayLocal.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - OFFSET_MS);

    const pipeline = [
      { $match: { active: { $ne: false }, createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } },
          count: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [
                { $in: ['$status', ['cancelled', 'fake']] },
                0,
                1,
              ],
            },
          },
          delivered: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id': 1 } },
    ];

    const agg = await OrderModel.aggregate(pipeline);
    const dataByDate = Object.fromEntries(
      agg.map((r) => [
        r._id,
        {
          count: r.count || 0,
          placed: r.placed || 0,
          delivered: r.delivered || 0,
        },
      ])
    );

    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000 + OFFSET_MS);
      const key = d.toISOString().slice(0, 10);
      const dayData = dataByDate[key] || { count: 0, placed: 0, delivered: 0 };
      result.push({
        date: key,
        count: dayData.count,
        placed: dayData.placed,
        delivered: dayData.delivered,
      });
    }

    return res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};
```

---

## 4. Frontend Architecture

### 4.1 Shadcn UI Chart Primitives (`dashboard/src/components/ui/chart.jsx`)
Created full shadcn chart primitive components compliant with React 19 and Tailwind CSS:
- `ChartContainer`: Manages responsive dimensions, context, and generates CSS variables (`--color-[key]`).
- `ChartStyle`: Injects theme-aware CSS styles for light and dark modes.
- `ChartTooltip` & `ChartTooltipContent`: Renders custom tooltips with date formatting, color dots, and localized values.
- `ChartLegend` & `ChartLegendContent`: Renders custom interactive chart legends with status dots.

### 4.2 Order Fulfillment Area Chart (`dashboard/src/components/dashboard/order-fulfillment-chart.jsx`)
Features:
- **Instant Client-Side Range Filtering:** Fetches 90 days of metrics in one lightweight request (`useOrderCounts(90)`) and slices the dataset client-side (`7d`, `30d`, `90d`), ensuring zero-latency range switching without loading flickers.
- **Overlay Gradient Presentation:**
  - **Placed Orders:** Vivid Blue (`#3b82f6` / `#2563eb`), fading from 45% opacity to 3%.
  - **Delivered Orders:** Emerald Green (`#10b981` / `#059669`), fading from 65% opacity to 5%.
  - Natural cubic spline curve (`type="natural"`) for smooth trend visualization.
  - Stack-free area overlay allowing direct visual comparison of delivery fulfillment within total demand.
- **Executive Metric Badges:** Quick header badges displaying current period totals and calculated delivery conversion percentage.
- **Responsive Layout:** Adaptive Select dropdown for desktop and mobile devices.

### 4.3 Overview Page Integration (`dashboard/src/pages/dashboard/overview.jsx`)
Positioned directly above `RecentTransactionsTable`:

```jsx
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <RevenueChart />
        <OrderStatusPie range="30days" />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <OrderFulfillmentChart />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <RecentTransactionsTable />
      </div>
```

---

## 5. File Synchronization & Verification

| File Path | Repository Sync | Description |
|---|---|---|
| `backend/src/service/controllers/DashboardController.js` | Both Repos | Enhanced aggregation for `placed` and `delivered` order counts |
| `dashboard/src/components/ui/chart.jsx` | Both Repos | New shared shadcn Chart UI components |
| `dashboard/src/components/dashboard/order-fulfillment-chart.jsx` | Both Repos | Interactive Placed vs Delivered area chart component |
| `dashboard/src/pages/dashboard/overview.jsx` | Both Repos | Overview layout update rendering chart above recent orders |

### Verification Results:
- **Backend Syntax Check:** `node --check` passed with 0 errors on both repositories.
- **Linter Check:** `npx oxlint` passed with **0 warnings and 0 errors**.
- **Dashboard Production Build:** `npm run build` (vite v8.2.1) compiled in **1.50s** with all 3,515 modules transformed.
