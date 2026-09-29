# Invoice Email API Documentation

This endpoint sends a styled invoice email using SMTP credentials configured in the backend.

## Base URL

```text
https://server.decantrebd.com/api/v1/sendEmail/invoice
```

## Endpoint

### Send invoice email

**Method:** POST

**URL:** `/api/v1/sendEmail/invoice`

### Request Body

```json
{
  "email": "customer@example.com",
  "invoiceNumber": "INV-0001",
  "createdDate": "2026-07-19",
  "dueDate": "2026-08-19",
  "sellerName": "Decantre",
  "sellerAddress": "House 20, Rd 10, Uttara, Dhaka 1230",
  "buyerName": "Acme Corp.",
  "buyerAddress": "John Doe, john@example.com",
  "buyerEmail": "buyer@example.com",
  "paymentMethod": "Check",
  "paymentReference": "1000",
  "items": [
    {
      "description": "Website design",
      "price": "$300.00",
      "total": "$300.00"
    },
    {
      "description": "Hosting (3 months)",
      "price": "$75.00",
      "total": "$75.00"
    },
    {
      "description": "Domain name (1 year)",
      "price": "$10.00",
      "total": "$10.00"
    }
  ],
  "subtotal": "$385.00",
  "taxes": "$0.00",
  "discount": "$0.00",
  "total": "$385.00",
  "invoiceUrl": "https://yourdomain.com/invoice/INV-0001",
  "notes": "Thank you for your business.",
  "logoUrl": "https://sparksuite.github.io/simple-html-invoice-template/images/logo.png"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Invoice email sent successfully",
  "email": "customer@example.com",
  "invoiceNumber": "INV-0001"
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Failed to send invoice email",
  "details": "<error message>"
}
```

## Notes

- `email` is required and must be a valid address.
- `buyerName`, `buyerAddress`, and `buyerEmail` are used to build the invoice recipient block.
- `total` should be provided in the request and will be used as-is; the server does not calculate totals.
- `createdDate` and `dueDate` are optional; defaults are generated if omitted.
- `logoUrl` can be provided to render a brand logo in the invoice HTML.
- The invoice uses a responsive HTML template styled to match the existing frontend theme.
