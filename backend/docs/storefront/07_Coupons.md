# Storefront Coupons API

The Storefront Coupons API enables customers to discover public promotional coupon codes, inspect discount details, and validate coupon codes during the checkout process.

## Base URL
```text
http://localhost:4001/api/v1/coupons
```

---

## Endpoints

### 1. List Public Active Coupons
Retrieves promotional coupons currently available to customers.

- **Method:** `GET`
- **Path:** `/api/v1/coupons`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f8",
      "did": "cpn-001",
      "code": "DISCOUNT10",
      "discountType": "percentage",
      "discountAmount": 10,
      "minimumSpend": 500,
      "isActive": true,
      "expiryDate": "2026-10-31T23:59:59.000Z"
    }
  ]
}
```

---

### 2. Get Coupon by ID or Code
Retrieves specific coupon discount details and terms by code or ID.

- **Method:** `GET`
- **Path:** `/api/v1/coupons/:id`
- **Auth:** None (Public)

#### Example Request
```http
GET /api/v1/coupons/DISCOUNT10
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f8",
    "did": "cpn-001",
    "code": "DISCOUNT10",
    "discountType": "percentage",
    "discountAmount": 10,
    "minimumSpend": 500,
    "isActive": true,
    "expiryDate": "2026-10-31T23:59:59.000Z"
  }
}
```
