# Orders API Documentation

This document describes all available order endpoints for the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Endpoints

### Create a new order

**Method:** POST

**URL:** `/api/v1/orders/new-order`

**Authentication:** Not required

### Request Body

```json
{
  "billingInfo": {
    "fullName": "Nadia Rahman",
    "phone": "+8801712345678",
    "email": "customer@example.com",
    "address": "House 12, Road 3",
    "thana": "Dhanmondi",
    "district": "Dhaka",
    "zip": "1209"
  },
  "shippingInfo": {
    "fullName": "Nadia Rahman",
    "phone": "+8801712345678",
    "address": "House 12, Road 3",
    "thana": "Dhanmondi",
    "district": "Dhaka",
    "zip": "1209"
  },
  "paymentMethod": "cod",
  "subtotal": 1200,
  "shippingFee": 100,
  "tax": 96,
  "total": 1396,
  "items": [
    {
      "name": "Oud Imperial",
      "quantity": 1,
      "unitPrice": 1200,
      "size": "100ml",
      "concentration": "Eau de Parfum"
    }
  ]
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Order received successfully",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "orderNumber": "ORD-20260719-123456",
    "status": "processing",
    "billingInfo": {
      "fullName": "Nadia Rahman",
      "phone": "+8801712345678",
      "email": "customer@example.com",
      "address": "House 12, Road 3",
      "thana": "Dhanmondi",
      "district": "Dhaka",
      "zip": "1209"
    },
    "shippingInfo": {
      "fullName": "Nadia Rahman",
      "phone": "+8801712345678",
      "address": "House 12, Road 3",
      "thana": "Dhanmondi",
      "district": "Dhaka",
      "zip": "1209"
    },
    "paymentMethod": "cod",
    "items": [
      {
        "name": "Oud Imperial",
        "quantity": 1,
        "unitPrice": 1200,
        "size": "100ml",
        "concentration": "Eau de Parfum"
      }
    ],
    "totals": {
      "subtotal": 1200,
      "shippingFee": 100,
      "tax": 96,
      "total": 1396
    },
    "createdAt": "2026-07-19T10:00:00.000Z",
    "updatedAt": "2026-07-19T10:00:00.000Z"
  }
}
```

### List orders

**Method:** GET

**URL:** `/api/v1/orders`

**Authentication:** Required

**Headers:**

```http
Authorization: Bearer <accessToken>
```

### Query Parameters

- `page` (optional) - page number, default `1`
- `limit` (optional) - items per page, default `20`
- `status` (optional) - filter by order status
- `email` (optional) - filter by customer email

### Success Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "orderNumber": "ORD-20260719-123456",
      "status": "processing",
      "billingInfo": {
        "fullName": "Nadia Rahman",
        "phone": "+8801712345678",
        "email": "customer@example.com",
        "address": "House 12, Road 3",
        "thana": "Dhanmondi",
        "district": "Dhaka",
        "zip": "1209"
      },
      "shippingInfo": {
        "fullName": "Nadia Rahman",
        "phone": "+8801712345678",
        "address": "House 12, Road 3",
        "thana": "Dhanmondi",
        "district": "Dhaka",
        "zip": "1209"
      },
      "paymentMethod": "cod",
      "items": [
        {
          "name": "Oud Imperial",
          "quantity": 1,
          "unitPrice": 1200,
          "size": "100ml",
          "concentration": "Eau de Parfum"
        }
      ],
      "totals": {
        "subtotal": 1200,
        "shippingFee": 100,
        "tax": 96,
        "total": 1396
      },
      "createdAt": "2026-07-19T10:00:00.000Z",
      "updatedAt": "2026-07-19T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get order by ID

**Method:** GET

**URL:** `/api/v1/orders/:orderId`

**Authentication:** Required

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "orderNumber": "ORD-20260719-123456",
    "status": "processing",
    "billingInfo": {
      "fullName": "Nadia Rahman",
      "phone": "+8801712345678",
      "email": "customer@example.com",
      "address": "House 12, Road 3",
      "thana": "Dhanmondi",
      "district": "Dhaka",
      "zip": "1209"
    },
    "shippingInfo": {
      "fullName": "Nadia Rahman",
      "phone": "+8801712345678",
      "address": "House 12, Road 3",
      "thana": "Dhanmondi",
      "district": "Dhaka",
      "zip": "1209"
    },
    "paymentMethod": "cod",
    "items": [
      {
        "name": "Oud Imperial",
        "quantity": 1,
        "unitPrice": 1200,
        "size": "100ml",
        "concentration": "Eau de Parfum"
      }
    ],
    "totals": {
      "subtotal": 1200,
      "shippingFee": 100,
      "tax": 96,
      "total": 1396
    },
    "createdAt": "2026-07-19T10:00:00.000Z",
    "updatedAt": "2026-07-19T10:00:00.000Z"
  }
}
```

### Get order invoice printable HTML view

Renders a styled, responsive printable HTML invoice view for the order.

**Method:** GET

**URL:** `/api/v1/orders/:orderId/invoice`

**Authentication:** Not required (Used directly in customer order emails and links)

---

### Update order

**Method:** PUT

**URL:** `/api/v1/orders/:orderId`

**Authentication:** Required (Owner, Admin, Manager)

### Request Body Examples

Update status:

```json
{
  "status": "processing"
}
```

Update shipping info:

```json
{
  "shippingInfo": {
    "fullName": "Nadia Rahman",
    "phone": "+8801712345678",
    "address": "House 14, Road 7",
    "thana": "Dhanmondi",
    "district": "Dhaka",
    "zip": "1209"
  }
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "status": "processing",
    "updatedAt": "2026-07-19T11:00:00.000Z"
  }
}
```

---

### Delete order

Soft deletes an order (`active: false`) and cleans up linked member totals and payment documents.

**Method:** DELETE

**URL:** `/api/v1/orders/:orderId`

**Authentication:** Required (Owner, Admin)

### Success Response

```json
{
  "status": "success",
  "message": "Order deleted successfully"
}
```

---

### Bulk Update Orders

Updates status and/or paymentStatus for multiple orders in bulk.

**Method:** POST

**URL:** `/api/v1/orders/bulk-update`

**Authentication:** Required (Owner, Admin, Manager)

**Headers:**
```http
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "ids": ["64a8c9b3f8e3a5c1d2e7f0a1", "ORD-20260719-123456"],
  "status": "completed",
  "paymentStatus": "paid"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Orders updated successfully"
}
```

---

### Bulk Delete Orders

Soft deletes multiple orders in bulk and cleans up linked member totals and payment records.

**Method:** POST

**URL:** `/api/v1/orders/bulk-delete`

**Authentication:** Required (Owner, Admin)

**Headers:**
```http
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "ids": ["64a8c9b3f8e3a5c1d2e7f0a1", "ORD-20260719-123456"]
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Orders deleted successfully"
}
```

---

## Notes

- `POST /api/v1/orders/new-order` is public and used for storefront checkout submission.
- `GET /api/v1/orders/:orderId/invoice` is public to allow customers to view / print their invoice from emails.
- All other order endpoints require a valid JWT access token with appropriate role privileges.
- Supported order statuses: `received`, `processing`, `shipped`, `completed`, `cancelled`.
