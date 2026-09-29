# Auth API Documentation

This document describes all authentication and session management endpoints available in the backend for Dashboard Users / Administrators, including Two-Factor Authentication (2FA) and Google OAuth flows.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/auth`

---

## 1. Endpoints

### 1. Login

Authenticates user credentials. If Two-Factor Authentication is enabled for the account, prompts for 2FA verification instead of directly issuing tokens.

- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Authentication:** Not required

#### Request Body
```json
{
  "email": "user@decantrebd.com",
  "password": "yourPassword123"
}
```

#### Success Response (2FA Disabled)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "did": "US-123456",
      "name": "Admin User",
      "email": "user@decantrebd.com",
      "role": "Admin",
      "lastLogin": "2026-08-22T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "accessTokenExpiresIn": "15m",
    "refreshToken": "4a7b9c...",
    "refreshTokenExpiresAt": "2026-09-21T12:00:00.000Z"
  }
}
```

#### Success Response (2FA Enabled)
```json
{
  "status": "success",
  "requires2fa": true,
  "email": "user@decantrebd.com"
}
```

---

### 2. Send 2FA Setup QR Code

Generates a TOTP secret (if not already created) and emails a QR code to the user's registered email address for setup in Google Authenticator or any TOTP app.

- **Method:** `POST`
- **URL:** `/api/v1/auth/2fa/send-qr`
- **Authentication:** Not required (requires valid email and password in body)

#### Request Body
```json
{
  "email": "user@decantrebd.com",
  "password": "yourPassword123"
}
```

#### Success Response
```json
{
  "status": "success",
  "message": "A QR Code has been sent to your email. Scan it in your Authenticator app to continue."
}
```

---

### 3. Verify 2FA & Complete Login

Verifies the 6-digit TOTP code, enables 2FA for the account, and issues access & refresh tokens upon successful verification.

- **Method:** `POST`
- **URL:** `/api/v1/auth/2fa/verify`
- **Authentication:** Not required

#### Request Body
```json
{
  "email": "user@decantrebd.com",
  "password": "yourPassword123",
  "code": "123456"
}
```

#### Success Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "did": "US-123456",
      "name": "Admin User",
      "email": "user@decantrebd.com",
      "role": "Admin",
      "lastLogin": "2026-08-22T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "accessTokenExpiresIn": "15m",
    "refreshToken": "4a7b9c...",
    "refreshTokenExpiresAt": "2026-09-21T12:00:00.000Z"
  }
}
```

---

### 4. Google OAuth Authentication

Authenticates an administrator via Google OAuth 2.0 authorization code exchange. The user's Google email must already exist in the registered users collection.

- **Method:** `POST`
- **URL:** `/api/v1/auth/google`
- **Authentication:** Not required

#### Request Body
```json
{
  "code": "4/0AeanS0...",
  "redirectUri": "https://dashboard.decantrebd.com/auth/google/callback"
}
```

#### Success Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64a8c9b3f8e3a5c1d2e7f0a1",
      "did": "US-123456",
      "name": "Admin User",
      "email": "user@decantrebd.com",
      "role": "Admin",
      "lastLogin": "2026-08-22T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "accessTokenExpiresIn": "15m",
    "refreshToken": "4a7b9c...",
    "refreshTokenExpiresAt": "2026-09-21T12:00:00.000Z"
  }
}
```

---

### 5. Refresh Token

Rotates the refresh token and issues a new access token.

- **Method:** `POST`
- **URL:** `/api/v1/auth/refresh-token`
- **Authentication:** Not required

#### Request Body
```json
{
  "refreshToken": "4a7b9c..."
}
```

#### Success Response
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "accessTokenExpiresIn": "15m",
    "refreshToken": "new-rotated-refresh-token",
    "refreshTokenExpiresAt": "2026-09-21T12:00:00.000Z"
  }
}
```

---

### 6. Logout

Invalidates the active refresh token in the database.

- **Method:** `POST`
- **URL:** `/api/v1/auth/logout`
- **Authentication:** Not required

#### Request Body
```json
{
  "refreshToken": "4a7b9c..."
}
```

#### Success Response
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## 2. Frontend Integration Guide

### Axios Client & Auto-Refresh Interceptor

```javascript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://server.decantrebd.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Bearer Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized & Token Refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "https://server.decantrebd.com"}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```
