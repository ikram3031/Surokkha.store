# Service Product Attributes & Size Charts API

The Attributes & Size Charts API provides management of product variation axes (e.g. Size, Color, Capacity) and category-specific sizing measurement charts.

## Base URLs
```text
http://localhost:4002/api/v1/attribute
http://localhost:4002/api/v1/size-charts
```

---

## 1. Product Variation Attributes

### 1.1 List Attributes
- **Method:** `GET`
- **Path:** `/api/v1/attribute/attributes` or `/api/v1/attribute/dashboard/attributes`
- **Auth:** Public / Authenticated

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e806",
      "name": "Color",
      "slug": "color",
      "values": ["Black", "White", "Blue"]
    }
  ]
}
```

### 1.2 Create Attribute Group
- **Method:** `POST`
- **Path:** `/api/v1/attribute/dashboard/attributes`
- **Auth:** Required

#### Request Body
```json
{
  "name": "Size",
  "slug": "size",
  "values": ["S", "M", "L", "XL"]
}
```

### 1.3 Update / Delete Attribute Group
- `PUT /api/v1/attribute/dashboard/attributes/:id`
- `DELETE /api/v1/attribute/dashboard/attributes/:id`

---

## 2. Category Size Charts

### 2.1 List All Size Charts
- **Method:** `GET`
- **Path:** `/api/v1/size-charts`

### 2.2 Upsert Size Chart
- **Method:** `POST`
- **Path:** `/api/v1/size-charts`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Request Body
```json
{
  "title": "Shoe Size Guide",
  "category": "66f4a8c9b3f8e3a5c1d2e7f2",
  "chartData": [
    { "size": "40", "length": "25.5cm" },
    { "size": "41", "length": "26.0cm" },
    { "size": "42", "length": "27.0cm" }
  ]
}
```

### 2.3 Delete Size Chart
- **Method:** `DELETE`
- **Path:** `/api/v1/size-charts/:id`
- **Auth:** Required (`Owner`, `Admin`)
