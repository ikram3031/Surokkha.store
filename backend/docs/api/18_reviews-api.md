# Reviews API Documentation

This document describes the product reviews management endpoints available in the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Role Permissions

- **Member/Customer:** Can create a review (one per product), update their own review, and delete their own review. If a member updates an approved review, its status is automatically reset to pending (`isApproved = false`).
- **Owner/Admin/Manager/Super Admin:** Can list all reviews, view any review, update any review, toggle approval status, and delete any review.
- **Public:** Can fetch approved reviews for a specific product along with rating statistics.

## Endpoints

### 1. Get Product Reviews (Public)

Fetches all approved reviews for a specific product along with aggregated rating statistics.

**Method:** GET

**URL:** `/api/v1/reviews/product/:productDid`

**Query Parameters:**
- `skip` (optional, default: 0)
- `limit` (optional, default: 10)

**Authentication:** Not required

**Success Response:**

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalReviews": 12,
      "averageRating": 4.58,
      "ratingBreakdown": {
        "5": 8,
        "4": 3,
        "3": 1,
        "2": 0,
        "1": 0
      }
    },
    "reviews": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "did": "8f3b...",
        "productDid": "prod_123",
        "rating": 5,
        "description": "Great quality!",
        "isApproved": true,
        "createdAt": "2026-08-19T10:00:00.000Z",
        "memberId": {
          "did": "mem_456",
          "name": "Customer Name",
          "email": "customer@example.com"
        }
      }
    ],
    "pagination": {
      "skip": 0,
      "limit": 10,
      "total": 12
    }
  }
}
```

### 2. List All Reviews (Admin Dashboard)

Fetches a paginated list of all reviews. Sorted by `updatedAt` descending.

**Method:** GET

**URL:** `/api/v1/reviews`

**Query Parameters:**
- `skip` (optional, default: 0)
- `limit` (optional, default: 20)
- `isApproved` (optional, boolean)
- `productDid` (optional, string)
- `memberDid` (optional, string)

**Authentication:** Required (Owner, Admin, Manager, Super Admin)

**Success Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "60d0fe4f5311236168a109ca",
      "did": "8f3b...",
      "productDid": "prod_123",
      "memberDid": "mem_456",
      "rating": 5,
      "description": "Great quality!",
      "isApproved": false,
      "createdAt": "2026-08-19T10:00:00.000Z",
      "updatedAt": "2026-08-19T12:00:00.000Z",
      "memberId": {
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "017...",
        "did": "mem_456"
      },
      "productId": {
        "name": "Product Name",
        "slug": "product-name",
        "imageUrl": "..."
      }
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 50
  }
}
```

### 3. Get Review by ID

Fetches details of a single review.

**Method:** GET

**URL:** `/api/v1/reviews/:id` (ID can be ObjectId or DID)

**Authentication:** Not required (but typically used for approved reviews)

**Success Response:**

```json
{
  "status": "success",
  "data": {
    "id": "60d0fe4f5311236168a109ca",
    "did": "8f3b...",
    "productDid": "prod_123",
    "rating": 4,
    "description": "Good product.",
    "isApproved": true,
    ...
  }
}
```

### 4. Create Review

Creates a new review. A member can only leave one review per product. The review is initially pending (`isApproved: false`).

**Method:** POST

**URL:** `/api/v1/reviews`

**Authentication:** Required (Member/User)

**Body:**

```json
{
  "productDid": "prod_123",
  "rating": 5,
  "description": "Excellent value for money!"
}
```

**Success Response (201 Created):**

```json
{
  "status": "success",
  "message": "Review submitted successfully and is pending approval.",
  "data": { ... }
}
```

**Error Responses:**
- `409 Conflict`: "You have already reviewed this product"
- `400 Bad Request`: "Rating must be between 1 and 5"

### 5. Update Review

Updates a review's rating or description. If a Member updates their own approved review, `isApproved` is reset to `false`. Admins can update any review.

**Method:** PUT

**URL:** `/api/v1/reviews/:id`

**Authentication:** Required (Review Owner or Admin)

**Body:** (All fields are optional)

```json
{
  "rating": 4,
  "description": "Updated review text."
}
```

**Success Response:**

```json
{
  "status": "success",
  "data": { ... }
}
```

**Error Responses:**
- `403 Forbidden`: "Forbidden: You can only edit your own reviews"

### 6. Update Review Status (Toggle Approval)

Dedicated endpoint for admins to approve or disapprove a review.

**Method:** PATCH

**URL:** `/api/v1/reviews/:id/status`

**Authentication:** Required (Owner, Admin, Manager, Super Admin)

**Body:**

```json
{
  "isApproved": true
}
```

**Success Response:**

```json
{
  "status": "success",
  "message": "Review status updated successfully",
  "data": { ... }
}
```

### 7. Delete Review

Deletes a review.

**Method:** DELETE

**URL:** `/api/v1/reviews/:id`

**Authentication:** Required (Review Owner or Admin)

**Success Response:**

```json
{
  "status": "success",
  "message": "Review deleted successfully"
}
```

---

### 8. Bulk Update Reviews

Batch updates review approval status (`isApproved`).

**Method:** POST

**URL:** `/api/v1/reviews/bulk-update`

**Authentication:** Required (`Owner`, `Admin`, `Manager`, `Super Admin`)

**Headers:**
```http
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "ids": ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"],
  "isApproved": true
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Successfully updated 2 reviews"
}
```

---

### 9. Bulk Delete Reviews (Soft Delete)

Batch soft-deletes multiple reviews (`active: false`).

**Method:** POST

**URL:** `/api/v1/reviews/bulk-delete`

**Authentication:** Required (`Owner`, `Admin`, `Manager`, `Super Admin`)

**Headers:**
```http
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "ids": ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Successfully deleted 2 reviews"
}
```

