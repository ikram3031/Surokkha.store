# Service Assets, Slot Manager & Media Audit API

The Service Assets & Media Audit API handles slot banner uploads, automated lossless WebP conversions, disk storage health auditing, database-to-filesystem orphan candidate detection, and Cloudflare R2 cloud sync.

## Base URLs
```text
http://localhost:4002/api/v1/dash/assets
http://localhost:4002/api/v1/assets
http://localhost:4002/api/v1/admin/media-audit
```

---

## 1. Dashboard Slot Asset Manager (`/dash/assets`)

> **Role Restriction:** `Owner`, `Admin`

### 1.1 List Slot Assets
- **Method:** `GET`
- **Path:** `/api/v1/dash/assets`

### 1.2 Upload / Replace Slot Asset
Uploads an image (up to 5MB) and converts/compresses to WebP targeting `<= 230KB` at original dimensions.

- **Method:** `POST`
- **Path:** `/api/v1/dash/assets/upload-slot`
- **Content-Type:** `multipart/form-data`

#### Fields
- `file` (File)
- `slotKey` / `targetFilename` (string, e.g. `hero_banner_desktop.webp`)

### 1.3 Download / Delete Slot Asset
- `GET /api/v1/dash/assets/download/:filename`
- `DELETE /api/v1/dash/assets/:filename`

---

## 2. Media Storage Audit & Cloudflare R2 Sync (`/admin/media-audit`)

> **Role Restriction:** `Owner`, `Admin`

### 2.1 Storage & Audit Summary
- **Method:** `GET`
- **Path:** `/api/v1/admin/media-audit/summary`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "storage": {
      "totalDiskFormatted": "43.19 MB",
      "totalFilesCount": 842,
      "totalDbReferenced": 790
    },
    "orphans": {
      "candidateCount": 52,
      "candidateFormatted": "3.00 MB",
      "whitelistedCount": 8
    },
    "r2Sync": {
      "enabled": true,
      "totalSyncedFiles": 842,
      "pendingSyncCount": 0
    }
  }
}
```

### 2.2 Trigger Orphan File Scan
- **Method:** `POST`
- **Path:** `/api/v1/admin/media-audit/scan`

### 2.3 Trigger Cloudflare R2 Sync
- **Method:** `POST`
- **Path:** `/api/v1/admin/media-audit/r2-sync`

### 2.4 Whitelist / Delete Orphan Files
- `POST /api/v1/admin/media-audit/whitelist`
- `DELETE /api/v1/admin/media-audit/confirm`
