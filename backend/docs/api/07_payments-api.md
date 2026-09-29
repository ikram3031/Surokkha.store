# Payments API Documentation

This document describes all available payment endpoints for the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/payments`

## Notes

- All payment endpoints require authentication.
- Include the access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

## Endpoints

### Create a payment record

**Method:** POST

**URL:** `/api/v1/payments`

**Authentication:** Required

### Request Body

```json
{
  "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
  "paymentMethod": "bkash",
  "paymentPhone": "+8801712345678",
  "amount": 1200,
  "status": "completed"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "id": "64b1e0d7a6d02d37c2be1f3a",
    "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
    "did": "payment-did-123",
    "paymentMethod": "bkash",
    "paymentPhone": "+8801712345678",
    "amount": 1200,
    "status": "completed",
    "createdBy": "64b1e0a1a6d02d37c2be1f39",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

---

### List payments

**Method:** GET

**URL:** `/api/v1/payments`

**Authentication:** Required

### Query Parameters

- `page` (optional) - page number, default `1`
- `limit` (optional) - items per page, default `20`
- `orderId` (optional) - filter by order ID
- `status` (optional) - filter by payment status (`pending`, `completed`, `failed`)

### Success Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "64b1e0d7a6d02d37c2be1f3a",
      "orderId": { ... },
      "did": "payment-did-123",
      "paymentMethod": "bkash",
      "paymentPhone": "+8801712345678",
      "amount": 1200,
      "status": "completed",
      "createdAt": "2026-07-31T12:00:00.000Z"
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

---

### Get payment by ID

**Method:** GET

**URL:** `/api/v1/payments/:paymentId`

**Authentication:** Required

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64b1e0d7a6d02d37c2be1f3a",
    "orderId": { ... },
    "did": "payment-did-123",
    "paymentMethod": "bkash",
    "paymentPhone": "+8801712345678",
    "amount": 1200,
    "status": "completed",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

---

### Update payment

**Method:** PUT

**URL:** `/api/v1/payments/:paymentId`

**Authentication:** Required

### Request Body Examples

Update status:

```json
{
  "status": "failed"
}
```

Update payment method:

```json
{
  "paymentMethod": "nagad",
  "paymentPhone": "+8801812345678"
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64b1e0d7a6d02d37c2be1f3a",
    "status": "failed",
    "updatedAt": "2026-07-31T13:00:00.000Z"
  }
}
```

---

### Delete payment

**Method:** DELETE

**URL:** `/api/v1/payments/:paymentId`

**Authentication:** Required

### Success Response

```json
{
  "status": "success",
  "message": "Payment record deleted successfully"
}
```

---

### Bulk Update Payments

Batch updates payment status and recalculates paid/pending amounts for multiple payment records by payment ID or order ID.

**Method:** POST

**URL:** `/api/v1/payments/bulk-update`

**Authentication:** Required

**Request Body Example:**

```json
{
  "ids": ["64b1e0d7a6d02d37c2be1f3a"],
  "status": "paid"
}
```

Or by associated Order IDs:

```json
{
  "orderIds": ["64a8c9b3f8e3a5c1d2e7f0a1"],
  "status": "paid"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Payments updated successfully"
}
```

---

### Bulk Delete Payments

Batch deletes multiple payment records by ID or DID.

**Method:** POST

**URL:** `/api/v1/payments/bulk-delete`

**Authentication:** Required

**Request Body Example:**

```json
{
  "ids": ["64b1e0d7a6d02d37c2be1f3a", "payment-did-123"]
}
```

### Success Response

```json
{
  "status": "success",
  "message": "2 payment records deleted successfully"
}
```

---

## Supported Payment Methods

- `cash` / `Cash on Delivery (COD)` – Cash payment
- `card` – Card payment
- `bkash` – bKash mobile banking (requires `paymentPhone`)
- `nagad` – Nagad mobile banking (requires `paymentPhone`)
- `rocket` – Rocket mobile banking

## Supported Payment Statuses

- `pending` – Payment awaiting confirmation
- `partial` – Partial payment received
- `paid` / `completed` – Payment successfully received in full
- `failed` – Payment failed or reversed
