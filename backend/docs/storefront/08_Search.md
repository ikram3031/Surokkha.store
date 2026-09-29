# Storefront Search & Discovery API

The Search & Discovery API powers customer instant autocomplete suggestions, search analytics tracking, trending search keywords, and personalized recent search history.

## Base URLs
```text
http://localhost:4001/api/v1/search
http://localhost:4001/api/v1/search-products
```

---

## Endpoints

### 1. Instant Autocomplete Search
Fast search across product titles, categories, and brands. If the request includes an `Authorization: Bearer <token>` header, the query is automatically logged to the member's recent search history.

- **Method:** `GET`
- **Paths:**
  - `/api/v1/search?q=keyword`
  - `/api/v1/search-products?q=keyword`
- **Auth:** Optional

#### Query Parameters
- `q` (string, required) - Search term keyword
- `limit` (integer, optional) - Max results (default: `12`)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "id": "66f4a8c9b3f8e3a5c1d2e7f1",
      "name": "Wireless Headphones",
      "category": "Electronics",
      "brand": "Sony",
      "price": 1500,
      "image": "https://images.unsplash.com/photo-headphones.jpg"
    }
  ]
}
```

---

### 2. Get Popular Searches
Retrieves globally trending and frequently searched keywords across all store visitors.

- **Method:** `GET`
- **Path:** `/api/v1/search/popular`
- **Auth:** None (Public)

#### Query Parameters
- `limit` (integer, optional) - Default: `8`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "keyword": "headphones",
      "count": 142
    },
    {
      "keyword": "wireless earbuds",
      "count": 98
    }
  ]
}
```

---

### 3. Get Recent Member Searches
Retrieves the recent search history for the authenticated member.

- **Method:** `GET`
- **Path:** `/api/v1/search/recent`
- **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "id": "66f4a8c9b3f8e3a5c1d2e7f9",
      "query": "wireless headphones",
      "searchedAt": "2026-09-26T15:45:00.000Z"
    }
  ]
}
```
