# Products & High-Performance Search API Documentation

This document describes the product catalog management, public storefront listing, single product details, and administrative deep-faceted search endpoints backed by MongoDB aggregation pipelines.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Paths

- Public & Core: `/api/v1/products`
- Dashboard Faceted Search: `/api/v1/dash/products`
- Autocomplete Alias: `/api/v1/search-products`

---

## 1. List Products (Storefront & General)

Products can be queried using either `GET` (URL query parameters) or `POST` (JSON body for multi-parameter filtering).

- **Endpoints:**
  - `GET /api/v1/products`
  - `POST /api/v1/products` *(when called with query payload)*
  - `POST /api/v1/products/search`

### Supported Parameters (Query or JSON Body):

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `q` / `search` / `keyword` | `string` | Search against product `name`, `slug`, `description`, `notes`, `tags`, and `did` |
| `category` / `categories` | `string` \| `string[]` | Filter by Category ObjectId, DID, or slug. Automatically resolves descendant child subcategories recursively. |
| `brand` / `brands` | `string` \| `string[]` | Filter by Brand ObjectId, DID, or slug |
| `stockStatus` | `string` | Filter by stock status (`instock`, `outofstock`, `preorder`, or `all`) |
| `type` | `string` | Product type (`simple` or `variant`) |
| `season` | `string` | Season filter (`Summer`, `Winter`, `Spring`, `Autumn`, `All-Season`) |
| `minPrice` / `min_price` | `number` | Minimum price filter (evaluates base price, offer price, and variant prices) |
| `maxPrice` / `max_price` | `number` | Maximum price filter (evaluates base price, offer price, and variant prices) |
| `skip` / `offset` | `integer` | Number of items to skip (default `0`) |
| `limit` | `integer` | Number of items to return per page (default `10`, max `100`) |
| `sortBy` | `string` | Field to sort by: `createdAt`, `name`, `price`, `updatedAt`, `stockStatus` (default `createdAt`) |
| `order` | `string` | Sort order direction: `asc` or `desc` (default `desc`) |
| `sort` | `string` | High-level storefront aliases: `newest`, `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc` |

### Response Structure (200 OK):

```json
{
  "status": "success",
  "data": [
    {
      "id": "6a770be9693b9d377d78f433",
      "name": "Dolce & Gabbana D&G L'Imperatrice EDT",
      "slug": "dolce-gabbana-dg-limperatrice-edt",
      "description": "<p>Top Notes: ...</p>",
      "type": "variant",
      "price": 0,
      "offerPrice": null,
      "stockStatus": "instock",
      "did": "d51273772a2bc11f",
      "season": "All-Season",
      "tags": ["women", "summer"],
      "notes": ["Watermelon", "Kiwi"],
      "brand": ["68c623cef30ed08c"],
      "categories": [
        {
          "_id": "6a64742900d5281346d53875",
          "name": "For Her",
          "slug": "for-her",
          "did": "3b23f4610b15517f"
        }
      ],
      "variants": [
        {
          "size": "02ml",
          "price": 260,
          "offerPrice": null,
          "stockQuantity": 10,
          "sku": "",
          "sortOrder": 0,
          "imageUrl": null
        }
      ],
      "imageUrl": "/uploads/2608/260808/sample.webp",
      "thumbnailUrl": "/uploads/2608/260808/thumb_sample.webp",
      "images": [],
      "createdAt": "2026-08-08T10:58:49.033Z",
      "updatedAt": "2026-08-08T10:59:35.430Z"
    }
  ],
  "pagination": {
    "total": 414,
    "limit": 15,
    "skip": 0
  }
}
```

> **CRITICAL CONTRACT NOTE:**  
> The `pagination` object contains `total`, `limit`, and `skip`.  
> Frontend applications and Admin Dashboard calculate dynamic page count using:  
> `totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))`  
> **Never rename or remove fields from the `pagination` object.**

---

## 2. Dashboard Faceted Search (`/api/v1/dash/products`)

High-performance aggregation pipeline endpoint specifically built for the administrative catalog with multi-relation lookup, deep faceted counting, and attribute matching.

- **Method:** `POST`
- **URL:** `/api/v1/dash/products`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`, `Marketing Expert`)
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`

### Request Body:
```json
{
  "page": 1,
  "limit": 20,
  "q": "chanel",
  "stockStatus": "instock",
  "categories": ["6a64742900d5281346d53875"],
  "brands": ["chanel"],
  "sizes": ["100ml"],
  "sort": "createdAt",
  "order": "desc"
}
```

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "6a770be9693b9d377d78f433",
      "name": "Bleu de Chanel EDP",
      "slug": "bleu-de-chanel-edp",
      "did": "d51273772a2bc11f",
      "type": "variant",
      "price": 14500,
      "brand": [
        {
          "_id": "68c623cef30ed08c",
          "name": "Chanel",
          "slug": "chanel"
        }
      ],
      "categories": [
        {
          "_id": "6a64742900d5281346d53872",
          "name": "For Him",
          "slug": "for-him"
        }
      ],
      "variants": [ ... ],
      "imageUrl": "/uploads/2608/260808/bdc.webp",
      "stockStatus": "instock",
      "createdAt": "2026-08-08T10:58:49.033Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 3. Get Single Product

- **Endpoint:** `GET /api/v1/products/:identifier`
- `:identifier` may be a MongoDB ObjectId (`_id`), a product `slug`, or deterministic `did`.
- **Response (200 OK):**
```json
{
  "data": {
    "id": "6a770be9693b9d377d78f433",
    "name": "Dolce & Gabbana D&G L'Imperatrice EDT",
    "slug": "dolce-gabbana-dg-limperatrice-edt",
    "did": "d51273772a2bc11f",
    "type": "variant",
    "stockStatus": "instock",
    "variants": [ ... ],
    "categories": [ ... ],
    "brand": [ ... ]
  }
}
```

---

## 4. Create Product

- **Endpoint:** `POST /api/v1/products`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`)
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Required Fields:** `name`, `slug`, `imageUrl` (or `thumbnailUrl`)
- **Response (201 Created):**
```json
{
  "status": "success",
  "message": "Product created successfully",
  "data": { ... }
}
```

---

## 5. Update Product

- **Endpoint:** `PUT /api/v1/products/:identifier`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`)
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- Updates mutable product fields, images, variants, categories, brands, tags, and notes.
- **Response (200 OK):**
```json
{
  "status": "success",
  "data": { ... }
}
```

---

## 6. Delete Product

- **Endpoint:** `DELETE /api/v1/products/:identifier`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`)
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```
