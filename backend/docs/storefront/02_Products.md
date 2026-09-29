# Storefront Products & Catalog API

The Storefront Products API provides high-performance endpoints for browsing the public catalog, searching products with multi-faceted filtering, sorting, and retrieving detailed single-product views by slug or ID.

## Base URL
```text
http://localhost:4001/api/v1/products
```

---

## Endpoints

### 1. List Products
Retrieves active catalog products with pagination, category resolution, price range, and sorting.

- **Method:** `GET` or `POST`
- **Path:** `/api/v1/products` or `/api/v1/products/search`
- **Auth:** None (Public)

#### Query / Body Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `q` / `search` | `string` | Keyword to search in product title, name, description, tags, notes |
| `category` | `string` \| `string[]` | Filter by Category ObjectId, DID, or slug (includes recursive child categories) |
| `brand` | `string` \| `string[]` | Filter by Brand ObjectId, DID, or slug |
| `minPrice` | `number` | Minimum price filter |
| `maxPrice` | `number` | Maximum price filter |
| `stockStatus` | `string` | `instock`, `outofstock`, or `all` |
| `sort` / `sortBy` | `string` | `newest`, `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc` |
| `page` / `skip` | `integer` | Page number or offset |
| `limit` | `integer` | Results per page (default: `12`, max: `100`) |

#### Example Request
```http
GET /api/v1/products?category=electronics&minPrice=500&maxPrice=3000&sort=price-asc&limit=12
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f1",
      "did": "prod-001",
      "name": "Wireless Headphones",
      "title": "Wireless Headphones",
      "slug": "wireless-headphones",
      "sku": "SKU-HEAD-001",
      "price": 1500,
      "regular_price": 1800,
      "stock_status": "instock",
      "stock_quantity": 50,
      "category": "Electronics",
      "brand": "Sony",
      "images": [
        { "src": "https://images.unsplash.com/photo-headphones.jpg" }
      ],
      "variants": []
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 12,
    "skip": 0,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 2. Get Single Product by Identifier
Retrieves complete product details including gallery images, variants, attributes, size chart, and specifications using either MongoDB ObjectId or URL slug.

- **Method:** `GET`
- **Path:** `/api/v1/products/:identifier`
- **Auth:** None (Public)

#### Example Request
```http
GET /api/v1/products/wireless-headphones
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f1",
    "did": "prod-001",
    "name": "Wireless Headphones",
    "title": "Wireless Headphones",
    "slug": "wireless-headphones",
    "sku": "SKU-HEAD-001",
    "price": 1500,
    "regular_price": 1800,
    "description": "<p>Premium wireless headphones with active noise cancellation.</p>",
    "stock_status": "instock",
    "stock_quantity": 50,
    "categories": [
      {
        "_id": "66f4a8c9b3f8e3a5c1d2e7f2",
        "name": "Electronics",
        "slug": "electronics"
      }
    ],
    "brand": {
      "name": "Sony",
      "slug": "sony"
    },
    "images": [
      {
        "src": "https://images.unsplash.com/photo-headphones.jpg"
      }
    ],
    "attributes": [],
    "variants": [],
    "relatedProducts": []
  }
}
```
