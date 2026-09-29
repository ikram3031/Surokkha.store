# Storefront Categories & Brands API

The Categories & Brands API provides public catalog taxonomies, tree structures, parent-child hierarchies, and brand listings for store navigation, mega-menus, and faceted filtering.

## Base URLs
```text
http://localhost:4001/api/v1/categories
http://localhost:4001/api/v1/brands
```

---

## 1. Categories Endpoints

### 1.1 List All Active Categories
Retrieves all public categories with nested subcategories, slug paths, and image icons.

- **Method:** `GET`
- **Path:** `/api/v1/categories`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f2",
      "did": "cat-001",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Gadgets and gear",
      "image": "https://images.unsplash.com/cat-electronics.jpg",
      "parent": null,
      "children": [
        {
          "_id": "66f4a8c9b3f8e3a5c1d2e7f3",
          "name": "Headphones",
          "slug": "headphones",
          "parent": "66f4a8c9b3f8e3a5c1d2e7f2"
        }
      ]
    }
  ]
}
```

---

### 1.2 Get Category by ID
Retrieves details of a single category by its MongoDB ObjectId or DID.

- **Method:** `GET`
- **Path:** `/api/v1/categories/:id`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f2",
    "did": "cat-001",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Gadgets and gear",
    "image": "https://images.unsplash.com/cat-electronics.jpg",
    "isActive": true
  }
}
```

---

## 2. Brands Endpoints

### 2.1 List All Active Brands
Retrieves all public brand partners with logos and slug identifiers.

- **Method:** `GET`
- **Path:** `/api/v1/brands`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f4",
      "did": "brd-001",
      "name": "Sony",
      "slug": "sony",
      "logo": "https://images.unsplash.com/sony-logo.jpg",
      "isActive": true
    }
  ]
}
```
