# Assets & Dashboard Slot Asset Manager API Documentation

This document describes both the Core Assets metadata management endpoints (`/api/v1/assets`) and the Dashboard Slot Asset Manager endpoints (`/api/v1/dash/assets`) for banners, sliders, and logos.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

---

## 1. Dashboard Slot Asset Manager

**Base Path:** `/api/v1/dash/assets`  
**Authentication:** Required (`Owner`, `Admin`)  
**Header:** `Authorization: Bearer <accessToken>`

Provides high-performance asset slot management for frontend banners, promo sliders, logos, and favicons with automated lossless WebP compression targeting `<= 230 KB` at 100% full pixel resolution.

### 1.1 List Slot Assets
Retrieves all asset files located in `/uploads/assets/` sorted by latest modified date.

- **Method:** `GET`
- **URL:** `/api/v1/dash/assets`

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "filename": "hero_banner_desktop.webp",
      "relativePath": "/uploads/assets/hero_banner_desktop.webp",
      "url": "/uploads/assets/hero_banner_desktop.webp?v=1724912345678",
      "size": 184320,
      "sizeFormatted": "180 KB",
      "updatedAt": "2026-08-29T10:15:30.000Z"
    }
  ]
}
```

---

### 1.2 Upload / Overwrite Slot Asset
Uploads an image file up to 5MB, adaptively compresses it to WebP targeting `<= 230KB` (or preserves `.svg` / `.ico` formats), and replaces/overwrites the target slot file in `/uploads/assets/`.

- **Method:** `POST`
- **URL:** `/api/v1/dash/assets/upload-slot`
- **Content-Type:** `multipart/form-data`
- **Max Upload Limit:** `5 MB`

#### Form Data Parameters:
| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | Image file (JPG, PNG, WebP, SVG, ICO) up to 5MB |
| `targetFilename` / `slotKey` | String | Yes | Name of target slot file (e.g. `main_slider_1`, `hero_banner_desktop.webp`, `favicon.ico`) |

#### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Asset hero_banner_desktop.webp saved successfully!",
  "data": {
    "filename": "hero_banner_desktop.webp",
    "relativePath": "/uploads/assets/hero_banner_desktop.webp",
    "url": "/uploads/assets/hero_banner_desktop.webp?v=1724912345678",
    "size": 192450,
    "sizeFormatted": "187.94 KB",
    "updatedAt": "2026-08-29T10:15:30.000Z"
  }
}
```

---

### 1.3 Download Slot Asset
Downloads the specified asset file from `/uploads/assets/` as an attachment.

- **Method:** `GET`
- **URL:** `/api/v1/dash/assets/download/:filename`

---

### 1.4 Delete Slot Asset
Deletes an asset file from `/uploads/assets/`.

- **Method:** `DELETE`
- **URL:** `/api/v1/dash/assets/:filename`

#### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Asset hero_banner_desktop.webp deleted successfully"
}
```

---

## 2. Core Assets Metadata API

**Base Path:** `/api/v1/assets`  
**Authentication:** Required (`Authorization: Bearer <accessToken>`)

Manages general entity assets stored in MongoDB.

- `GET /api/v1/assets` - List all assets (Authenticated users)
- `GET /api/v1/assets/:assetId` - Get asset details by ID (Authenticated users)
- `POST /api/v1/assets` - Create asset record (`Owner`, `Admin`)
- `PUT /api/v1/assets/:assetId` - Update asset record (`Owner`, `Admin`)
- `DELETE /api/v1/assets/:assetId` - Delete asset record (`Owner`, `Admin`)

### Request Example (Create / Update Asset):
```json
{
  "name": "Office Equipment",
  "metadata": {
    "category": "Hardware",
    "serial": "SN-987654"
  }
}
```

### Success Response:
```json
{
  "status": "success",
  "data": {
    "_id": "64b1e0d7a6d02d37c2be1f3a",
    "name": "Office Equipment",
    "did": "asset-did-123",
    "createdBy": "64b1e0a1a6d02d37c2be1f39",
    "metadata": {
      "category": "Hardware",
      "serial": "SN-987654"
    },
    "createdAt": "2026-07-29T12:34:56.789Z",
    "updatedAt": "2026-07-29T12:34:56.789Z"
  }
}
```
