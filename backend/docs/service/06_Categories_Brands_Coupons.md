# Service Categories, Brands & Coupons Administration API

The Categories, Brands & Coupons Administration API allows administrators to manage product taxonomy trees, brand assets, and promotional coupon discounting rules.

## Base URLs
```text
http://localhost:4002/api/v1/categories
http://localhost:4002/api/v1/brands
http://localhost:4002/api/v1/coupons
```

---

## 1. Categories Management

### 1.1 Create Category
- **Method:** `POST`
- **Path:** `/api/v1/categories`
- **Auth:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "name": "Accessories",
  "slug": "accessories",
  "description": "Bags, belts, caps, and wallets",
  "parent": null
}
```

### 1.2 Update Category
- **Method:** `PUT`
- **Path:** `/api/v1/categories/:id`
- **Auth:** Required (`Owner`, `Admin`)

### 1.3 Delete Category
- **Method:** `DELETE`
- **Path:** `/api/v1/categories/:id`
- **Auth:** Required (`Owner`, `Admin`)

---

## 2. Brands Management

### 2.1 Create Brand
- **Method:** `POST`
- **Path:** `/api/v1/brands`
- **Auth:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "name": "Puma",
  "slug": "puma",
  "logo": "https://images.unsplash.com/puma-logo.jpg"
}
```

### 2.2 Update Brand
- **Method:** `PUT`
- **Path:** `/api/v1/brands/:id`
- **Auth:** Required (`Owner`, `Admin`)

### 2.3 Delete Brand
- **Method:** `DELETE`
- **Path:** `/api/v1/brands/:id`
- **Auth:** Required (`Owner`, `Admin`)

---

## 3. Coupons Management

### 3.1 Create Coupon
- **Method:** `POST`
- **Path:** `/api/v1/coupons`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Request Body
```json
{
  "code": "SUMMER25",
  "discountType": "percentage",
  "discountAmount": 25,
  "minimumSpend": 2000,
  "usageLimit": 500,
  "expiryDate": "2026-10-31T23:59:59.000Z"
}
```

### 3.2 Update Coupon
- **Method:** `PUT`
- **Path:** `/api/v1/coupons/:id`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

### 3.3 Delete Coupon
- **Method:** `DELETE`
- **Path:** `/api/v1/coupons/:id`
- **Auth:** Required (`Owner`, `Admin`)
