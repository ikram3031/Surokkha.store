# Users API Documentation

This document describes all available user management endpoints for the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Endpoints

### List users
Retrieves a paginated list of all active users in the system.

**Method:** GET

**URL:** `/api/v1/users`

**Authentication:** Required (Owner or Admin role only)

**Headers:**
```http
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional) - page number, default `1`
- `limit` (optional) - items per page, default `20`

### Success Response
```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "did": "US-123456",
      "fullName": "Manager Account",
      "email": "manager@decantrebd.com",
      "role": "Admin",
      "createdAt": "2026-07-19T10:00:00.000Z"
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

### Get user by ID
Retrieves details of a specific user.

**Method:** GET

**URL:** `/api/v1/users/:userId`

**Authentication:** Required (Owner or Admin role only)

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "did": "US-123456",
    "fullName": "Manager Account",
    "email": "manager@decantrebd.com",
    "role": "Admin",
    "createdAt": "2026-07-19T10:00:00.000Z"
  }
}
```

---

### Create a new user
Creates a new administrative or staff account.

**Method:** POST

**URL:** `/api/v1/users`

**Authentication:** Required (Owner or Admin role only)

**Request Body:**
```json
{
  "fullName": "Staff Member",
  "email": "staff@decantrebd.com",
  "password": "SecurePassword123",
  "role": "Admin"
}
```

### Success Response
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0b2",
    "did": "US-789012",
    "fullName": "Staff Member",
    "email": "staff@decantrebd.com",
    "role": "Admin"
  }
}
```

---

### Update user details
Modifies an existing user's information or role.

**Method:** PUT

**URL:** `/api/v1/users/:userId`

**Authentication:** Required (Owner or Admin role only)

**Request Body:**
```json
{
  "fullName": "Staff Member Updated",
  "role": "Owner"
}
```

### Success Response
```json
{
  "status": "success",
  "message": "User updated successfully"
}
```

---

### Delete user
Permanently removes a user account from the system.

**Method:** DELETE

**URL:** `/api/v1/users/:userId`

**Authentication:** Required (Owner or Admin role only)

### Success Response
```json
{
  "status": "success",
  "message": "User deleted successfully"
}
```
