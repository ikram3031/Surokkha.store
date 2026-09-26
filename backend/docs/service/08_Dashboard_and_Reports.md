# Service Dashboard Analytics & Reports API

The Dashboard Analytics & Reports API provides real-time e-commerce performance metrics, KPI indicators, order distribution breakdowns, sales revenue timelines, top-selling product aggregates, and inventory reports.

## Base URLs
```text
http://localhost:4002/api/v1/dashboard
http://localhost:4002/api/v1/reports
```

---

## 1. Dashboard Real-Time Analytics

### 1.1 Daily Order Counts
Returns daily order tallies grouped by Bangladesh Standard Time (+06:00) for timeline charts.

- **Method:** `GET`
- **Path:** `/api/v1/dashboard/orders/daily?days=30`
- **Auth:** Public / Internal

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    { "date": "2026-09-24", "count": 14 },
    { "date": "2026-09-25", "count": 22 },
    { "date": "2026-09-26", "count": 18 }
  ]
}
```

---

### 1.2 Order Status Distribution
Returns breakdown of orders by status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).

- **Method:** `GET`
- **Path:** `/api/v1/dashboard/orders/status-distribution?range=30days`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "pending": 5,
    "confirmed": 12,
    "shipped": 8,
    "delivered": 45,
    "cancelled": 2
  }
}
```

---

### 1.3 Key Performance Indicators (KPIs)
Returns revenue, completed orders count, Average Order Value (AOV), and growth percentage trends.

- **Method:** `GET`
- **Path:** `/api/v1/dashboard/kpi?range=30days`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "sales": 184500,
    "completedOrders": 92,
    "aov": 2005.43,
    "members": 35,
    "trends": {
      "sales": "15.4",
      "orders": "8.2",
      "aov": "6.7"
    }
  }
}
```

---

## 2. Business Reports Endpoints

> **Auth Requirement:** All `/api/v1/reports` endpoints require `Owner`, `Admin`, `Manager`, or `Super Admin` role.

### 2.1 Sales Summary Report
- **Method:** `GET`
- **Path:** `/api/v1/reports/summary?startDate=2026-09-01&endDate=2026-09-26`

### 2.2 Sales Timeline Report
- **Method:** `GET`
- **Path:** `/api/v1/reports/sales-timeline`

### 2.3 Top Selling Products Report
- **Method:** `GET`
- **Path:** `/api/v1/reports/top-products?limit=10`

### 2.4 Payment Methods Breakdown Report
- **Method:** `GET`
- **Path:** `/api/v1/reports/payment-methods`

### 2.5 Inventory & Low Stock Report
- **Method:** `GET`
- **Path:** `/api/v1/reports/inventory`
