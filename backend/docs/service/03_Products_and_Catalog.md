# Service Products & Catalog Management API

The Service Products API powers administrative catalog creation, editing, barcode lookups, inventory/stock tracking, and multi-criteria faceted dashboard searches (`/api/v1/dash/products`).

## Base URLs
```text
http://localhost:4002/api/v1/products
http://localhost:4002/api/v1/dash/products
```

---

## 1. Dashboard Faceted Search (`/dash/products`)

High-performance aggregation pipeline endpoint specifically tuned for dashboard management with multi-field joins.

- **Method:** `POST`
- **Path:** `/api/v1/dash/products`
- **Auth:** Required (`Owner`, `Admin`, `Manager`, `Marketing-Expert`)

#### Request Body
```json
{
  "search": "Nike",
  "category": "footwear",
  "brand": "nike",
  "stockStatus": "instock",
  "page": 1,
  "limit": 15
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e803",
      "did": "prod-srv-001",
      "name": "Nike Air Max",
      "sku": "SKU-NIKE-001",
      "price": 4500,
      "regular_price": 5000,
      "stock_status": "instock",
      "stock_quantity": 25,
      "categories": [
        { "name": "Footwear", "slug": "footwear" }
      ],
      "brand": { "name": "Nike", "slug": "nike" }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 15,
    "totalPages": 1
  }
}
```

---

## 2. Product Catalog CRUD Endpoints

### 2.1 Create New Product
- **Method:** `POST`
- **Path:** `/api/v1/products`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Request Body
```json
{
  "name": "Adidas Ultraboost",
  "title": "Adidas Ultraboost",
  "slug": "adidas-ultraboost",
  "sku": "SKU-ADI-001",
  "price": 5200,
  "regular_price": 5500,
  "category": "Footwear",
  "brand": "Adidas",
  "stock_status": "instock",
  "stock_quantity": 30,
  "status": "publish",
  "images": [
    { "src": "https://images.unsplash.com/adidas.jpg" }
  ]
}
```

---

### 2.2 Update Product
- **Method:** `PUT`
- **Path:** `/api/v1/products/:id`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

---

### 2.3 Delete Product
- **Method:** `DELETE`
- **Path:** `/api/v1/products/:id`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)
