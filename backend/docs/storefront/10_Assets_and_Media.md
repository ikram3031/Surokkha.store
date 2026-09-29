# Storefront Assets & Media API

The Storefront Assets & Media API serves homepage banner slots, promo graphics, brand logos, product gallery media, and real-time image redirection proxies.

## Base URLs
```text
http://localhost:4001/api/v1/assets
http://localhost:4001/api/v1/images
```

---

## 1. Assets Endpoints

### 1.1 List Slot Assets
Retrieves active visual slot assets (e.g. `hero_banner`, `mobile_slider`, `promo_strip`).

- **Method:** `GET`
- **Path:** `/api/v1/assets`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7fb",
      "name": "Hero Banner",
      "did": "ast-001",
      "metadata": {
        "slot": "hero_banner",
        "imageUrl": "https://images.unsplash.com/hero.jpg",
        "linkUrl": "/products"
      }
    }
  ]
}
```

---

### 1.2 Get Asset by ID
Retrieves details of a single visual asset.

- **Method:** `GET`
- **Path:** `/api/v1/assets/:assetId`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7fb",
    "name": "Hero Banner",
    "metadata": {
      "slot": "hero_banner",
      "imageUrl": "https://images.unsplash.com/hero.jpg"
    }
  }
}
```

---

## 2. Media & Images Endpoints

### 2.1 List All Media Images
Retrieves uploaded product images and assets for public gallery carousels.

- **Method:** `GET`
- **Path:** `/api/v1/images`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "url": "/uploads/assets/hero_banner_desktop.webp",
      "name": "hero_banner_desktop.webp",
      "sizeFormatted": "180 KB"
    }
  ]
}
```

---

### 2.2 Image Dynamic Proxy & Redirect
Redirects or streams optimized media URLs.

- **Method:** `GET`
- **Path:** `/api/v1/images/resize?url=https://example.com/image.jpg`
- **Auth:** None (Public)

#### Response (`302 Found` / Stream)
- Redirects to target URL.
