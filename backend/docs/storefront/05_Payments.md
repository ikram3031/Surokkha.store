# Storefront Payments API

The Storefront Payments API allows customers and frontend checkout flows to initialize payments, submit transaction identifiers (e.g. bKash/Nagad TrxID), and verify transaction statuses.

## Base URL
```text
http://localhost:4001/api/v1/payments
```

---

## Endpoints

### 1. Initialize / Record Payment
Creates a payment transaction record linked to a customer order.

- **Method:** `POST`
- **Path:** `/api/v1/payments`
- **Auth:** Optional / Public

#### Request Body
```json
{
  "orderId": "66f4a8c9b3f8e3a5c1d2e7f5",
  "amount": 1410,
  "method": "bkash",
  "transactionId": "TRX998877",
  "paymentPhone": "01812345678",
  "status": "pending"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f6",
    "did": "pay-001",
    "orderId": "66f4a8c9b3f8e3a5c1d2e7f5",
    "amount": 1410,
    "method": "bkash",
    "transactionId": "TRX998877",
    "status": "pending",
    "createdAt": "2026-09-26T15:35:00.000Z"
  }
}
```

---

### 2. Get Payment Status
Retrieves details and verification status of a payment transaction by its ID.

- **Method:** `GET`
- **Path:** `/api/v1/payments/:paymentId`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f6",
    "did": "pay-001",
    "orderId": "66f4a8c9b3f8e3a5c1d2e7f5",
    "amount": 1410,
    "method": "bkash",
    "transactionId": "TRX998877",
    "status": "pending"
  }
}
```
