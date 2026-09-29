# Categories API Documentation

This document describes all available endpoints for product category management.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/categories`

---

## Endpoints

### 1. List All Categories

Retrieves all categories along with live product count for each category.

- **Method:** `GET`
- **URL:** `/api/v1/categories`
- **Authentication:** Not required

#### Success Response
```json
{
  "status": "success",
  "data": [
    {
      "_id": "6a64742900d5281346d53872",
      "did": "c5ab3a9d11e8d4a7",
      "name": "For Him",
      "slug": "for-him",
      "description": "Fragrances curated for men",
      "parent": null,
      "product_count": 42,
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Category by ID

Retrieves details of a single category by its MongoDB ObjectId.

- **Method:** `GET`
- **URL:** `/api/v1/categories/:id`
- **Authentication:** Not required

#### Success Response
```json
{
  "status": "success",
  "data": {
    "_id": "6a64742900d5281346d53872",
    "did": "c5ab3a9d11e8d4a7",
    "name": "For Him",
    "slug": "for-him",
    "description": "Fragrances curated for men",
    "parent": null
  }
}
```

---

### 3. Create Category

Creates a new category.

- **Method:** `POST`
- **URL:** `/api/v1/categories`
- **Authentication:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "name": "Body Mists",
  "slug": "body-mists",
  "description": "Refreshing daily body mists",
  "parent": "6a64742900d5281346d53875"
}
```

#### Success Response (201 Created)
```json
{
  "status": "success",
  "data": {
    "_id": "6a64742900d5281346d53899",
    "did": "cat-did-123456",
    "name": "Body Mists",
    "slug": "body-mists",
    "description": "Refreshing daily body mists",
    "parent": "6a64742900d5281346d53875",
    "createdAt": "2026-08-22T10:00:00.000Z"
  }
}
```

---

### 4. Update Category

Updates an existing category by ObjectId, slug, or DID.

- **Method:** `PUT`
- **URL:** `/api/v1/categories/:id`
- **Authentication:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "name": "Luxury Body Mists",
  "description": "Updated description for body mists"
}
```

#### Success Response
```json
{
  "status": "success",
  "data": {
    "_id": "6a64742900d5281346d53899",
    "name": "Luxury Body Mists",
    "slug": "body-mists"
  }
}
```

---

### 5. Delete Category

Deletes a category by ObjectId, slug, or DID.

- **Method:** `DELETE`
- **URL:** `/api/v1/categories/:id`
- **Authentication:** Required (`Owner`, `Admin`)

#### Success Response
```json
{
  "status": "success",
  "message": "Category deleted successfully"
}
```

