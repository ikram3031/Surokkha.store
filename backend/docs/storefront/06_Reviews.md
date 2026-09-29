# Storefront Product Reviews API

The Storefront Product Reviews API allows customers to read approved product ratings/reviews and authenticated members to submit and edit their own reviews.

## Base URL
```text
http://localhost:4001/api/v1/reviews
```

---

## Endpoints

### 1. Get Product Reviews
Retrieves approved customer reviews and star ratings for a specific product.

- **Method:** `GET`
- **Path:** `/api/v1/reviews/product/:productDid`
- **Auth:** None (Public)

#### Query Parameters
- `page` (integer, optional) - default: `1`
- `limit` (integer, optional) - default: `10`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f7",
      "did": "rev-001",
      "productDid": "prod-001",
      "userName": "Customer One",
      "rating": 5,
      "review": "Excellent build quality and crisp sound!",
      "createdAt": "2026-09-26T15:40:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "averageRating": 5.0
  }
}
```

---

### 2. Get Single Review by ID
Retrieves details of a specific review.

- **Method:** `GET`
- **Path:** `/api/v1/reviews/:id`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f7",
    "productDid": "prod-001",
    "userName": "Customer One",
    "rating": 5,
    "review": "Excellent build quality and crisp sound!"
  }
}
```

---

### 3. Submit Product Review
Submits a customer rating and review for a purchased product.

- **Method:** `POST`
- **Path:** `/api/v1/reviews`
- **Auth:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "productDid": "prod-001",
  "rating": 5,
  "review": "Excellent build quality and crisp sound!",
  "userName": "Customer One"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "status": "success",
  "message": "Review submitted successfully and is pending approval",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f7",
    "rating": 5,
    "review": "Excellent build quality and crisp sound!"
  }
}
```

---

### 4. Update Review
Allows the authoring customer to edit their submitted review.

- **Method:** `PUT`
- **Path:** `/api/v1/reviews/:id`
- **Auth:** Required (`Bearer <token>`)

#### Request Body
```json
{
  "rating": 4,
  "review": "Updated review note: Battery lasts about 24 hours."
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Review updated successfully"
}
```
