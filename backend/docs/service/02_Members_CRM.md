# Service Customer Members & CRM API

The Members & Customer Relationship Management (CRM) API provides management of registered store customers, customer profiles, order histories, email verification flows, OTP handling, and password resets.

## Base URL
```text
http://localhost:4002/api/v1/members
```

---

## 1. Protected Admin Member Management Endpoints

> **Role Restriction:** Requires valid JWT Token (`Owner`, `Admin`, `Manager`).

### 1.1 List Customer Members
Retrieves paginated registered customer profiles with search and filtering.

- **Method:** `GET`
- **Path:** `/api/v1/members`
- **Auth:** Required

#### Query Parameters
- `page` (integer, default: `1`)
- `limit` (integer, default: `20`)
- `q` / `search` (string) - Search customer name, email, phone

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e802",
      "name": "VIP Client",
      "email": "vip@example.com",
      "phone": "01711223344",
      "isActive": true,
      "emailVerified": true,
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

### 1.2 Create Member Record
Manually creates a new customer profile.

- **Method:** `POST`
- **Path:** `/api/v1/members`
- **Auth:** Required

#### Request Body
```json
{
  "name": "New VIP Client",
  "email": "vip2@example.com",
  "password": "Password123!",
  "phone": "01799887766"
}
```

---

### 1.3 Get Member Details & Order History
- **Method:** `GET`
- **Path:** `/api/v1/members/:memberId`
- **Auth:** Required

---

### 1.4 Update Member Record
- **Method:** `PUT`
- **Path:** `/api/v1/members/:memberId`
- **Auth:** Required

#### Request Body
```json
{
  "name": "VIP Client Gold",
  "phone": "01711223344",
  "isActive": true
}
```

---

### 1.5 Delete Member Record
- **Method:** `DELETE`
- **Path:** `/api/v1/members/:memberId`
- **Auth:** Required (`Owner`, `Admin`, `Manager`)

---

## 2. Customer Member Auth & Lifecycle Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/members/register` | Customer sign-up & triggers OTP dispatch |
| `POST` | `/api/v1/members/verify-otp` | Verifies 6-digit email registration OTP |
| `POST` | `/api/v1/members/resend-otp` | Re-dispatches OTP email |
| `POST` | `/api/v1/members/login` | Member credentials login |
| `POST` | `/api/v1/members/forgot-password` | Requests password reset OTP/link |
| `POST` | `/api/v1/members/reset-password` | Submits new password with token |
| `POST` | `/api/v1/members/refresh-token` | Refreshes member auth session |
| `POST` | `/api/v1/members/logout` | Clears member refresh session |
