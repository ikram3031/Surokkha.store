# System & Infrastructure API Documentation

This document describes internal, health check, version inspection, Scalar interactive documentation, and developer system infrastructure endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

---

## 1. System Info & Health

Returns system runtime info, backend package version, Node.js version, uptime, and execution environment.

- **Method:** `GET`
- **URL:** `/api/v1/system/info`
- **Authentication:** Required (`Owner`, `Admin`, `Manager`, `Super Admin`)

### Headers:
```http
Authorization: Bearer <accessToken>
```

### Success Response (200 OK):
```json
{
  "status": "success",
  "data": {
    "backendVersion": "2.0.1",
    "nodeVersion": "v20.x.x",
    "environment": "production",
    "uptimeSeconds": 14520,
    "timestamp": "2026-08-22T12:00:00.000Z"
  }
}
```

---

## 2. API Version Endpoint

Public/Protected version check endpoint mounted directly on `/api/v1/version`.

- **Method:** `GET`
- **URL:** `/api/v1/version`
- **Authentication:** Required (`Owner`, `Admin`)

### Success Response (200 OK):
```json
{
  "status": "success",
  "version": "2.0.1"
}
```

---

## 3. Interactive Developer API Reference (Scalar UI)

Provides a modern, high-performance Stripe/Vercel-style interactive API reference and live endpoint sandbox powered by Scalar OpenAPI 3.0.

- **Method:** `GET`
- **URL:** `/api/v1/developer/docs`
- **Authentication:** Not required (Public Developer Explorer)
- **Response Format:** Interactive HTML (`text/html`)

---

## 4. Developer Realtime Telemetry Logs

Provides real-time streaming (SSE) and buffered access to HTTP request logs. Access is strictly restricted to the authorized developer account (`ikramul.web@gmail.com`).

### 4.1 Recent Logs Buffer (Polling)
- **Method:** `GET`
- **URL:** `/api/v1/developer/logs`
- **Authentication:** Required (`ikramul.web@gmail.com` verified)

### 4.2 Real-time Logs Event Stream (SSE)
- **Method:** `GET`
- **URL:** `/api/v1/developer/logs/stream`
- **Authentication:** Required (`ikramul.web@gmail.com` verified)
- **Content-Type:** `text/event-stream`

---

## 5. Developer Database Compressed Backup

Generates and downloads a Gzip-compressed JSON snapshot (`mongodb_backup_<timestamp>.json.gz`) of all MongoDB database collections.

- **Method:** `GET`
- **URL:** `/api/v1/developer/db-backup`
- **Authentication:** Required (`ikramul.web@gmail.com` verified)
- **Response:** `application/gzip` binary attachment
