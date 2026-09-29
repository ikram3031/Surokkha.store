# Reports & Business Intelligence API Documentation

This document describes all administrative financial, sales timeline, top performing products, payment method distributions, and stock inventory valuation report endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/reports`

## Notes

- All reports endpoints require JWT authentication (`Authorization: Bearer <accessToken>`).
- Authorized Roles: `Owner`, `Admin`, `Manager`.
- Timezone: Evaluated using Bangladesh Standard Time (+06:00).

---

## 1. Summary Report

Returns high-level business intelligence aggregates including Gross Sales, Net Sales, Total Discount, Completed Orders count, Average Order Value (AOV), and POS vs Online sales breakdowns.

- **Method:** `GET`
- **URL:** `/api/v1/reports/summary`

### Query Parameters:
| Parameter | Type | Default | Allowed Values | Description |
|---|---|---|---|---|
| `range` | String | `30days` | `today`, `yesterday`, `7days`, `30days`, `thisMonth`, `lastMonth`, `thisYear` | Predefined date preset |
| `startDate` | String (YYYY-MM-DD) | - | - | Custom start date range |
| `endDate` | String (YYYY-MM-DD) | - | - | Custom end date range |
| `channel` | String | `all` | `all`, `online`, `pos` | Sales channel filter (`pos` matches orderNumber `IS...`) |

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "grossSales": 145000,
    "netSales": 138500,
    "totalDiscount": 6500,
    "totalOrders": 75,
    "onlineSales": 112000,
    "posSales": 26500,
    "aov": 1846.67
  }
}
```

---

## 2. Sales Timeline Report

Provides daily time-series grouping of Gross Sales, Net Sales, Discounts, and Orders Count for trend visualization and revenue line charts.

- **Method:** `GET`
- **URL:** `/api/v1/reports/sales-timeline`

### Query Parameters:
- Supports `range`, `startDate`, `endDate`, and `channel` filters.

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "2026-08-01",
      "grossSales": 4500,
      "netSales": 4200,
      "discount": 300,
      "ordersCount": 2
    },
    {
      "_id": "2026-08-02",
      "grossSales": 9200,
      "netSales": 8800,
      "discount": 400,
      "ordersCount": 5
    }
  ]
}
```

---

## 3. Top Products Report

Aggregates the best-selling products by total revenue and units sold across completed customer orders.

- **Method:** `GET`
- **URL:** `/api/v1/reports/top-products`

### Query Parameters:
- Supports `range`, `startDate`, `endDate`, and `channel` filters.

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "Sauvage Elixir Eau De Parfum",
      "sku": "DIOR-SE-100",
      "unitsSold": 24,
      "revenue": 44400
    },
    {
      "_id": "Bleu de Chanel EDP",
      "sku": "CHANEL-BDC-100",
      "unitsSold": 18,
      "revenue": 31500
    }
  ]
}
```

---

## 4. Payment Methods Report

Breaks down completed and recorded transaction volumes by payment method (e.g. COD, bKash, Nagad, Card).

- **Method:** `GET`
- **URL:** `/api/v1/reports/payment-methods`

### Query Parameters:
- Supports `range`, `startDate`, `endDate`, and `channel` filters.

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "Cash on Delivery (COD)",
      "totalAmount": 95000,
      "paidAmount": 95000,
      "transactionCount": 52
    },
    {
      "_id": "bkash",
      "totalAmount": 43500,
      "paidAmount": 43500,
      "transactionCount": 23
    }
  ]
}
```

---

## 5. Inventory Valuation & Low Stock Report

Analyzes real-time inventory valuation across simple and variant products, calculating overall catalog stock value, out-of-stock counts, and top 100 low-stock alert products.

- **Method:** `GET`
- **URL:** `/api/v1/reports/inventory`

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "totalValuation": 1850000,
    "lowStockCount": 14,
    "outOfStockCount": 3,
    "alerts": [
      {
        "name": "Tom Ford Tobacco Vanille 10ml Decant",
        "sku": "TF-TV-10ML",
        "type": "variant",
        "stock": 0,
        "status": "Out of Stock"
      },
      {
        "name": "Creed Aventus 100ml Full Bottle",
        "sku": "CRD-AV-100",
        "type": "simple",
        "stock": 2,
        "status": "Low Stock"
      }
    ]
  }
}
```
