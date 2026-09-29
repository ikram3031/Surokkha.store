# System Metadata API

**Base Prefix**: `/api/v1/system`

Purpose: Provides dynamic runtime and client configuration metadata (such as order statuses, payment statuses, and product categories) fetched directly from the database schema settings.

---

## 1. Retrieve System Metadata

**Endpoint**: `GET /metadata`

Returns list of available order statuses, payment statuses, and categories configured in the system.

### Response (200):
```json
{
  "status": "success",
  "data": {
    "orderStatuses": [
      {
        "did": "order-status-processing",
        "name": "Processing",
        "slug": "processing"
      },
      {
        "did": "order-status-shipped",
        "name": "Shipped",
        "slug": "shipped"
      },
      {
        "did": "order-status-completed",
        "name": "Completed",
        "slug": "completed"
      },
      {
        "did": "order-status-cancelled",
        "name": "Cancelled",
        "slug": "cancelled"
      }
    ],
    "paymentStatuses": [
      {
        "did": "payment-status-paid",
        "name": "Paid",
        "slug": "paid"
      },
      {
        "did": "payment-status-partial",
        "name": "Partial",
        "slug": "partial"
      },
      {
        "did": "payment-status-pending",
        "name": "Pending",
        "slug": "pending"
      },
      {
        "did": "payment-status-n-a",
        "name": "N-a",
        "slug": "n-a"
      }
    ],
    "categories": [
      {
        "did": "c5ab3a9d11e8d4a7",
        "name": "For Him",
        "slug": "for-him"
      },
      {
        "did": "3b23f4610b15517f",
        "name": "For Her",
        "slug": "for-her"
      }
    ]
  }
}
```

---

## Implementation Details:
- **Routes File**: [SystemRoute.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/routes/SystemRoute.js)
- **Controller File**: [SystemController.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/controllers/SystemController.js)
