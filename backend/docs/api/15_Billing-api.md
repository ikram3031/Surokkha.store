# Billing API Documentation

This document describes all available billing and transaction record endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Endpoints

### List billing records
Retrieves all historical billing records.

**Method:** GET

**URL:** `/api/v1/billing`

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <accessToken>
```

### Success Response
```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0c1",
      "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
      "amount": 2500,
      "status": "paid",
      "paymentMethod": "bkash",
      "createdAt": "2026-07-19T10:00:00.000Z"
    }
  ]
}
```

---

### Create a billing record
Registers a new billing transaction.

**Method:** POST

**URL:** `/api/v1/billing`

**Authentication:** Required

**Request Body:**
```json
{
  "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
  "amount": 2500,
  "paymentMethod": "bkash",
  "status": "paid"
}
```

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0c1",
    "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
    "amount": 2500,
    "status": "paid"
  }
}
```

---

### Get billing details by ID
Retrieves details of a specific billing record.

**Method:** GET

**URL:** `/api/v1/billing/:billingId`

**Authentication:** Required

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0c1",
    "orderId": "64a8c9b3f8e3a5c1d2e7f0a1",
    "amount": 2500,
    "status": "paid",
    "paymentMethod": "bkash"
  }
}
```

---

### Update billing status
Updates details or transaction reference of a billing record.

**Method:** PUT

**URL:** `/api/v1/billing/:billingId`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "refunded",
  "amount": 2500
}
```

### Success Response
```json
{
  "status": "success",
  "message": "Billing record updated successfully"
}
```

---

### Delete billing record
Deletes a billing entry.

**Method:** DELETE

**URL:** `/api/v1/billing/:billingId`

**Authentication:** Required

### Success Response
```json
{
  "status": "success",
  "message": "Billing record deleted successfully"
}
```
