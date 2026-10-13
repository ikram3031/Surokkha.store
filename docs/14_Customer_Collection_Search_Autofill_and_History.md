# 14. Customer Collection, Order Auto-Upsert, Search Auto-Fill & JSON Update History

## 1. Overview

This document describes the architecture and implementation of the dedicated **`Customer` Collection (`customers`)**, automatic customer creation/update during order placement, real-time async customer search and auto-fill in the Dashboard order creation pages (**In-Store Order** & **Custom Order**), and immutable JSON diff tracking in `history: []`.

---

## 2. Database Schema (`CustomerModel`)

**File:** `backend/src/common/models/customer.model.js`  
**Collection Name:** `customers`

### Schema Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `did` | `String` | Auto | Unique human-readable ID (`CUST-<timestamp>-<random>`, e.g., `CUST-M9A1B2C3-X7Y8`) |
| `firstName` | `String` | **Yes** | Customer's first name |
| `lastName` | `String` | No | Customer's last name (defaults to `""`) |
| `phone` | `String` | **Yes** | Normalized 11-digit BD phone number (e.g., `01712345678`), indexed |
| `email` | `String` | No | Lowercase email address, sparse-indexed |
| `address` | `String` | No | Street / House / Area address |
| `thana` | `String` | No | Thana / Upazila name |
| `district` | `String` | No | District name |
| `postcode` | `String` | No | Postal / ZIP code |
| `history` | `[String]` | Default `[]` | Array of JSON strings recording every update diff with previous & new values |
| `totalOrders` | `Number` | Default `0` | Total number of linked orders |
| `lastOrderId` | `ObjectId` | No | Reference to the most recent `Order` |
| `lastOrderNumber` | `String` | No | Most recent `orderNumber` |

### `OrderModel` Reference
In `backend/src/common/models/order.model.js`, each order also stores a reference to its customer record:
```js
customer: { type: Schema.Types.ObjectId, ref: "Customer", index: true }
```

---

## 3. JSON Update History Format (`history: []`)

Whenever an existing customer is matched (by `phone` or `email`) during order creation or updated via the API, the service compares incoming fields (`firstName`, `lastName`, `phone`, `email`, `address`, `thana`, `district`, `postcode`) with the existing values.

If any field has changed, a JSON string is appended to `customer.history`:

```json
{
  "updatedAt": "2026-10-12T01:45:00.000Z",
  "source": "order_create",
  "orderId": "67f9a1c2e4b0a1b2c3d4e5f6",
  "orderNumber": "ORD-20261012-1042",
  "updatedBy": "67f800000000000000000001",
  "changes": {
    "address": {
      "from": "House 10, Road 4, Dhanmondi",
      "to": "House 25, Road 11, Banani"
    },
    "thana": {
      "from": "Dhanmondi",
      "to": "Banani"
    }
  },
  "previousSnapshot": {
    "firstName": "Rahim",
    "lastName": "Uddin",
    "phone": "01712345678",
    "email": "rahim@example.com",
    "address": "House 10, Road 4, Dhanmondi",
    "thana": "Dhanmondi",
    "district": "Dhaka",
    "postcode": "1209"
  }
}
```

---

## 4. Backend Service & API Endpoints

### Service (`backend/src/common/services/customer.service.js`)
- `normalizeCustomerPhone(rawPhone)`: Converts `+8801XXXXXXXXX`, `8801XXXXXXXXX`, or 10-digit `1XXXXXXXXX` into standard 11-digit `01XXXXXXXXX`.
- `parseCustomerNames(rawFullName, rawFirstName, rawLastName)`: Splits a full name into `firstName` (required) and `lastName`.
- `findCustomerByPhoneOrEmail({ phone, email })`: Finds an existing customer by normalized phone (primary) or email (fallback).
- `upsertCustomerFromOrder({ order, payload, updatedBy })`:
  - Triggered automatically in both **Admin Order Creation** (`backend/src/service/controllers/OrdersController.js`) and **Storefront Order Creation** (`backend/src/storefront/controllers/OrdersController.js`).
  - Inserts a new customer if not found, or updates changed fields and appends a JSON diff entry to `history` if found.
- `searchCustomers({ query, limit })`: Performs fast regex matching across `phone`, `email`, `firstName`, `lastName`, and `did`.

### REST API Routes (`backend/src/service/routes/CustomerRoute.js`)
Mounted at `/api/v1/customers`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/customers/search?q=<query>&limit=8` | Real-time async search by phone, email, or name |
| `GET` | `/api/v1/customers/lookup?phone=...&email=...` | Exact lookup by normalized phone or email |
| `GET` | `/api/v1/customers` | Paginated customer list (`page`, `limit`, `q`) |
| `GET` | `/api/v1/customers/:id` | Get single customer details + parsed `history` |
| `PATCH` | `/api/v1/customers/:id` | Direct update of customer fields with JSON diff in `history` |

### Backfill Script (`backend/src/common/scripts/syncCustomersFromOrders.js`)
To sync existing historical orders into the `customers` collection:
```bash
node src/common/scripts/syncCustomersFromOrders.js
```

---

## 5. Dashboard Order Creation Integration (`newOrder.jsx` & `newCustomOrder.jsx`)

### Files Created / Updated
1. **`dashboard/src/hooks/use-customers.js`**
   - `useCustomerSearch(query, enabled)`: Debounced (220ms) React Query hook calling `GET /api/v1/customers/search`.
   - `formatPhoneForOrderInput(phone, targetLength)`: Formats stored 11-digit phone (`01XXXXXXXXX`) to either 10 digits (`1XXXXXXXXX` for `newOrder.jsx` which uses `+880`) or 11 digits (`01XXXXXXXXX` for `newCustomOrder.jsx` which uses `+88`).
2. **`dashboard/src/components/orders/CustomerLookup.jsx`**
   - `<CustomerSuggestionsDropdown />`: Floating dropdown showing matching customers with Name, `did`, Phone, Email, Address/Thana/District, total orders badge, and update history count.
   - `<SelectedCustomerBanner />`: Displays the currently selected customer above the form:
     - Shows **Auto-filled** status or **Modified — will update & log to history** badge when the operator edits any auto-filled field (`Name`, `Phone`, `Email`, `Address`, `District`, `Thana`, `Postcode`).
     - Includes a **History (N)** button that opens a dialog displaying all historical JSON update diffs (`from` → `to` per field with timestamp and order number).
3. **`dashboard/src/pages/dashboard/orders/newOrder.jsx` (In-Store Order)** & **`dashboard/src/pages/dashboard/orders/newCustomOrder.jsx` (Custom Order)**
   - Typing in **Customer Full Name**, **Phone Number**, or **Email Address** triggers real-time search.
   - Selecting a customer auto-fills `Name`, `Phone`, `Email`, `Address`, `District`, `Thana`, and `Postal Code`.
   - Submitting the order with modified fields automatically updates the `Customer` document and pushes the JSON diff record into `customer.history`.
