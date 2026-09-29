# Coupons API Documentation

This document describes the coupon management endpoints available in the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Role Permissions

- **Owner/Admin:** can create, update, and delete coupons.
- **Manager:** can create and update coupons, but cannot delete them.
- **Public:** coupon list and coupon detail endpoints are public.

## Endpoints

### List all coupons

**Method:** GET

**URL:** `/api/v1/coupons`

**Authentication:** Not required

### Success Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10,
      "minOrderAmount": 500,
      "validFrom": "2026-08-01T00:00:00.000Z",
      "validTo": "2026-08-31T23:59:59.000Z",
      "active": true,
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

### Get coupon by ID, DID, or code

**Method:** GET

**URL:** `/api/v1/coupons/:id`

**Authentication:** Not required

### Example

```text
GET /api/v1/coupons/SAVE10
GET /api/v1/coupons/64a8c9b3f8e3a5c1d2e7f0a1
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderAmount": 500,
    "validFrom": "2026-08-01T00:00:00.000Z",
    "validTo": "2026-08-31T23:59:59.000Z",
    "active": true
  }
}
```

### Create a coupon

**Method:** POST

**URL:** `/api/v1/coupons`

**Authentication:** Required

**Headers:**

```http
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "code": "SAVE10",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 500,
  "validFrom": "2026-08-01T00:00:00.000Z",
  "validTo": "2026-08-31T23:59:59.000Z",
  "active": true,
  "usageLimit": 100,
  "applicableProducts": ["64a8c9b3f8e3a5c1d2e7f0a9"],
  "applicableCategories": ["64a8c9b3f8e3a5c1d2e7f0a8"],
  "applicableBrands": ["64a8c9b3f8e3a5c1d2e7f0a7"]
}
```

### Validation Rules

- `code` is required and will be converted to uppercase.
- `discountType` must be either `percentage` or `fixed`.
- `discountValue` must be a positive number.
- `discountValue` cannot exceed `100` for percentage coupons.
- `minOrderAmount` cannot be negative.
- `validTo` cannot be earlier than `validFrom`.
- `usageLimit` must be a positive number if set.
- `applicableProducts`, `applicableCategories`, and `applicableBrands` should be arrays of valid MongoDB Object IDs of respective entities. If set, the coupon will only apply to matching items.

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrderAmount": 500,
    "validFrom": "2026-08-01T00:00:00.000Z",
    "validTo": "2026-08-31T23:59:59.000Z",
    "active": true
  }
}
```

### Update a coupon

**Method:** PUT

**URL:** `/api/v1/coupons/:id`

**Authentication:** Required

**Headers:**

```http
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "discountValue": 15,
  "active": false
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 15,
    "minOrderAmount": 500,
    "active": false
  }
}
```

### Delete a coupon

**Method:** DELETE

**URL:** `/api/v1/coupons/:id`

**Authentication:** Required

**Headers:**

```http
Authorization: Bearer <accessToken>
```

### Success Response

```json
{
  "status": "success",
  "message": "Coupon deleted successfully"
}
```
