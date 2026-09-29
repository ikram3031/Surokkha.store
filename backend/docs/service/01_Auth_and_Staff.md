# Service Authentication & Staff Management API

The Service Authentication & Staff Management API handles administrative authentication, 2FA validation, staff role-based access control (RBAC), and team user management for the administrative dashboard.

## Base URLs
```text
http://localhost:4002/api/v1/auth
http://localhost:4002/api/v1/users
```
*(Mounted under `/api/v2` and `/api/v1`)*

---

## 1. Authentication Endpoints

### 1.1 Administrator Login
Authenticates administrative staff credentials (`Owner`, `Admin`, `Manager`, `Marketing-Expert`). If 2FA is enabled on the account, triggers 2FA prompt.

- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Auth:** None (Public)

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

#### Response (`200 OK` - 2FA Disabled)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "66f4a8c9b3f8e3a5c1d2e7f0",
      "username": "adminuser",
      "email": "admin@example.com",
      "role": "Admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

---

### 1.2 Refresh Access Token
Issues a new JWT access token using a valid refresh token.

- **Method:** `POST`
- **Path:** `/api/v1/auth/refresh-token`
- **Auth:** None

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

### 1.3 Administrator Logout
Invalidates the administrator's refresh session.

- **Method:** `POST`
- **Path:** `/api/v1/auth/logout`
- **Auth:** Bearer Token / Optional

---

## 2. Staff User Management Endpoints

> **Role Restriction:** All `/api/v1/users` endpoints require `Owner` or `Admin` role.

### 2.1 List Staff Users
Retrieves a paginated list of all administrative and staff team accounts.

- **Method:** `GET`
- **Path:** `/api/v1/users`
- **Auth:** Required (`Owner`, `Admin`)

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": [
    {
      "_id": "66f4a8c9b3f8e3a5c1d2e7f0",
      "username": "adminuser",
      "email": "admin@example.com",
      "role": "Admin",
      "isActive": true,
      "createdAt": "2026-09-26T15:00:00.000Z"
    }
  ]
}
```

---

### 2.2 Create Staff User
Creates a new staff member with a specified role (`Admin`, `Manager`, `Marketing-Expert`).

- **Method:** `POST`
- **Path:** `/api/v1/users`
- **Auth:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "username": "sarah_manager",
  "email": "sarah@example.com",
  "password": "Password123!",
  "role": "Manager"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "_id": "66f4a8c9b3f8e3a5c1d2e801",
    "username": "sarah_manager",
    "email": "sarah@example.com",
    "role": "Manager"
  }
}
```

---

### 2.3 Get Staff User by ID
- **Method:** `GET`
- **Path:** `/api/v1/users/:userId`
- **Auth:** Required (`Owner`, `Admin`)

---

### 2.4 Update Staff User
- **Method:** `PUT`
- **Path:** `/api/v1/users/:userId`
- **Auth:** Required (`Owner`, `Admin`)

#### Request Body
```json
{
  "username": "sarah_lead",
  "role": "Admin"
}
```

---

### 2.5 Delete Staff User
- **Method:** `DELETE`
- **Path:** `/api/v1/users/:userId`
- **Auth:** Required (`Owner`, `Admin`)
