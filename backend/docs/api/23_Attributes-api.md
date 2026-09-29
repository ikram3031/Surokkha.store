# Dashboard Product Attributes API Documentation

This document describes the product variation attribute group management endpoints (e.g. Size, Bottle, Decant Capacity).

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/dashboard/attributes`

---

## Endpoints

### 1. List All Product Attributes

Retrieves all configured product variation attribute groups with automatically natural-sorted values (e.g. `2ml`, `5ml`, `10ml`, `30ml`, `50ml`, `100ml`).

- **Method:** `GET`
- **URL:** `/api/v1/dashboard/attributes`
- **Authentication:** Not required

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66b591208a24d5b9423c5801",
      "name": "Bottle Size",
      "slug": "size",
      "values": [
        { "name": "02ml", "slug": "02ml" },
        { "name": "05ml", "slug": "05ml" },
        { "name": "10ml", "slug": "10ml" },
        { "name": "30ml", "slug": "30ml" },
        { "name": "50ml", "slug": "50ml" },
        { "name": "100ml", "slug": "100ml" }
      ],
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Create Product Attribute Group

Creates a new product variation attribute group.

- **Method:** `POST`
- **URL:** `/api/v1/dashboard/attributes`
- **Authentication:** Not required

#### Request Body:
```json
{
  "name": "Concentration",
  "slug": "concentration",
  "values": [
    { "name": "Eau de Cologne", "slug": "edc" },
    { "name": "Eau de Toilette", "slug": "edt" },
    { "name": "Eau de Parfum", "slug": "edp" },
    { "name": "Extrait de Parfum", "slug": "extrait" }
  ]
}
```

#### Success Response (201 Created):
```json
{
  "status": "success",
  "data": {
    "_id": "66b591208a24d5b9423c5802",
    "name": "Concentration",
    "slug": "concentration",
    "values": [
      { "name": "Eau de Cologne", "slug": "edc" },
      { "name": "Eau de Toilette", "slug": "edt" },
      { "name": "Eau de Parfum", "slug": "edp" },
      { "name": "Extrait de Parfum", "slug": "extrait" }
    ]
  }
}
```

---

### 3. Update Product Attribute Group

Updates attribute name, slug, or option value list.

- **Method:** `PUT`
- **URL:** `/api/v1/dashboard/attributes/:id`
- **Authentication:** Not required

#### Request Body:
```json
{
  "name": "Bottle Size & Decant Options",
  "values": [
    { "name": "02ml", "slug": "02ml" },
    { "name": "05ml", "slug": "05ml" },
    { "name": "10ml", "slug": "10ml" },
    { "name": "30ml", "slug": "30ml" },
    { "name": "50ml", "slug": "50ml" },
    { "name": "100ml", "slug": "100ml" },
    { "name": "200ml", "slug": "200ml" }
  ]
}
```

#### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "_id": "66b591208a24d5b9423c5801",
    "name": "Bottle Size & Decant Options",
    "slug": "size",
    "values": [ ... ]
  }
}
```

---

### 4. Delete Product Attribute Group

Deletes an attribute group.

- **Method:** `DELETE`
- **URL:** `/api/v1/dashboard/attributes/:id`
- **Authentication:** Not required

#### Success Response (200 OK):
```json
{
  "status": "success",
  "message": "Attribute deleted successfully"
}
```
