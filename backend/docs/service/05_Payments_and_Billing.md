# Service Payments & Billing Accounting API

The Service Payments & Billing API enables administrative oversight of customer payment transactions, reconciliation, refunds, batch processing, and corporate invoice accounting.

## Base URLs
```text
http://localhost:4002/api/v1/payments
http://localhost:4002/api/v1/billing
```

---

## 1. Payments Management Endpoints

> **Auth Requirement:** All endpoints require JWT Bearer token authentication.

### 1.1 List Payments
Retrieves paginated payment records with filtering by status, orderId, method, and date range.

- **Method:** `GET`
- **Path:** `/api/v1/payments`
- **Auth:** Required

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e805",
      "did": "pay-srv-001",
      "orderId": "66f4a8c9b3f8e3a5c1d2e804",
      "amount": 4560,
      "method": "bkash",
      "status": "completed",
      "transactionId": "TRX-SRV-001",
      "createdAt": "2026-09-26T15:00:00.000Z"
    }
  ]
}
```

---

### 1.2 Update Payment Record
- **Method:** `PUT`
- **Path:** `/api/v1/payments/:paymentId`
- **Auth:** Required

---

### 1.3 Bulk Update Payments
- **Method:** `POST`
- **Path:** `/api/v1/payments/bulk-update`
- **Auth:** Required

---

### 1.4 Bulk Delete Payments
- **Method:** `POST`
- **Path:** `/api/v1/payments/bulk-delete`
- **Auth:** Required

---

## 2. Billing & Invoicing Records

### 2.1 List Billing Records
- **Method:** `GET`
- **Path:** `/api/v1/billing`
- **Auth:** Required

### 2.2 Create Billing Record
- **Method:** `POST`
- **Path:** `/api/v1/billing`
- **Auth:** Required

#### Request Body
```json
{
  "customerName": "VIP Corporate Client",
  "customerEmail": "corporate@example.com",
  "orderId": "66f4a8c9b3f8e3a5c1d2e804",
  "amount": 4560,
  "status": "paid"
}
```

### 2.3 Get / Update / Delete Billing by ID
- `GET /api/v1/billing/:billingId`
- `PUT /api/v1/billing/:billingId`
- `DELETE /api/v1/billing/:billingId`
