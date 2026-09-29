# Decantre BD API Endpoints Reference

Base API Address: `https://server.decantrebd.com`

---

## 1. Product Endpoints

**Base Prefix:** `/api/v1/products`

- **GET `/`** - List products with rich query filtering (`q`, `category`, `brand`, `stockStatus`, `type`, `season`, `minPrice`, `maxPrice`, `sortBy`, `order`, `limit`, `skip`).
- **POST `/search`** - List/search products using JSON payload filters.
- **GET `/:identifier`** - Fetch details of a single product using MongoDB `_id`, `slug`, or `did`.
- **POST `/`** - Create a new product _(Requires JWT: Owner, Admin, Manager)_.
- **PUT `/:id`** - Update an existing product _(Requires JWT: Owner, Admin, Manager)_.
- **DELETE `/:id`** - Delete a product _(Requires JWT: Owner, Admin, Manager)_.
- **GET `/api/v1/search-products`** - Root alias for autocomplete and live search.

### Dashboard Deep Faceted Product Search
**Base Prefix:** `/api/v1/dash/products` _(Requires JWT: Owner, Admin, Manager, Marketing Expert)_
- **POST `/`** - Faceted aggregation search across products, categories, brands, and variations with dynamic metadata counts.

---

## 2. Search & Recommendations

**Base Prefix:** `/api/v1/search`

- **GET `/`** - Search products with autocomplete preview (`q`, `limit`).
- **GET `/popular`** - Fetch top globally trending search keywords.
- **GET `/recent`** - Fetch authenticated user's recent search queries _(Requires JWT)_.
- **DELETE `/recent`** & **GET `/recent/clear`** - Clear user's search history _(Requires JWT)_.

---

## 3. Dashboard User Authentication

**Base Prefix:** `/api/v1/auth`

- **POST `/login`** - Authenticate user credentials (returns tokens or prompts 2FA).
- **POST `/2fa/send-qr`** - Generate and email QR Code for Google Authenticator TOTP setup.
- **POST `/2fa/verify`** - Verify 6-digit TOTP code, activate 2FA, and complete login.
- **POST `/google`** - Authenticate administrator via Google OAuth 2.0.
- **POST `/refresh-token`** - Rotate refresh token and issue a fresh access token.
- **POST `/logout`** - Invalidate active session tokens.

---

## 4. Customer & Member Accounts

**Base Prefix:** `/api/v1/members`

- **POST `/register`** - Register customer account and send 6-digit OTP verification code.
- **POST `/login`** - Member login (authenticates or requests OTP if unverified).
- **POST `/check-email`** - Check email existence and dispatch verification OTP if needed.
- **POST `/verify-otp`** - Verify registration or login OTP code.
- **POST `/resend-otp`** - Resend verification code.
- **POST `/forgot-password`** - Request password reset code via email.
- **POST `/reset-password`** - Reset password using verified OTP code.
- **POST `/refresh-token`** - Rotate customer session tokens.
- **POST `/logout`** - Logout customer session.
- **GET `/`** - List members with pagination, segment, and keyword search _(Requires JWT)_.
- **GET `/:memberId`** - Get member profile details _(Requires JWT)_.
- **POST `/`** - Admin manual member creation _(Requires JWT)_.
- **PUT `/:memberId`** - Update member profile _(Requires JWT)_.
- **POST `/:memberId/change-password`** - Change member password _(Requires JWT)_.
- **DELETE `/:memberId`** - Delete member _(Requires JWT: Owner, Admin, Manager)_.

---

## 5. Orders Management

**Base Prefix:** `/api/v1/orders`

- **POST `/new-order`** - Create new customer checkout order _(Public storefront)_.
- **GET `/:orderId/invoice`** - Printable/web responsive HTML invoice view _(Public)_.
- **GET `/`** - List orders with pagination and filtering _(Requires JWT: Owner, Admin, Manager)_.
- **GET `/:orderId`** - Get order details _(Requires JWT: Owner, Admin, Manager)_.
- **PUT `/:orderId`** - Update order status or shipping details _(Requires JWT: Owner, Admin, Manager)_.
- **DELETE `/:orderId`** - Soft delete order and clean linked payment/member totals _(Requires JWT: Owner, Admin)_.
- **POST `/bulk-update`** - Batch update status and paymentStatus for multiple orders _(Requires JWT: Owner, Admin, Manager)_.
- **POST `/bulk-delete`** - Batch soft delete orders _(Requires JWT: Owner, Admin)_.

---

## 6. Payments Management

**Base Prefix:** `/api/v1/payments` _(Requires JWT)_

- **GET `/`** - List payment records with pagination and filters.
- **GET `/:paymentId`** - Get payment details by ID.
- **POST `/`** - Create a payment record.
- **PUT `/:paymentId`** - Update payment status, amounts, or phone.
- **DELETE `/:paymentId`** - Delete payment record.
- **POST `/bulk-update`** - Batch update payment status and recalculate amounts.
- **POST `/bulk-delete`** - Batch delete payment records.

---

## 7. Product Variation Attributes

**Base Prefix:** `/api/v1/dashboard/attributes`

- **GET `/`** - List all attribute groups (e.g. bottle size, concentration) with natural numerical sorting.
- **POST `/`** - Create an attribute group.
- **PUT `/:id`** - Update an attribute group.
- **DELETE `/:id`** - Delete an attribute group.

---

## 8. Categories, Brands & Coupons

- **Categories:** `GET /api/v1/categories`, `GET /api/v1/categories/:id`, `POST /api/v1/categories`, `PUT /api/v1/categories/:id`, `DELETE /api/v1/categories/:id`
- **Brands:** `GET /api/v1/brands`, `POST /api/v1/brands`, `PUT /api/v1/brands/:id`, `DELETE /api/v1/brands/:id`
- **Coupons:** `GET /api/v1/coupons`, `GET /api/v1/coupons/:id`, `POST /api/v1/coupons`, `PUT /api/v1/coupons/:id`, `DELETE /api/v1/coupons/:id`

---

## 9. Product Reviews

**Base Prefix:** `/api/v1/reviews`

- **GET `/product/:productDid`** - Public fetch of approved reviews and aggregated rating statistics.
- **GET `/`** - List all reviews with filters _(Requires JWT: Owner, Admin, Manager, Super Admin)_.
- **GET `/:id`** - Get single review details.
- **POST `/`** - Create a product review _(Requires JWT: Member)_.
- **PUT `/:id`** - Update a review _(Requires JWT)_.
- **PATCH `/:id/status`** - Approve / reject review _(Requires JWT: Owner, Admin, Manager, Super Admin)_.
- **DELETE `/:id`** - Delete review _(Requires JWT)_.
- **POST `/bulk-update`** - Bulk update review approval status _(Requires JWT: Owner, Admin, Manager, Super Admin)_.
- **POST `/bulk-delete`** - Bulk delete reviews _(Requires JWT: Owner, Admin, Manager, Super Admin)_.

---

## 10. Dashboard Analytics & Reports

**Base Prefix:** `/api/v1/dashboard`
- **GET `/orders/daily`** - Daily order counts for custom day ranges (default 30 days, BD Time).
- **GET `/kpi`** - KPI metrics (Sales, Completed Orders, AOV, Members) with trend comparisons.
- **GET `/orders/status-distribution`** - Order distribution counts by status.

**Base Prefix:** `/api/v1/reports` _(Requires JWT: Owner, Admin, Manager)_
- **GET `/summary`** - High-level summary (Gross, Net, Discounts, AOV, POS vs Online).
- **GET `/sales-timeline`** - Daily financial timeseries grouping for chart visualizers.
- **GET `/top-products`** - Best-selling product performance rankings.
- **GET `/payment-methods`** - Transaction volume breakdowns by payment gateway.
- **GET `/inventory`** - Real-time inventory valuation and low stock alerts.

---

## 11. Assets & Media Management

**Base Prefix:** `/api/v1/images`
- **GET `/`** - List all uploaded media files with pagination and search _(Requires JWT)_.
- **GET `/resize`** - Image URL redirection.
- **POST `/upload`** - Upload product, attribute, or general image with automatic WebP conversion _(Requires JWT: Owner, Admin, Manager)_.

**Base Prefix:** `/api/v1/dash/assets` _(Requires JWT: Owner, Admin)_
- **GET `/`** - List slot asset files (banners, sliders, icons).
- **POST `/upload-slot`** - Upload, compress (<= 230KB WebP), and overwrite asset slot file.
- **GET `/download/:filename`** - Download asset file.
- **DELETE `/:filename`** - Delete asset file.

**Base Prefix:** `/api/v1/assets` _(Requires JWT)_
- Core asset collection CRUD endpoints.

---

## 12. Media Storage Audit & Cloudflare R2 Sync

**Base Prefix:** `/api/v1/admin/media-audit` _(Requires JWT: Owner, Admin)_

- **GET `/summary`** - Storage metrics, orphan counts, and R2 sync status.
- **GET `/orphans`** - Paginated list of unreferenced orphan images.
- **POST `/scan`** - Trigger on-demand filesystem vs DB orphan scan.
- **POST `/r2-sync`** - Trigger Cloudflare R2 cloud backup synchronization.
- **POST `/whitelist`** - Whitelist protected files from cleanup.
- **DELETE `/confirm`** - Confirm and permanently delete orphan files from disk.

---

## 13. Store Utilities Showcases

**Base Prefix:** `/api/v1/store-utils`

- **GET `/`** - Get configured Featured and Best Seller products showcase lists.
- **PUT `/`** - Update Featured and Best Seller product arrays _(Requires JWT: Owner, Admin, Manager)_.

---

## 14. AI Product Image Studio

**Base Prefix:** `/api/v1/studio` _(Requires JWT, payload up to 60MB)_

- **GET `/health`** - Check Gemini API key status and supported models.
- **POST `/transform`** - Composite product into generated studio scenes across multiple aspect ratios.
- **POST `/generate-bulk`** - Generate fresh product images from prompt descriptions.
- **POST `/enhance-prompt`** - Expand raw idea into commercial photoshoot prompt using Gemini 3.7 Flash.
- **POST `/analyze-product`** - Multimodal vision analysis for colors, scene suggestions, and framing.

---

## 15. Email, Subscribers, Contact & System

- **Email:** `GET|POST /api/v1/sendEmail`, `POST /api/v1/sendEmail/invoice`
- **Subscribers:** `POST /api/v1/subscribers`
- **Contact & Messages:** `POST /api/v1/contact`, `GET /api/v1/contact/messages`, `GET /api/v1/contact/messages/:id`, `POST /api/v1/contact/messages/:id/reply`, `PATCH /api/v1/contact/messages/:id/status`, `DELETE /api/v1/contact/messages/:id`, `POST /api/v1/contact/messages/bulk-delete` _(Requires JWT for message management)_
- **System Metadata:** `GET /api/v1/system/metadata`, `GET /api/v1/system/info` _(Requires JWT)_
- **Version:** `GET /api/v1/version` _(Requires JWT: Owner, Admin)_
- **Logs:** `GET /api/v1/logs`, `GET /api/v1/logs/notifications`, `POST /api/v1/logs`, `PUT /api/v1/logs/mark-read`, `PUT /api/v1/logs/mark-unread`, `DELETE /api/v1/logs/:id`, `POST /api/v1/logs/bulk-delete`
- **Developer Tools:** `GET /api/v1/developer/logs`, `GET /api/v1/developer/logs/stream` (SSE), `GET /api/v1/developer/docs` (Scalar UI), `GET /api/v1/developer/db-backup` (Gzip backup)
