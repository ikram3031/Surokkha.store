# Store Utilities & Showcases API Documentation

This document describes the store utilities management endpoints used by the frontend homepage and dashboard to configure Featured and Best Seller product showcases.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/store-utils`

---

## 1. Get Store Utility Showcases

Retrieves the currently configured Featured and Best Seller products. If showcases are not manually assigned, it automatically falls back to active in-stock products tagged with `featured` and `best-seller`.

- **Method:** `GET`
- **URL:** `/api/v1/store-utils`
- **Authentication:** Not required (Public & Dashboard)

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "featured": [
      {
        "id": "6a770be9693b9d377d78f433",
        "name": "Dolce & Gabbana D&G L'Imperatrice EDT",
        "slug": "dolce-gabbana-dg-limperatrice-edt",
        "type": "variant",
        "price": 0,
        "stockStatus": "instock",
        "imageUrl": "/uploads/2608/260808/sample.webp",
        "thumbnailUrl": "/uploads/2608/260808/thumb_sample.webp",
        "variants": [
          {
            "size": "02ml",
            "price": 260,
            "stockQuantity": 10
          }
        ]
      }
    ],
    "bestSeller": [
      {
        "id": "6a770be9693b9d377d78f434",
        "name": "Sauvage Elixir Eau De Parfum",
        "slug": "sauvage-elixir-eau-de-parfum",
        "type": "variant",
        "price": 1850,
        "stockStatus": "instock",
        "imageUrl": "/uploads/2608/260808/sauvage.webp"
      }
    ],
    "updatedAt": "2026-08-29T10:00:00.000Z"
  }
}
```

---

## 2. Update Store Utility Showcases

Updates the ordered list of Featured and Best Seller products. Accepts product MongoDB ObjectIDs, product `did` strings, or product objects containing `id`/`_id`/`did`.

- **Method:** `PUT`
- **URL:** `/api/v1/store-utils`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`)
- **Headers:**
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request Body:
```json
{
  "featured": [
    "6a770be9693b9d377d78f433",
    "d51273772a2bc11f"
  ],
  "bestSeller": [
    "6a770be9693b9d377d78f434"
  ]
}
```

### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Store utilities updated successfully",
  "data": {
    "featured": [ ... ],
    "bestSeller": [ ... ],
    "updatedAt": "2026-08-29T11:45:00.000Z"
  }
}
```
