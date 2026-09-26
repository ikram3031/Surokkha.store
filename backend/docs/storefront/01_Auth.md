# Storefront Authentication & Session API

The Storefront Authentication API handles customer/member authentication, Google Single Sign-On (SSO), Two-Factor Authentication (2FA), and JWT token management for customer-facing applications.

## Base URL
```text
http://localhost:4001/api/v1/auth
```
*(Production: `https://api.yourdomain.com/api/v1/auth`)*

---

## Endpoints

### 1. Customer Login
Authenticates customer credentials and issues access & refresh tokens.

- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Auth:** None (Public)

#### Request Body
```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "66f4a8c9b3f8e3a5c1d2e7f0",
      "name": "Customer One",
      "email": "customer@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

---

### 2. Google OAuth Login / SSO
Authenticates or registers a customer via Google OAuth ID token.

- **Method:** `POST`
- **Path:** `/api/v1/auth/google`
- **Auth:** None (Public)

#### Request Body
```json
{
  "credential": "GOOGLE_ID_TOKEN_STRING"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "66f4a8c9b3f8e3a5c1d2e7f0",
      "name": "Jane Customer",
      "email": "jane@gmail.com",
      "role": "customer",
      "avatar": "https://lh3.googleusercontent.com/..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

---

### 3. Refresh Access Token
Exchanges a valid refresh token for a fresh access token.

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
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

### 4. Customer Logout
Terminates customer session and invalidates refresh tokens.

- **Method:** `POST`
- **Path:** `/api/v1/auth/logout`
- **Auth:** Optional / Bearer Token

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
  "message": "Logged out successfully"
}
```

---

### 5. Send 2FA Setup QR Code
Generates TOTP secret and emails setup QR code to the customer.

- **Method:** `POST`
- **Path:** `/api/v1/auth/2fa/send-qr`
- **Auth:** None

#### Request Body
```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "A QR Code has been sent to your email. Scan it in your Authenticator app to continue."
}
```

---

### 6. Verify 2FA OTP
Validates the 6-digit TOTP code to complete login.

- **Method:** `POST`
- **Path:** `/api/v1/auth/2fa/verify`
- **Auth:** None

#### Request Body
```json
{
  "email": "customer@example.com",
  "code": "123456"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```
