# Dashboard API Documentation

This document describes all dashboard analytical and business intelligence endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/dashboard`

---

## 1. Daily Orders Count

Returns daily order counts for a recent date range (default last 30 days) grouped according to Bangladesh Time (+06:00). Useful for order timeline charts.

- **Method:** `GET`
- **URL:** `/api/v1/dashboard/orders/daily`
- **Authentication:** Not required

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `days` | Integer | No | `30` | Number of recent days to return (Minimum 1) |

### Success Response (200 OK)

```json
{
  "status": "success",
  "data": [
    { "date": "2026-07-24", "count": 2 },
    { "date": "2026-07-25", "count": 0 },
    { "date": "2026-07-26", "count": 5 }
  ]
}
```

---

## 2. Key Performance Indicators (KPI) & Comparison Trends

Returns total sales volume, completed orders, average order value (AOV), total registered members, and comparison percentage trends against the previous period.

- **Method:** `GET`
- **URL:** `/api/v1/dashboard/kpi`
- **Authentication:** Not required

### Query Parameters

| Parameter | Type | Required | Default | Allowed Values |
|---|---|---|---|---|
| `range` | String | No | `30days` | `today`, `7days`, `30days`, `3months` |

### Success Response (200 OK)

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
      "aov": "6.7",
      "members": "22.5"
    }
  }
}
```

---

## 3. Order Status Distribution

Returns counts of orders broken down by status within the specified time range.

- **Method:** `GET`
- **URL:** `/api/v1/dashboard/orders/status-distribution`
- **Authentication:** Not required

### Query Parameters

| Parameter | Type | Required | Default | Allowed Values |
|---|---|---|---|---|
| `range` | String | No | `30days` | `today`, `7days`, `30days`, `3months` |

### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "statusCounts": {
      "processing": 14,
      "shipped": 8,
      "completed": 120,
      "cancelled": 3
    }
  }
}
```

