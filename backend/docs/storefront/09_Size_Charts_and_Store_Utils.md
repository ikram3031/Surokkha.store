# Storefront Size Charts & Store Utilities API

The Size Charts & Store Utilities API provides endpoints for retrieving category-specific sizing guides, promotional announcement banners, and featured/best-seller homepage product showcases.

## Base URLs
```text
http://localhost:4001/api/v1/size-charts
http://localhost:4001/api/v1/store-utils
```

---

## 1. Size Charts Endpoints

### 1.1 List All Size Charts
Retrieves all public sizing charts for apparel, shoes, and accessories.

- **Method:** `GET`
- **Path:** `/api/v1/size-charts`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7fa",
      "title": "Standard T-Shirt Sizing",
      "category": "66f4a8c9b3f8e3a5c1d2e7f2",
      "chartData": [
        { "size": "M", "chest": "40", "length": "28" },
        { "size": "L", "chest": "42", "length": "29" }
      ]
    }
  ]
}
```

---

### 1.2 Get Size Chart by Category ID
Retrieves the sizing guide specific to a selected product category.

- **Method:** `GET`
- **Path:** `/api/v1/size-charts/category/:categoryId`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7fa",
    "title": "Standard T-Shirt Sizing",
    "chartData": [
      { "size": "M", "chest": "40", "length": "28" }
    ]
  }
}
```

---

## 2. Store Utilities Endpoints

### 2.1 Get Store Utilities & Showcases
Retrieves configured homepage showcase modules (e.g. Featured Products, Best Sellers, Flash Deals, Top Banner text).

- **Method:** `GET`
- **Path:** `/api/v1/store-utils`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "bannerText": "Welcome to Surokkha Store! Enjoy fast delivery across Bangladesh.",
    "featured": [
      {
        "id": "66f4a8c9b3f8e3a5c1d2e7f1",
        "name": "Wireless Headphones",
        "slug": "wireless-headphones",
        "price": 1500,
        "imageUrl": "https://images.unsplash.com/photo-headphones.jpg"
      }
    ],
    "bestSeller": []
  }
}
```
