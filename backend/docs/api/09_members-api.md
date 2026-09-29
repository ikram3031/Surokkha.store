# Members API Documentation

This document describes the member collection endpoints for the backend.

## Base Path

`/api/v1/members`

## Authentication

The following public endpoints do not require a JWT token:

- `POST /api/v1/members/register`
- `POST /api/v1/members/login`
- `POST /api/v1/members/check-email`
- `POST /api/v1/members/refresh-token`
- `POST /api/v1/members/logout`
- `POST /api/v1/members/verify-otp`
- `POST /api/v1/members/resend-otp`
- `POST /api/v1/members/forgot-password`
- `POST /api/v1/members/reset-password`

The following member-management endpoints require a valid access token:

- `POST /api/v1/members`
- `GET /api/v1/members`
- `GET /api/v1/members/:memberId`
- `PUT /api/v1/members/:memberId`
- `DELETE /api/v1/members/:memberId`
- `POST /api/v1/members/:memberId/change-password`

## Endpoints

### Register Member

**Method:** POST

**URL:** `/api/v1/members/register`

### Request Body

```json
{
  "name": "Member Name",
  "email": "member@example.com",
  "phone": "+8801XXXXXXXXX",
  "password": "securePassword123",
  "role": "Customer",
  "billingInfo": {
    "firstName": "Member",
    "lastName": "Name",
    "company": "",
    "address1": "123 Main Street",
    "address2": "",
    "district": "Dhaka",
    "city": "Dhaka",
    "state": "Dhaka",
    "postcode": "1207",
    "country": "Bangladesh",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX"
  },
  "shippingInfo": {
    "firstName": "Member",
    "lastName": "Name",
    "company": "",
    "address1": "123 Main Street",
    "address2": "",
    "district": "Dhaka",
    "city": "Dhaka",
    "state": "Dhaka",
    "postcode": "1207",
    "country": "Bangladesh",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX"
  }
}
```

### Success Response

```json
{
  "status": "success",
  "message": "An OTP to verify your account has been sent to your email.",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "email": "member@example.com",
    "expiresAt": "2026-07-26T12:34:56.789Z"
  }
}
```

### Login Member

**Method:** POST

**URL:** `/api/v1/members/login`

### Request Body

```json
{
  "email": "member@example.com",
  "password": "securePassword123"
}
```

### Success Response

If the email is already verified:

```json
{
  "status": "success",
  "isEmailVerified": true,
  "data": {
    "user": {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "name": "Member Name",
      "email": "member@example.com",
      "phone": "+8801XXXXXXXXX",
      "role": "Customer"
    },
    "accessToken": "jwt-access-token",
    "accessTokenExpiresIn": "15m",
    "refreshToken": "refresh-token-string",
    "refreshTokenExpiresAt": "2026-07-26T12:34:56.789Z"
  }
}
```

### Check Member Email

Checks if an email exists and is verified. If the email is registered but unverified, a verification OTP is automatically generated and sent via email.

**Method:** POST

**URL:** `/api/v1/members/check-email`

**Request Body:**
```json
{
  "email": "member@example.com"
}
```

**Success Response (Verified):**
```json
{
  "status": "success",
  "isEmailVerified": true,
  "data": {
    "email": "member@example.com"
  }
}
```

**Success Response (Unverified):**
```json
{
  "status": "success",
  "requiresOtp": true,
  "isEmailVerified": false,
  "message": "Your email is not verified. A verification code has been sent to your email.",
  "data": {
    "email": "member@example.com",
    "expiresAt": "2026-07-26T12:34:56.789Z"
  }
}
```

---

### Refresh Member Token

Rotates the member refresh token and returns a new access token and refresh token pair.

**Method:** POST

**URL:** `/api/v1/members/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "member-refresh-token-string"
}
```

**Success Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "new-jwt-access-token",
    "accessTokenExpiresIn": "20m",
    "refreshToken": "new-rotated-refresh-token",
    "refreshTokenExpiresAt": "2026-08-25T12:34:56.789Z"
  }
}
```

---

### Logout Member

Invalidates the member refresh token.

**Method:** POST

**URL:** `/api/v1/members/logout`

**Request Body:**
```json
{
  "refreshToken": "member-refresh-token-string"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### Verify OTP

**Method:** POST

**URL:** `/api/v1/members/verify-otp`

### Request Body

```json
{
  "email": "member@example.com",
  "otp": "123456"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Verified successfully",
  "isEmailVerified": true,
  "data": {
    "user": {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "name": "Member Name",
      "email": "member@example.com",
      "phone": "+8801XXXXXXXXX",
      "role": "Customer"
    }
  }
}
```

### Resend OTP

**Method:** POST

**URL:** `/api/v1/members/resend-otp`

### Request Body

```json
{
  "email": "member@example.com"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "A new OTP has been sent to your email.",
  "data": {
    "email": "member@example.com",
    "expiresAt": "2026-07-26T12:34:56.789Z",
    "otp": "123456",
    "otpExpiresAt": "2026-07-26T12:34:56.789Z"
  }
}
```

> Note: The OTP field is returned for testing purposes in the current implementation and should not be considered a production-safe response shape.

### Forgot Password

**Method:** POST

**URL:** `/api/v1/members/forgot-password`

### Request Body

```json
{
  "email": "member@example.com"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "If an account with this email exists, a password reset OTP has been sent.",
  "data": {
    "email": "member@example.com",
    "expiresAt": "2026-07-26T12:34:56.789Z"
  }
}
```

### Reset Password

**Method:** POST

**URL:** `/api/v1/members/reset-password`

### Request Body

```json
{
  "email": "member@example.com",
  "otp": "123456",
  "password": "newSecurePassword123"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

### List Members

**Method:** GET

**URL:** `/api/v1/members`

### Query Params

- `page` (optional, default `1`)
- `limit` (optional, default `15`)
- `q` (optional, supports case-insensitive search on `name`, `email`, and `phone`)
- `segment` (optional, filter by member segment)

### Success Response

```json
{
  "status": "success",
  "data": [
    {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "name": "Member Name",
      "email": "member@example.com",
      "phone": "+8801XXXXXXXXX",
      "role": "Customer",
      "billingInfo": {
        "firstName": "Member",
        "lastName": "Name",
        "company": "",
        "address1": "123 Main Street",
        "address2": "",
        "district": "Dhaka",
        "city": "Dhaka",
        "state": "Dhaka",
        "postcode": "1207",
        "country": "Bangladesh",
        "email": "member@example.com",
        "phone": "+8801XXXXXXXXX"
      },
      "shippingInfo": {
        "firstName": "Member",
        "lastName": "Name",
        "company": "",
        "address1": "123 Main Street",
        "address2": "",
        "district": "Dhaka",
        "city": "Dhaka",
        "state": "Dhaka",
        "postcode": "1207",
        "country": "Bangladesh",
        "email": "member@example.com",
        "phone": "+8801XXXXXXXXX"
      },
      "orders": [],
      "createdAt": "2026-07-26T12:34:56.789Z",
      "updatedAt": "2026-07-26T12:34:56.789Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 15,
    "totalPages": 1
  }
}
```

### Get Member by ID

**Method:** GET

**URL:** `/api/v1/members/:memberId`

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "name": "Member Name",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX",
    "role": "Customer",
    "billingInfo": { ... },
    "shippingInfo": { ... },
    "orders": [],
    "createdAt": "2026-07-26T12:34:56.789Z",
    "updatedAt": "2026-07-26T12:34:56.789Z"
  }
}
```

### Create Member

**Method:** POST

**URL:** `/api/v1/members`

### Request Body

```json
{
  "name": "Member Name",
  "email": "member@example.com",
  "phone": "+8801XXXXXXXXX",
  "password": "securePassword123",
  "billingInfo": {
    "firstName": "Member",
    "lastName": "Name",
    "company": "",
    "address1": "123 Main Street",
    "address2": "",
    "district": "Dhaka",
    "city": "Dhaka",
    "state": "Dhaka",
    "postcode": "1207",
    "country": "Bangladesh",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX"
  },
  "shippingInfo": {
    "firstName": "Member",
    "lastName": "Name",
    "company": "",
    "address1": "123 Main Street",
    "address2": "",
    "district": "Dhaka",
    "city": "Dhaka",
    "state": "Dhaka",
    "postcode": "1207",
    "country": "Bangladesh",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX"
  }
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "name": "Member Name",
    "email": "member@example.com",
    "phone": "+8801XXXXXXXXX",
    "role": "Customer",
    "billingInfo": { ... },
    "shippingInfo": { ... },
    "orders": [],
    "createdAt": "2026-07-26T12:34:56.789Z",
    "updatedAt": "2026-07-26T12:34:56.789Z"
  }
}
```

### Update Member

**Method:** PUT

**URL:** `/api/v1/members/:memberId`

### Request Body

```json
{
  "name": "New Member Name",
  "email": "newmember@example.com",
  "phone": "+8801YYYYYYYYY",
  "password": "newSecurePassword123",
  "billingInfo": { ... },
  "shippingInfo": { ... }
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "64a8c9b3f8e3a5c1d2e7f0a1",
    "name": "New Member Name",
    "email": "newmember@example.com",
    "phone": "+8801YYYYYYYYY",
    "role": "Customer",
    "billingInfo": { ... },
    "shippingInfo": { ... },
    "orders": [],
    "createdAt": "2026-07-26T12:34:56.789Z",
    "updatedAt": "2026-07-26T12:45:00.123Z"
  }
}
```

### Change Password

**Method:** POST

**URL:** `/api/v1/members/:memberId/change-password`

### Request Body

```json
{
  "newPassword": "newSecurePassword123"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

### Delete Member

**Method:** DELETE

**URL:** `/api/v1/members/:memberId`

### Success Response

```json
{
  "status": "success",
  "message": "Member deleted successfully"
}
```

## Notes

- `name`, `email`, `phone`, and `password` are required for registration and member creation.
- `password` must be at least 6 characters.
- `billingInfo` and `shippingInfo` are optional on create and update; they are sanitized and validated only when present.
- The member list supports pagination, keyword search, and optional segment filtering.
- Protected member-management endpoints require a valid JWT access token.
- Member payloads returned by the API do not expose password or OTP fields.
