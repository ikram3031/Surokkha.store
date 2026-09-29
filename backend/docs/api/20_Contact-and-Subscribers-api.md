# Contact & Subscriber API Documentation

This document describes the public contact form submission, admin message management, direct email reply, and newsletter subscriber endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

---

## 1. Newsletter Subscription

Allows storefront customers to subscribe or re-activate their newsletter email subscription.

- **Method:** `POST`
- **URL:** `/api/v1/subscribers`
- **Authentication:** Not required

### Request Body:
```json
{
  "email": "customer@example.com"
}
```

### Success Response (201 Created / 200 OK):
```json
{
  "success": true,
  "message": "Subscribed! Welcome to the club."
}
```

### Error Responses:
- `400 Bad Request`: "Email is required." / "This email is already subscribed."

---

## 2. Public Contact Message Submission

Submits contact inquiry form messages, saves them into the persistent database, sends confirmation email to the customer, and triggers live dashboard notification.

- **Method:** `POST`
- **URL:** `/api/v1/contact`
- **Authentication:** Not required

### Request Body:
```json
{
  "name": "Sarah Khan",
  "email": "sarah@example.com",
  "phone": "+8801712345678",
  "subject": "Bulk order inquiry",
  "message": "I would like to inquire about bulk ordering for wedding gifts."
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Your message has been sent successfully!",
  "data": {
    "did": "4491950281"
  }
}
```

---

## 3. List Contact Messages (Admin)

Lists received contact messages with pagination, search, and status filtering.

- **Method:** `GET`
- **URL:** `/api/v1/contact/messages?page=1&limit=20&status=unread&q=sarah`
- **Authentication:** JWT Bearer Token (Owner, Admin, Manager)

### Success Response (200 OK):
```json
{
  "status": true,
  "data": [
    {
      "id": "673c1...",
      "did": "4491950281",
      "name": "Sarah Khan",
      "email": "sarah@example.com",
      "phone": "+8801712345678",
      "subject": "Bulk order inquiry",
      "message": "I would like to inquire about bulk ordering for wedding gifts.",
      "status": "unread",
      "replies": [],
      "createdAt": "2026-08-28T00:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "stats": {
    "total": 12,
    "unread": 4,
    "read": 5,
    "replied": 3
  }
}
```

---

## 4. Get Message Details & Thread (Admin)

Fetches a single message with its complete reply thread. Automatically marks the message as read if unread.

- **Method:** `GET`
- **URL:** `/api/v1/contact/messages/:id`
- **Authentication:** JWT Bearer Token (Owner, Admin, Manager)

---

## 5. Send Direct Email Reply (Admin)

Sends an email response to the customer via SMTP and appends the reply into the conversation thread.

- **Method:** `POST`
- **URL:** `/api/v1/contact/messages/:id/reply`
- **Authentication:** JWT Bearer Token (Owner, Admin, Manager)

### Request Body:
```json
{
  "message": "Hello Sarah, yes we offer special custom gift sets with discounts for wedding orders."
}
```

### Success Response (200 OK):
```json
{
  "status": true,
  "message": "Reply sent successfully to customer email.",
  "data": { ... }
}
```

---

## 6. Update Message Status (Admin)

- **Method:** `PATCH`
- **URL:** `/api/v1/contact/messages/:id/status`
- **Body:** `{ "status": "read" | "unread" | "replied" }`

---

## 7. Delete Message (Admin)

- **Method:** `DELETE`
- **URL:** `/api/v1/contact/messages/:id`

