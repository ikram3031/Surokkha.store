# Images & Media Upload API Documentation

This document describes all image uploading, attribute icon/image processing, resizing, and media library exploration endpoints in the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/images`

---

## 1. List All Uploaded Media

Retrieves a paginated list of all media files residing in the `/uploads` directory tree with file metadata, timestamps, and search filtering.

- **Method:** `GET`
- **URL:** `/api/v1/images?page=1&limit=20&search=chanel`
- **Authentication:** Required (`Authorization: Bearer <accessToken>`)

### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | Integer | No | `1` | Page number |
| `limit` | Integer | No | `20` | Items per page (default: 20) |
| `search` | String | No | - | Filter filename or path substring (case-insensitive) |

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "filename": "chanel-bleu-de-chanel-edp_main_1723456789.webp",
      "url": "/uploads/2608/260813/chanel-bleu-de-chanel-edp_main_1723456789.webp",
      "size": 48200,
      "createdAt": "2026-08-13T10:15:30.000Z",
      "updatedAt": "2026-08-13T10:15:30.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 2. Upload Product, Attribute, or General Image

Handles multi-mode image uploads with automatic Sharp WebP conversion, auto-rotation, dimensional resizing, thumbnail generation, and structured date-based directory storage (`uploads/YYMM/YYMMDD`).

- **Method:** `POST`
- **URL:** `/api/v1/images/upload`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`)
- **Content-Type:** `multipart/form-data`
- **Max File Size:** `10 MB`

### Request Parameters (Form Data):

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | Yes | Image binary (JPG, PNG, WebP, GIF, SVG, AVIF) |
| `type` | String | No | `product`, `attribute`, or default (general image) |
| `productSlug` | String | No | *(When `type=product`)* Product slug for structured naming |
| `variantName` | String | No | *(When `type=product`)* Variant name (e.g. `100ml`, `02ml`) |
| `attributeSlug` / `attributeName` | String | No | *(When `type=attribute`)* Attribute group identifier (e.g. `size`, `color`) |
| `valueSlug` / `valueName` | String | No | *(When `type=attribute`)* Attribute value identifier (e.g. `10ml`, `gold`) |

### Example 1: Product Image Upload
Generates high-res main image (max 1200x1200px WebP) and thumbnail (max 200x200px WebP).

```http
POST /api/v1/images/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

[Form Data: image=<file.jpg>, type="product", productSlug="sauvage-elixir", variantName="100ml"]
```

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "imageUrl": "/uploads/2608/260829/sauvage-elixir_100ml_1724912345678.webp",
    "thumbnailUrl": "/uploads/2608/260829/thumb_sauvage-elixir_100ml_1724912345678.webp"
  }
}
```

### Example 2: Attribute Icon/Thumbnail Upload
Saves into `/uploads/assets/attributes` as a 1:1 square crop (max 1000x1000px WebP quality 90).

```http
POST /api/v1/images/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

[Form Data: image=<icon.png>, type="attribute", attributeSlug="bottle-type", valueSlug="crystal-gold"]
```

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "imageUrl": "/uploads/assets/attributes/bottle-type_crystal-gold_1724912345678.webp"
  }
}
```

### Example 3: General Image Upload
Saves into current date folder as WebP (max 1200px width).

```http
POST /api/v1/images/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

[Form Data: image=<banner.png>]
```

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "imageUrl": "/uploads/2608/260829/image_banner_1724912345678.webp"
  }
}
```

---

## 3. Resize / Redirect Image

Redirects to the specified image URL.

- **Method:** `GET`
- **URL:** `/api/v1/images/resize?url=https://server.decantrebd.com/uploads/...`
- **Authentication:** Not required
