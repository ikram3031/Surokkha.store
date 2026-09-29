# Search Products & Analytics API

**Base Prefix**: `/api/v1/search`

Purpose: provides product autocomplete search and tracks user telemetry to power "Recent Searches" and "Popular Searches" recommenders.

---

## 1. Product Search & Autocomplete

**Endpoint**: `GET /`

Returns minimal product info useful for suggestions and search results preview. 

### Query Parameters:
- `q` (string, required) — search term (partial match against product `name`, `brand.name`, and `categories.name`).
- `limit` (number, optional) — max results (default `12`, max `100`).

### Request Headers (Optional):
- `Authorization`: `Bearer <token>` — If provided and valid, the search query is logged to the user's recent search history.

### Response (200):
```json
{
  "data": [
    {
      "id": "67a1f5926b00000000000000",
      "name": "Aromatic Oud",
      "category": "Oud",
      "brand": "Azzaro",
      "image": "https://server.decantrebd.com/uploads/2026/08/aromatic-oud.webp"
    }
  ]
}
```

### Telemetry Behavior:
- Increment count for the searched keyword in the global popular search collection (lowercase, trimmed).
- If authenticated, adds the query to the user's history, removing old duplicates and retaining only the top 10 most recent entries.

---

## 2. Get Popular Searches

**Endpoint**: `GET /popular`

Returns top popular search keywords globally sorted by usage count.

### Query Parameters:
- `limit` (number, optional) — max results (default `8`, max `20`).

### Response (200):
```json
{
  "data": [
    {
      "keyword": "oud wood",
      "count": 142
    },
    {
      "keyword": "bleu de chanel",
      "count": 98
    }
  ]
}
```

---

## 3. Get Recent Searches

**Endpoint**: `GET /recent`

Retrieves the recent search history for the currently logged-in user.

### Request Headers (Required):
- `Authorization`: `Bearer <token>`

### Response (200):
```json
{
  "data": [
    {
      "id": "67bc02245b00000000000001",
      "query": "oud wood",
      "searchedAt": "2026-08-13T00:19:38.102Z"
    }
  ]
}
```

---

## 4. Clear Recent Searches

**Endpoint**: `DELETE /recent` (Also supports fallback `GET /recent/clear` for legacy clients)

Clears the search history. If query `q` is specified, deletes only that keyword. Otherwise, flushes the user's entire history.

### Request Headers (Required):
- `Authorization`: `Bearer <token>`

### Query Parameters:
- `q` (string, optional) — specific search query to delete.

### Response (200):
```json
{
  "success": true,
  "message": "Recent search history cleared"
}
```

---

## Implementation Details:
- **Routes File**: [SearchRoute.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/routes/SearchRoute.js)
- **Controller File**: [SearchController.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/controllers/SearchController.js)
- **Models**: [recentSearch.model.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/models/recentSearch.model.js), [popularSearch.model.js](file:///c:/Users/mdikr/Documents/CODE/AFull/backend/src/models/popularSearch.model.js)
