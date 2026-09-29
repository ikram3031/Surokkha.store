# Media Audit, Cloudflare R2 Sync & Orphan Cleanup API Documentation

This document describes the administrative storage audit, filesystem vs database orphan image scanning, Cloudflare R2 cloud synchronization, whitelisting, and safe orphan purge endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/admin/media-audit` (also aliased under `/v1/api/admin/media-audit`)

## Notes

- **Authentication:** Required (`Authorization: Bearer <accessToken>`).
- **Permissions:** Strictly restricted to `Owner` and `Admin` roles.

---

## 1. Storage & Audit Summary

Retrieves high-level storage metrics, total filesystem media files count and disk footprint, database-referenced images, candidate orphan count, whitelist count, and Cloudflare R2 synchronization health status.

- **Method:** `GET`
- **URL:** `/api/v1/admin/media-audit/summary`

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "storage": {
      "totalDiskBytes": 45283920,
      "totalDiskFormatted": "43.19 MB",
      "totalFilesCount": 842,
      "totalDbReferenced": 790
    },
    "orphans": {
      "candidateCount": 52,
      "candidateBytes": 3145728,
      "candidateFormatted": "3.00 MB",
      "whitelistedCount": 8,
      "lastScanAt": "2026-08-29T04:00:00.000Z"
    },
    "r2Sync": {
      "enabled": true,
      "totalSyncedFiles": 842,
      "pendingSyncCount": 0,
      "lastSyncAt": "2026-08-29T04:30:00.000Z"
    }
  }
}
```

---

## 2. List Orphan Candidates

Retrieves a paginated list of scanned orphan images (files present on VPS disk but not referenced by any product, banner, attribute, or user profile in MongoDB).

- **Method:** `GET`
- **URL:** `/api/v1/admin/media-audit/orphans?page=1&limit=20&q=unused&status=candidate`

### Query Parameters:
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number |
| `limit` | Integer | `20` | Results per page |
| `status` | String | `candidate` | Filter status (`candidate`, `whitelisted`, `deleted`, `all`) |
| `q` | String | - | Search query matching filename or relative path |

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66b591208a24d5b9423c5901",
      "filename": "old_sample_banner_1720000000.webp",
      "relativePath": "uploads/2608/260810/old_sample_banner_1720000000.webp",
      "fileSizeBytes": 154200,
      "fileSizeFormatted": "150.59 KB",
      "status": "candidate",
      "discoveredAt": "2026-08-29T04:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 52,
    "totalPages": 3
  }
}
```

---

## 3. Trigger Filesystem & DB Orphan Scan

Initiates an immediate on-demand background scan comparing local storage files against active MongoDB collections.

- **Method:** `POST`
- **URL:** `/api/v1/admin/media-audit/scan`

### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Orphan media scan started successfully. Audit results will update shortly.",
  "scanId": "scan_1724912345"
}
```

---

## 4. Trigger Cloudflare R2 Sync

Triggers an immediate synchronization run to upload missing local media files to the configured Cloudflare R2 object storage bucket.

- **Method:** `POST`
- **URL:** `/api/v1/admin/media-audit/r2-sync`

### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Cloudflare R2 synchronization job initiated successfully."
}
```

---

## 5. Whitelist Protected Orphan Files

Protects specific orphan files from deletion by moving them to the permanent whitelist registry.

- **Method:** `POST`
- **URL:** `/api/v1/admin/media-audit/whitelist`

### Request Body:
```json
{
  "fileIds": ["66b591208a24d5b9423c5901"],
  "paths": ["uploads/assets/brand_custom_mark.webp"]
}
```

### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Selected files whitelisted successfully."
}
```

---

## 6. Confirm & Permanently Delete Orphan Files

Permanently unlinks and deletes confirmed orphan files from the VPS disk. Whitelisted files are skipped for safety.

- **Method:** `DELETE`
- **URL:** `/api/v1/admin/media-audit/confirm`

### Request Body:
```json
{
  "fileIds": ["66b591208a24d5b9423c5901"],
  "deleteAllUnprotected": false
}
```

### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "1 orphan file(s) permanently deleted. 150.59 KB disk space freed."
}
```
