# Service Orders & Fulfillment Management API

The Service Orders Management API allows administrators and store managers to view, filter, update, bulk-modify, and delete customer orders.

## Base URL
```text
http://localhost:4002/api/v1/orders
```

---

## Endpoints

### 1. List All Orders
Retrieves paginated orders with customer, payment, and status filters.

- **Method:** `GET`
- **Path:** `/api/v1/orders`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Query Parameters
- `page` (integer, default: `1`)
- `limit` (integer, default: `20`)
- `status` (string) - `pending`, `processing`, `confirmed`, `shipped`, `delivered`, `cancelled`, `refunded`
- `paymentStatus` (string) - `paid`, `unpaid`, `failed`
- `q` / `search` (string) - Search customer name, phone, email, or orderId

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e804",
      "orderId": "ORD-SRV-1001",
      "id": 2001,
      "status": "confirmed",
      "paymentMethod": "bkash",
      "paymentStatus": "paid",
      "totalAmount": 4560,
      "customer": {
        "name": "VIP Client",
        "phone": "01711223344",
        "email": "vip@example.com",
        "address": "Banani, Dhaka"
      },
      "createdAt": "2026-09-26T15:00:00.000Z"
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

### 2. Update Order Status
Updates an order's fulfillment and delivery lifecycle status.

- **Method:** `PUT`
- **Path:** `/api/v1/orders/:orderId`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Request Body
```json
{
  "status": "shipped",
  "notes": "Dispatched via Pathao Courier #PTH-992211"
}
```

---

### 3. Bulk Update Order Statuses
Batch updates fulfillment or payment statuses for multiple orders simultaneously.

- **Method:** `POST`
- **Path:** `/api/v1/orders/bulk-update`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

#### Request Body
```json
{
  "orderIds": [
    "66f4a8c9b3f8e3a5c1d2e804",
    "66f4a8c9b3f8e3a5c1d2e805"
  ],
  "status": "delivered",
  "paymentStatus": "paid"
}
```

---

### 4. Bulk Delete Orders
Batch deletes multiple orders and cleans up linked member/payment records.

- **Method:** `POST`
- **Path:** `/api/v1/orders/bulk-delete`
- **Auth:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "orderIds": [
    "66f4a8c9b3f8e3a5c1d2e804"
  ]
}
```

---

### 5. Delete Order by ID
- **Method:** `DELETE`
- **Path:** `/api/v1/orders/:orderId`
- **Auth:** Required (`Owner`, `Admin`)
