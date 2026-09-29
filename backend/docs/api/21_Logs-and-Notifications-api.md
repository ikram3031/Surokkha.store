# Activity & Notification Logs API Documentation

This document describes the administrative activity log tracking, order notification fetching, read state toggles, and bulk log deletion endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/logs`

## Notes

- All logs endpoints require a valid JWT access token (`Authorization: Bearer <token>`).

---

## 1. List Activity Logs

Retrieves a paginated list of active system activity logs.

- **Method:** `GET`
- **URL:** `/api/v1/logs`
- **Authentication:** Required

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | Integer | No | `1` | Page number |
| `limit` | Integer | No | `20` | Max logs per page (Max: 100) |
| `type` | String | No | - | Filter by log type (e.g. `newOrder`, `created`, `updated`) |
| `readStatus` | Boolean | No | - | Filter by read status (`true` / `false`) |
| `q` | String | No | - | Search query matching description, creator, or DID |

### Success Response (200 OK):
```json
{
  "status": true,
  "data": [
    {
      "id": "66b583908a24d5b9423c5700",
      "did": "log-1723188112345",
      "type": "newOrder",
      "typeDid": "111",
      "description": "Nadia Rahman placed a new order #ORD-20260719-123456",
      "readStatus": false,
      "active": true,
      "createdBy": "storefront",
      "createdAt": "2026-08-09T06:01:52.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 2. Get Top 5 Order Notifications & Unread Count

Returns the top 5 most recent `newOrder` notification logs and total unread order notification count for the dashboard navbar bell indicator.

- **Method:** `GET`
- **URL:** `/api/v1/logs/notifications`
- **Authentication:** Required

### Success Response (200 OK):
```json
{
  "status": true,
  "data": [
    {
      "id": "66b583908a24d5b9423c5700",
      "did": "log-1723188112345",
      "type": "newOrder",
      "description": "Nadia Rahman placed a new order #ORD-20260719-123456",
      "readStatus": false,
      "createdAt": "2026-08-09T06:01:52.000Z"
    }
  ],
  "unreadCount": 3
}
```

---

## 3. Create Custom Activity Log

- **Method:** `POST`
- **URL:** `/api/v1/logs`
- **Authentication:** Required

### Request Body:
```json
{
  "type": "created",
  "description": "Admin manually adjusted stock inventory for Sauvage Elixir",
  "readStatus": true
}
```

### Success Response (201 Created):
```json
{
  "status": true,
  "data": {
    "id": "66b583908a24d5b9423c5701",
    "type": "created",
    "description": "Admin manually adjusted stock inventory for Sauvage Elixir",
    "readStatus": true
  },
  "message": "Log created successfully."
}
```

---

## 4. Mark Logs as Read

- **Method:** `PUT`
- **URL:** `/api/v1/logs/mark-read`
- **Authentication:** Required

### Request Body (Optional - if omitted, marks all unread `newOrder` logs as read):
```json
{
  "ids": ["66b583908a24d5b9423c5700", "log-1723188112345"]
}
```

### Success Response (200 OK):
```json
{
  "status": true,
  "message": "Logs marked as read successfully."
}
```

---

## 5. Mark Logs as Unread

- **Method:** `PUT`
- **URL:** `/api/v1/logs/mark-unread`
- **Authentication:** Required

### Request Body:
```json
{
  "ids": ["66b583908a24d5b9423c5700"]
}
```

### Success Response (200 OK):
```json
{
  "status": true,
  "message": "Logs marked as unread successfully."
}
```

---

## 6. Delete Single Log (Soft Delete)

- **Method:** `DELETE`
- **URL:** `/api/v1/logs/:id`
- **Authentication:** Required

### Success Response (200 OK):
```json
{
  "status": true,
  "message": "Log deleted successfully."
}
```

---

## 7. Bulk Delete Logs (Soft Delete)

- **Method:** `POST`
- **URL:** `/api/v1/logs/bulk-delete`
- **Authentication:** Required

### Request Body:
```json
{
  "ids": ["66b583908a24d5b9423c5700", "66b583908a24d5b9423c5702"]
}
```

### Success Response (200 OK):
```json
{
  "status": true,
  "message": "2 logs deleted successfully."
}
```

---

## 8. Real-time WebSocket Notifications

Provides a real-time bi-directional channel for instant order and activity notifications to the dashboard without polling.

### Connection Details

- **Protocol:** `ws://` / `wss://`
- **URL:** `wss://server.decantrebd.com/ws/notifications?token=<accessToken>` (or `wss://server.decantrebd.com/api/v1/ws/notifications?token=<accessToken>`)
- **Authentication:** Required (Valid Access Token in query parameter `?token=...` or `Sec-WebSocket-Protocol` header)

### Server Events Sent to Client

#### 1. `INIT_NOTIFICATIONS`
Sent immediately upon connection with the current top 5 unread/recent notifications and total unread count.
```json
{
  "event": "INIT_NOTIFICATIONS",
  "data": {
    "notifications": [
      {
        "id": "66b583908a24d5b9423c5700",
        "did": "log-1723188112345",
        "type": "newOrder",
        "typeDid": "111",
        "description": "Nadia Rahman placed a new order #ORD-20260719-123456",
        "readStatus": false,
        "createdAt": "2026-08-09T06:01:52.000Z"
      }
    ],
    "unreadCount": 3
  }
}
```

#### 2. `NEW_NOTIFICATION`
Triggered and broadcasted in real time whenever a new order is placed or an activity log is created.
```json
{
  "event": "NEW_NOTIFICATION",
  "data": {
    "log": {
      "id": "66b583908a24d5b9423c5703",
      "did": "log-1723188112399",
      "type": "newOrder",
      "typeDid": "111",
      "description": "Kamal Hossain placed a new order #ORD-20260822-987654",
      "readStatus": false,
      "active": true,
      "createdBy": "storefront",
      "createdAt": "2026-08-22T14:15:00.000Z"
    },
    "unreadCount": 4
  }
}
```

#### 3. `NOTIFICATION_READ_UPDATE`
Broadcasted when logs are marked as read or unread to keep all open dashboard tabs synchronized.
```json
{
  "event": "NOTIFICATION_READ_UPDATE",
  "data": {
    "unreadCount": 0
  }
}
```

### Client Heartbeat / Ping-Pong
- Clients can send `{"event": "PING"}` and receive `{"event": "PONG", "timestamp": ...}` to maintain keepalive.

