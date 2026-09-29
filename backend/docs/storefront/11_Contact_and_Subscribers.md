# Storefront Contact & Newsletter Subscribers API

The Storefront Contact & Newsletter Subscribers API handles customer newsletter opt-ins and general contact/support inquiry form submissions.

## Base URLs
```text
http://localhost:4001/api/v1/subscribers
http://localhost:4001/api/v1/contact
```

---

## 1. Newsletter Subscription

### 1.1 Subscribe Email
Subscribes a customer's email address to marketing campaigns, discount alerts, and newsletter updates.

- **Method:** `POST`
- **Path:** `/api/v1/subscribers`
- **Auth:** None (Public)

#### Request Body
```json
{
  "email": "customer@example.com"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "success": true,
  "status": "success",
  "message": "Subscribed! Welcome to the club."
}
```

---

## 2. Customer Contact Form Submission

### 2.1 Submit Inquiry Message
Submits a customer support message, saves the inquiry, sends a confirmation notification, and routes the ticket to admin support.

- **Method:** `POST`
- **Path:** `/api/v1/contact`
- **Auth:** None (Public)

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "01700000000",
  "subject": "Warranty and replacement inquiry",
  "message": "Hello, I wanted to verify the return policy for electronic accessories."
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "success": true,
  "status": "success",
  "message": "Your message has been sent successfully!",
  "data": {
    "did": "CNT-99881122"
  }
}
```
