# Email API Documentation

This document describes the email endpoint used by the website to send test emails.

## Base URL

```text
https://server.decantrebd.com/api/v1/sendEmail
```

## Endpoint

### Send a test email

**Method:** GET or POST

**URL:** `/api/v1/sendEmail`

### Query Parameters

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| `email`   | string | Yes      | Recipient email address |

### Request Example

**GET**

```text
GET /api/v1/sendEmail?email=someone@example.com
```

**POST**

```json
{
  "email": "someone@example.com"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Email sent successfully",
  "email": "someone@example.com"
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Valid email is required"
}
```

## Notes

- The route uses the SMTP credentials from the environment file.
- It sends a simple test email with subject: `Testing successful`.
- Make sure `.env` contains valid SMTP values before testing.
