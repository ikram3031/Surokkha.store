# Storefront Orders & Checkout API

The Storefront Orders API handles customer order placement, checkout calculations, order status lookups, and invoice HTML/PDF rendering.

## Base URL
```text
http://localhost:4001/api/v1/orders
```

---

## Endpoints

### 1. Create New Order (Checkout)
Places an order from the customer checkout payload. Supports Cash on Delivery (COD), bKash, Nagad, and digital payment gateways. Automatically triggers inventory deduction, email notifications, and optional Meta CAPI/TikTok pixel events.

- **Method:** `POST`
- **Path:** `/api/v1/orders/new-order`
- **Auth:** None (Public / Guest Checkout & Authenticated Members)

#### Request Body
```json
{
  "customer": {
    "name": "Rahim Uddin",
    "phone": "01812345678",
    "email": "rahim@example.com",
    "address": "House 12, Road 5, Mirpur-10, Dhaka"
  },
  "shippingAddress": {
    "address": "House 12, Road 5, Mirpur-10",
    "city": "Dhaka",
    "zone": "Inside Dhaka"
  },
  "items": [
    {
      "product": "66f4a8c9b3f8e3a5c1d2e7f1",
      "productDid": "prod-001",
      "name": "Wireless Headphones",
      "price": 1500,
      "quantity": 1,
      "total": 1500
    }
  ],
  "paymentMethod": "cod",
  "couponCode": "DISCOUNT10",
  "subTotal": 1500,
  "discount": 150,
  "shippingCost": 60,
  "totalAmount": 1410,
  "notes": "Please deliver after 5 PM"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "status": "success",
  "message": "Order placed successfully",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f5",
    "orderId": "ORD-20260926-1001",
    "id": 1001,
    "status": "pending",
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "totalAmount": 1410,
    "customer": {
      "name": "Rahim Uddin",
      "phone": "01812345678",
      "email": "rahim@example.com"
    },
    "createdAt": "2026-09-26T15:30:00.000Z"
  }
}
```

---

### 2. Lookup Order Details
Retrieves details of an order using its public `orderId` (e.g. `ORD-20260926-1001`), numeric ID (e.g. `1001`), or MongoDB `_id`.

- **Method:** `GET`
- **Path:** `/api/v1/orders/:orderId`
- **Auth:** None (Public)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e7f5",
    "orderId": "ORD-20260926-1001",
    "status": "pending",
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "totalAmount": 1410,
    "items": [
      {
        "name": "Wireless Headphones",
        "price": 1500,
        "quantity": 1,
        "total": 1500
      }
    ]
  }
}
```

---

### 3. View / Download Printable Invoice
Renders a printable, styled HTML invoice document suitable for download or embedding in webviews.

- **Method:** `GET`
- **Path:** `/api/v1/orders/:orderId/invoice`
- **Auth:** None (Public)

#### Response (`200 OK`)
- **Content-Type:** `text/html; charset=utf-8`
- Returns high-fidelity rendered HTML invoice.
