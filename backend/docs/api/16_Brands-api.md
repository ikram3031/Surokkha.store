# Brands API Documentation

This document describes all available endpoints for brand management.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Endpoints

### List brands
Retrieves all registered brands. This is a public endpoint.

**Method:** GET

**URL:** `/api/v1/brands`

**Authentication:** Not required

### Success Response
```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0d1",
      "did": "BR-100200",
      "name": "Chanel",
      "slug": "chanel",
      "description": "Chanel luxury fashion and fragrance line",
      "createdAt": "2026-07-19T10:00:00.000Z"
    }
  ]
}
```

---

### Create a brand
Registers a new product brand.

**Method:** POST

**URL:** `/api/v1/brands`

**Authentication:** Required (Owner or Admin role only)

**Request Body:**
```json
{
  "name": "Dior",
  "description": "Christian Dior luxury brand fragrances"
}
```

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0d5",
    "did": "BR-300400",
    "name": "Dior",
    "slug": "dior"
  }
}
```

---

### Update brand
Modifies an existing brand name or metadata description.

**Method:** PUT

**URL:** `/api/v1/brands/:id`

**Authentication:** Required (Owner or Admin role only)

**Request Body:**
```json
{
  "name": "Dior Homme",
  "description": "Dior Homme brand line extension"
}
```

### Success Response
```json
{
  "status": "success",
  "message": "Brand updated successfully"
}
```

---

### Delete brand
Permanently deletes a brand entry.

**Method:** DELETE

**URL:** `/api/v1/brands/:id`

**Authentication:** Required (Owner or Admin role only)

### Success Response
```json
{
  "status": "success",
  "message": "Brand deleted successfully"
}
```
