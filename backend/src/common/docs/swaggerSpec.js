export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Decantre BD Fullstack API Documentation",
    version: "2.3.19",
    description: `## Decantre BD REST API & Developer Reference

Welcome to the official API documentation for **Decantre BD**.

### Authentication
Most administrative and protected member endpoints require a **Bearer JWT Token** in the \`Authorization\` header:
\`\`\`http
Authorization: Bearer <your_jwt_access_token>
\`\`\`
Click the **Authorize** button at the top right to set your JWT token for interactive testing.`,
    contact: {
      name: "Decantre BD Developer Support",
      email: "ikramul.web@gmail.com",
      url: "https://decantrebd.com"
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current Host Relative Base URL (/api/v1)"
    },
    {
      url: "https://server.decantrebd.com/api/v1",
      description: "Production Server"
    },
    {
      url: "http://localhost:5092/api/v1",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer access token (without 'Bearer ' prefix)."
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Error message details" }
        }
      },
      SuccessResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string", example: "Operation completed successfully" }
        }
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a8c9b3f8e3a5c1d2e7f0a1" },
          did: { type: "string", example: "US-123456" },
          name: { type: "string", example: "Admin User" },
          email: { type: "string", example: "user@decantrebd.com" },
          role: { type: "string", enum: ["Owner", "Admin", "Manager", "Marketing Expert", "Customer Support"], example: "Admin" },
          lastLogin: { type: "string", format: "date-time" }
        }
      },
      Member: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a8c9b3f8e3a5c1d2e7f0b2" },
          did: { type: "string", example: "MB-100234" },
          name: { type: "string", example: "Saad Azad" },
          email: { type: "string", example: "saadazad97@gmail.com" },
          phone: { type: "string", example: "01712345678" },
          address: { type: "string", example: "House 45, Road 11, Sector 4, Uttara" },
          city: { type: "string", example: "Dhaka" },
          segment: { type: "string", enum: ["new", "regular", "vip", "inactive"], example: "regular" },
          isVerified: { type: "boolean", example: true },
          totalOrders: { type: "integer", example: 5 },
          totalSpent: { type: "number", example: 9250 }
        }
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66b579f18a24d5b9423c56a1" },
          did: { type: "string", example: "PR-1001" },
          name: { type: "string", example: "Sauvage Elixir Eau De Parfum" },
          slug: { type: "string", example: "sauvage-elixir-eau-de-parfum" },
          brand: { type: "string", example: "Dior" },
          category: { type: "string", example: "Perfumes" },
          type: { type: "string", enum: ["Decant", "Full Bottle", "Miniature"], example: "Decant" },
          regularPrice: { type: "number", example: 2100 },
          salePrice: { type: "number", example: 1850 },
          stockStatus: { type: "string", enum: ["instock", "outofstock", "preorder"], example: "instock" },
          stockQuantity: { type: "integer", example: 45 },
          thumbnail: { type: "string", example: "/uploads/products/sauvage-1.webp" },
          images: {
            type: "array",
            items: { type: "string" },
            example: ["/uploads/products/sauvage-1.webp", "/uploads/products/sauvage-2.webp"]
          },
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                attribute: { type: "string", example: "Bottle Size" },
                option: { type: "string", example: "10ml" },
                price: { type: "number", example: 1850 },
                stock: { type: "integer", example: 20 }
              }
            }
          },
          status: { type: "string", enum: ["publish", "draft"], example: "publish" }
        }
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66c58ef18a24d5b9423c56b2" },
          orderId: { type: "string", example: "ORD-98421" },
          fullName: { type: "string", example: "Saad Azad" },
          email: { type: "string", example: "saadazad97@gmail.com" },
          phone: { type: "string", example: "01712345678" },
          address: { type: "string", example: "House 45, Road 11, Sector 4" },
          district: { type: "string", example: "Dhaka" },
          status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"], example: "processing" },
          paymentStatus: { type: "string", enum: ["paid", "unpaid", "refunded", "partially_paid"], example: "paid" },
          paymentMethod: { type: "string", example: "bKash" },
          subtotal: { type: "number", example: 3700 },
          shippingFee: { type: "number", example: 100 },
          discount: { type: "number", example: 200 },
          totalAmount: { type: "number", example: 3600 },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                name: { type: "string" },
                variant: { type: "string" },
                quantity: { type: "integer" },
                price: { type: "number" }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: "Auth", description: "Admin & Dashboard Authentication (JWT & 2FA & Google OAuth)" },
    { name: "Members", description: "Storefront Customer Accounts, Registration, OTP Verification & Management" },
    { name: "Products", description: "Storefront & Admin Product Catalog, Filter, Search & Details" },
    { name: "Dashboard Products", description: "Advanced faceted aggregation search and multi-filtering for admin dashboard" },
    { name: "Attributes", description: "Product Variation Attributes & Terms (e.g. Size, Concentration)" },
    { name: "Categories", description: "Product Categories Management" },
    { name: "Brands", description: "Product Brands Management" },
    { name: "Coupons", description: "Discount Coupons & Promo Validation" },
    { name: "Orders", description: "Customer Order Checkout, Lifecycle Status, Bulk Actions & Invoices" },
    { name: "Payments", description: "Payment Gateway Logs, Verification & Status Management" },
    { name: "Reviews", description: "Customer Product Reviews, Ratings & Admin Approval" },
    { name: "Dashboard & Analytics", description: "KPI Performance, Daily Orders, Sales Distribution & Time-series" },
    { name: "Reports", description: "Financial Summaries, Best Sellers, Payment Gateways & Real-time Inventory" },
    { name: "Assets & Images", description: "Media Uploads, WebP Compression, Slot Assets & Image Redirection" },
    { name: "Media Audit & R2 Sync", description: "Cloudflare R2 Synchronization, Orphan File Audits & Cleanup" },
    { name: "AI Studio", description: "Google Gemini Multimodal AI Product Scene Generation & Analysis" },
    { name: "Store Utils", description: "Featured Products, Best Sellers & Homepage Showcase Config" },
    { name: "Emails & Webmail", description: "Automated Transactional Emails, Invoices & IMAP/SMTP Webmail Integration" },
    { name: "Contact & Subscribers", description: "Newsletter Subscribers & Customer Inquiries/Messages" },
    { name: "Size Charts", description: "Category Size Charts & Sizing Guides" },
    { name: "Settings", description: "Store Settings, Delivery Fees & System Preferences" },
    { name: "Logs & Notifications", description: "System Audit Logs, Activity History & Admin Notifications" },
    { name: "System & Developer", description: "System Health, Live Real-time Logs (SSE) & Database Compressed Backups" }
  ],
  paths: {
    // ----------------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------------
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Dashboard User Login",
        description: "Authenticates admin/staff credentials. If 2FA is active, returns requires2fa flag.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "user@decantrebd.com" },
                  password: { type: "string", example: "yourPassword123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful login (or 2FA challenge response)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        accessToken: { type: "string" },
                        accessTokenExpiresIn: { type: "string", example: "15m" },
                        refreshToken: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/2fa/send-qr": {
      post: {
        tags: ["Auth"],
        summary: "Send 2FA Setup QR Code to Email",
        description: "Generates a TOTP secret and emails the QR code to the user's registered inbox.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "user@decantrebd.com" },
                  password: { type: "string", example: "yourPassword123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "QR code dispatched successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
        }
      }
    },
    "/auth/2fa/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify 2FA TOTP Code & Complete Login",
        description: "Validates the 6-digit TOTP code and generates access & refresh tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "token"],
                properties: {
                  email: { type: "string", example: "user@decantrebd.com" },
                  token: { type: "string", example: "123456" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "2FA verified and session issued" },
          "400": { description: "Invalid or expired 2FA code" }
        }
      }
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate via Google OAuth",
        description: "Authenticates administrator using Google ID token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: {
                  idToken: { type: "string", example: "eyJhbGciOiJSUzI1NiIs..." }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Google authentication successful" }
        }
      }
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh Admin Access Token",
        description: "Uses valid refresh token to rotate and generate fresh access token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "New access token issued" },
          "401": { description: "Invalid or expired refresh token" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Admin User Logout",
        description: "Invalidates the refresh token session.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Logged out successfully" }
        }
      }
    },

    // ----------------------------------------------------
    // MEMBERS / CUSTOMERS
    // ----------------------------------------------------
    "/members/register": {
      post: {
        tags: ["Members"],
        summary: "Register New Customer Account",
        description: "Creates an unverified member account and sends a 6-digit OTP code to the email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Saad Azad" },
                  email: { type: "string", example: "customer@example.com" },
                  password: { type: "string", example: "securePass123" },
                  phone: { type: "string", example: "01712345678" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Registration initiated, OTP sent" }
        }
      }
    },
    "/members/login": {
      post: {
        tags: ["Members"],
        summary: "Customer Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "customer@example.com" },
                  password: { type: "string", example: "securePass123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful with JWT session" },
          "403": { description: "Email not verified (OTP resent)" }
        }
      }
    },
    "/members/verify-otp": {
      post: {
        tags: ["Members"],
        summary: "Verify Customer OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: { type: "string", example: "customer@example.com" },
                  otp: { type: "string", example: "654321" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Account verified successfully" }
        }
      }
    },
    "/members/resend-otp": {
      post: {
        tags: ["Members"],
        summary: "Resend Customer Verification OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "customer@example.com" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "OTP resent" }
        }
      }
    },
    "/members/forgot-password": {
      post: {
        tags: ["Members"],
        summary: "Request Password Reset Code",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "customer@example.com" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Password reset OTP sent to email" }
        }
      }
    },
    "/members/reset-password": {
      post: {
        tags: ["Members"],
        summary: "Reset Customer Password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                  email: { type: "string", example: "customer@example.com" },
                  otp: { type: "string", example: "654321" },
                  newPassword: { type: "string", example: "newSecurePass456" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Password updated successfully" }
        }
      }
    },
    "/members": {
      get: {
        tags: ["Members"],
        summary: "List Members with Filters & Pagination",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
          { name: "segment", in: "query", schema: { type: "string", enum: ["all", "new", "regular", "vip", "inactive"] } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Paginated list of members" }
        }
      },
      post: {
        tags: ["Members"],
        summary: "Create Member (Admin)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Member" }
            }
          }
        },
        responses: {
          "201": { description: "Member created" }
        }
      }
    },
    "/members/{memberId}": {
      get: {
        tags: ["Members"],
        summary: "Get Member Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "memberId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Member details" }
        }
      },
      put: {
        tags: ["Members"],
        summary: "Update Member Profile",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "memberId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  segment: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Member profile updated" }
        }
      },
      delete: {
        tags: ["Members"],
        summary: "Delete Member",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "memberId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Member deleted" }
        }
      }
    },

    // ----------------------------------------------------
    // PRODUCTS
    // ----------------------------------------------------
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List Storefront Products with Filters",
        description: "Returns paginated list of catalog products supporting rich search, filtering by brand, category, season, notes, prices, and stock.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Keyword search across name, brand, description" },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "stockStatus", in: "query", schema: { type: "string", enum: ["instock", "outofstock", "preorder"] } },
          { name: "type", in: "query", schema: { type: "string", enum: ["Decant", "Full Bottle", "Miniature"] } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "salePrice", "regularPrice", "name", "featured"] } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
        ],
        responses: {
          "200": {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                        total: { type: "integer" },
                        page: { type: "integer" },
                        totalPages: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Products"],
        summary: "Create Product (Admin)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" }
            }
          }
        },
        responses: {
          "201": { description: "Product created successfully" }
        }
      }
    },
    "/products/search": {
      post: {
        tags: ["Products"],
        summary: "Search Products via JSON Payload Filters",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  q: { type: "string" },
                  category: { type: "string" },
                  brand: { type: "string" },
                  minPrice: { type: "number" },
                  maxPrice: { type: "number" },
                  stockStatus: { type: "string" },
                  page: { type: "integer", default: 1 },
                  limit: { type: "integer", default: 20 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Matched products" }
        }
      }
    },
    "/products/{identifier}": {
      get: {
        tags: ["Products"],
        summary: "Get Product Details by ID / Slug / DID",
        parameters: [
          { name: "identifier", in: "path", required: true, schema: { type: "string" }, description: "MongoDB _id, slug, or did (e.g. PR-1001)" }
        ],
        responses: {
          "200": { description: "Product details", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          "404": { description: "Product not found" }
        }
      },
      put: {
        tags: ["Products"],
        summary: "Update Product",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" }
            }
          }
        },
        responses: {
          "200": { description: "Product updated successfully" }
        }
      },
      delete: {
        tags: ["Products"],
        summary: "Delete Product",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "identifier", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Product deleted" }
        }
      }
    },
    "/search-products": {
      get: {
        tags: ["Products"],
        summary: "Autocomplete / Live Search Product Alias",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 8 } }
        ],
        responses: {
          "200": { description: "Product suggestions" }
        }
      }
    },
    "/dash/products": {
      post: {
        tags: ["Dashboard Products"],
        summary: "Faceted Deep Aggregation Product Search",
        security: [{ BearerAuth: [] }],
        description: "Provides multi-attribute faceted aggregation counts across categories, brands, variations, stock levels, and pricing.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  filters: { type: "object" },
                  search: { type: "string" },
                  page: { type: "integer", default: 1 },
                  limit: { type: "integer", default: 20 },
                  sort: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Faceted search data with dynamic counts" }
        }
      }
    },

    // ----------------------------------------------------
    // SEARCH & RECOMMENDATIONS
    // ----------------------------------------------------
    "/search": {
      get: {
        tags: ["Products"],
        summary: "Search Products",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          "200": { description: "Matched search results" }
        }
      }
    },
    "/search/popular": {
      get: {
        tags: ["Products"],
        summary: "Get Popular Search Keywords",
        responses: {
          "200": { description: "Trending search phrases" }
        }
      }
    },
    "/search/recent": {
      get: {
        tags: ["Products"],
        summary: "Get Authenticated User's Recent Searches",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Recent searches" }
        }
      },
      delete: {
        tags: ["Products"],
        summary: "Clear User Search History",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "History cleared" }
        }
      }
    },

    // ----------------------------------------------------
    // ORDERS
    // ----------------------------------------------------
    "/orders/new-order": {
      post: {
        tags: ["Orders"],
        summary: "Create New Customer Checkout Order (Storefront)",
        description: "Accepts cart checkout items, recipient shipping details, computes totals, dispatches instant email confirmations, and creates order record.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "phone", "address", "district", "subtotal", "totalAmount", "paymentMethod", "items"],
                properties: {
                  fullName: { type: "string", example: "Saad Azad" },
                  email: { type: "string", example: "saadazad97@gmail.com" },
                  phone: { type: "string", example: "01712345678" },
                  address: { type: "string", example: "House 45, Road 11, Sector 4" },
                  district: { type: "string", example: "Dhaka" },
                  shippingFee: { type: "number", example: 100 },
                  subtotal: { type: "number", example: 1850 },
                  discount: { type: "number", example: 0 },
                  totalAmount: { type: "number", example: 1950 },
                  paymentMethod: { type: "string", example: "Cash on Delivery (COD)" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "quantity", "price"],
                      properties: {
                        productId: { type: "string", example: "66b579f18a24d5b9423c56a1" },
                        name: { type: "string", example: "Sauvage Elixir Eau De Parfum" },
                        variant: { type: "string", example: "10ml Decant" },
                        quantity: { type: "integer", example: 1 },
                        price: { type: "number", example: 1850 }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Order created successfully" },
          "400": { description: "Validation error" }
        }
      }
    },
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "List Orders with Pagination & Status Filters",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "paymentStatus", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Paginated list of orders" }
        }
      }
    },
    "/orders/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Get Order Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order details", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } }
        }
      },
      put: {
        tags: ["Orders"],
        summary: "Update Order (Status / Shipping)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"] },
                  paymentStatus: { type: "string", enum: ["paid", "unpaid", "refunded"] },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Order updated" }
        }
      },
      delete: {
        tags: ["Orders"],
        summary: "Soft Delete Order",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order soft-deleted" }
        }
      }
    },
    "/orders/{orderId}/invoice": {
      get: {
        tags: ["Orders"],
        summary: "Get Printable / Responsive Web HTML Invoice",
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "HTML rendered invoice document" }
        }
      }
    },
    "/orders/bulk-update": {
      post: {
        tags: ["Orders"],
        summary: "Bulk Update Order Status",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderIds", "status"],
                properties: {
                  orderIds: { type: "array", items: { type: "string" } },
                  status: { type: "string" },
                  paymentStatus: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Orders bulk updated" }
        }
      }
    },
    "/orders/bulk-delete": {
      post: {
        tags: ["Orders"],
        summary: "Bulk Soft Delete Orders",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderIds"],
                properties: {
                  orderIds: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Orders deleted" }
        }
      }
    },

    // ----------------------------------------------------
    // PAYMENTS
    // ----------------------------------------------------
    "/payments": {
      get: {
        tags: ["Payments"],
        summary: "List Payments",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
          { name: "status", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Payments list" }
        }
      },
      post: {
        tags: ["Payments"],
        summary: "Create Payment Record",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderId", "amount", "method"],
                properties: {
                  orderId: { type: "string" },
                  amount: { type: "number" },
                  method: { type: "string", example: "bKash" },
                  transactionId: { type: "string" },
                  status: { type: "string", example: "paid" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Payment created" }
        }
      }
    },
    "/payments/{paymentId}": {
      get: {
        tags: ["Payments"],
        summary: "Get Payment Details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "paymentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payment details" } }
      },
      put: {
        tags: ["Payments"],
        summary: "Update Payment Status / Transaction",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "paymentId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  transactionId: { type: "string" },
                  amount: { type: "number" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Payment updated" } }
      },
      delete: {
        tags: ["Payments"],
        summary: "Delete Payment Record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "paymentId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payment deleted" } }
      }
    },
    "/payments/bulk-update": {
      post: {
        tags: ["Payments"],
        summary: "Bulk Update Payments",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ids", "status"],
                properties: {
                  ids: { type: "array", items: { type: "string" } },
                  status: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Payments updated" } }
      }
    },
    "/payments/bulk-delete": {
      post: {
        tags: ["Payments"],
        summary: "Bulk Delete Payments",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ids"],
                properties: {
                  ids: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Payments deleted" } }
      }
    },

    // ----------------------------------------------------
    // ATTRIBUTES & VARIATIONS
    // ----------------------------------------------------
    "/dashboard/attributes": {
      get: {
        tags: ["Attributes"],
        summary: "List All Attribute Groups (Natural numerical sorting)",
        responses: { "200": { description: "List of attribute definitions" } }
      },
      post: {
        tags: ["Attributes"],
        summary: "Create Attribute Group",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", example: "Bottle Size" },
                  slug: { type: "string", example: "bottle-size" },
                  terms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "10ml" },
                        slug: { type: "string", example: "10ml" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Attribute created" } }
      }
    },
    "/dashboard/attributes/{id}": {
      put: {
        tags: ["Attributes"],
        summary: "Update Attribute Group",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Attribute updated" } }
      },
      delete: {
        tags: ["Attributes"],
        summary: "Delete Attribute Group",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Attribute deleted" } }
      }
    },

    // ----------------------------------------------------
    // CATEGORIES, BRANDS & COUPONS
    // ----------------------------------------------------
    "/categories": {
      get: { tags: ["Categories"], summary: "List All Categories", responses: { "200": { description: "Categories list" } } },
      post: {
        tags: ["Categories"],
        summary: "Create Category",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Decants" },
                  slug: { type: "string", example: "decants" },
                  description: { type: "string" },
                  image: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Category created" } }
      }
    },
    "/categories/{id}": {
      get: { tags: ["Categories"], summary: "Get Category by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Category details" } } },
      put: { tags: ["Categories"], summary: "Update Category", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": { description: "Category updated" } } },
      delete: { tags: ["Categories"], summary: "Delete Category", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Category deleted" } } }
    },
    "/brands": {
      get: { tags: ["Brands"], summary: "List All Brands", responses: { "200": { description: "Brands list" } } },
      post: {
        tags: ["Brands"],
        summary: "Create Brand",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Dior" },
                  slug: { type: "string", example: "dior" },
                  logo: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Brand created" } }
      }
    },
    "/brands/{id}": {
      put: { tags: ["Brands"], summary: "Update Brand", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": { description: "Brand updated" } } },
      delete: { tags: ["Brands"], summary: "Delete Brand", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Brand deleted" } } }
    },
    "/coupons": {
      get: { tags: ["Coupons"], summary: "List All Coupons", security: [{ BearerAuth: [] }], responses: { "200": { description: "Coupons list" } } },
      post: {
        tags: ["Coupons"],
        summary: "Create Discount Coupon",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "discountType", "amount"],
                properties: {
                  code: { type: "string", example: "EID2026" },
                  discountType: { type: "string", enum: ["percentage", "fixed"], example: "percentage" },
                  amount: { type: "number", example: 10 },
                  minimumSpend: { type: "number", example: 1000 },
                  expiryDate: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Coupon created" } }
      }
    },
    "/coupons/{id}": {
      get: { tags: ["Coupons"], summary: "Get Coupon Details", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Coupon details" } } },
      put: { tags: ["Coupons"], summary: "Update Coupon", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "200": { description: "Coupon updated" } } },
      delete: { tags: ["Coupons"], summary: "Delete Coupon", security: [{ BearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Coupon deleted" } } }
    },

    // ----------------------------------------------------
    // REVIEWS
    // ----------------------------------------------------
    "/reviews/product/{productDid}": {
      get: {
        tags: ["Reviews"],
        summary: "Public Product Reviews & Aggregated Ratings",
        parameters: [{ name: "productDid", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Approved reviews and rating metrics" } }
      }
    },
    "/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "List All Reviews (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["all", "pending", "approved", "rejected"] } }
        ],
        responses: { "200": { description: "Reviews list" } }
      },
      post: {
        tags: ["Reviews"],
        summary: "Create Review",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "rating", "comment"],
                properties: {
                  productId: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Outstanding projection and authentic fragrance!" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Review submitted" } }
      }
    },
    "/reviews/{id}/status": {
      patch: {
        tags: ["Reviews"],
        summary: "Approve / Reject Review",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["approved", "rejected", "pending"] }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Review status updated" } }
      }
    },

    // ----------------------------------------------------
    // DASHBOARD & REPORTS
    // ----------------------------------------------------
    "/dashboard/kpi": {
      get: {
        tags: ["Dashboard & Analytics"],
        summary: "Get High-level KPI Analytics",
        description: "Returns Gross Sales, Net Revenue, Orders count, AOV, and comparisons vs previous period.",
        responses: { "200": { description: "KPI data" } }
      }
    },
    "/dashboard/orders/daily": {
      get: {
        tags: ["Dashboard & Analytics"],
        summary: "Daily Order Counts (Custom Range, BD Timezone)",
        parameters: [{ name: "days", in: "query", schema: { type: "integer", default: 30 } }],
        responses: { "200": { description: "Daily orders graph dataset" } }
      }
    },
    "/dashboard/orders/status-distribution": {
      get: {
        tags: ["Dashboard & Analytics"],
        summary: "Order Distribution by Status",
        responses: { "200": { description: "Status breakdown" } }
      }
    },
    "/reports/summary": {
      get: {
        tags: ["Reports"],
        summary: "Executive Financial Report Summary",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Summary metrics" } }
      }
    },
    "/reports/sales-timeline": {
      get: {
        tags: ["Reports"],
        summary: "Sales Timeline & Financial Timeseries",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Sales timeline" } }
      }
    },
    "/reports/top-products": {
      get: {
        tags: ["Reports"],
        summary: "Best Selling Products Ranking",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Top products list" } }
      }
    },
    "/reports/payment-methods": {
      get: {
        tags: ["Reports"],
        summary: "Payment Gateways & Methods Breakdown",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Payment statistics" } }
      }
    },
    "/reports/inventory": {
      get: {
        tags: ["Reports"],
        summary: "Real-time Inventory Valuation & Low Stock Alerts",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Inventory metrics" } }
      }
    },

    // ----------------------------------------------------
    // ASSETS & IMAGES
    // ----------------------------------------------------
    "/images": {
      get: {
        tags: ["Assets & Images"],
        summary: "List Uploaded Images with Pagination",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: { "200": { description: "Images catalog" } }
      }
    },
    "/images/upload": {
      post: {
        tags: ["Assets & Images"],
        summary: "Upload Image with Automatic WebP Compression",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary" },
                  folder: { type: "string", example: "products" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Image processed & URL returned" } }
      }
    },
    "/dash/assets": {
      get: {
        tags: ["Assets & Images"],
        summary: "List Dashboard Asset Slots (Banners, Icons)",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Asset slots list" } }
      }
    },
    "/dash/assets/upload-slot": {
      post: {
        tags: ["Assets & Images"],
        summary: "Upload & Overwrite Asset Slot (<= 230KB WebP)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  slotName: { type: "string", example: "hero_banner_1" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Asset slot updated" } }
      }
    },

    // ----------------------------------------------------
    // MEDIA AUDIT & R2 SYNC
    // ----------------------------------------------------
    "/admin/media-audit/summary": {
      get: {
        tags: ["Media Audit & R2 Sync"],
        summary: "Media Storage Metrics & Orphan Image Status",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Audit summary" } }
      }
    },
    "/admin/media-audit/orphans": {
      get: {
        tags: ["Media Audit & R2 Sync"],
        summary: "List Unreferenced Orphan Images",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Orphan files" } }
      }
    },
    "/admin/media-audit/scan": {
      post: {
        tags: ["Media Audit & R2 Sync"],
        summary: "Trigger On-Demand Filesystem vs Database Orphan Scan",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Scan started / completed" } }
      }
    },
    "/admin/media-audit/r2-sync": {
      post: {
        tags: ["Media Audit & R2 Sync"],
        summary: "Trigger Cloudflare R2 Cloud Backup Synchronization",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "R2 sync job started" } }
      }
    },
    "/admin/media-audit/whitelist": {
      post: {
        tags: ["Media Audit & R2 Sync"],
        summary: "Whitelist Protected Files",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  filenames: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Files whitelisted" } }
      }
    },
    "/admin/media-audit/confirm": {
      delete: {
        tags: ["Media Audit & R2 Sync"],
        summary: "Permanently Delete Orphan Files from Storage",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Orphan files deleted" } }
      }
    },

    // ----------------------------------------------------
    // AI IMAGE STUDIO
    // ----------------------------------------------------
    "/studio/health": {
      get: {
        tags: ["AI Studio"],
        summary: "Check Gemini AI Key Status & Supported Models",
        responses: { "200": { description: "AI service status" } }
      }
    },
    "/studio/transform": {
      post: {
        tags: ["AI Studio"],
        summary: "Composite Product into Generated Studio Scene",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["image", "prompt"],
                properties: {
                  image: { type: "string", description: "Base64 data or image URL" },
                  prompt: { type: "string", example: "Luxury marble counter with soft morning golden hour sunlight" },
                  aspectRatio: { type: "string", enum: ["1:1", "16:9", "9:16", "4:3"], default: "1:1" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Transformed AI image result" } }
      }
    },
    "/studio/enhance-prompt": {
      post: {
        tags: ["AI Studio"],
        summary: "Enhance Raw Prompt into Photoshoot Specification",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: { type: "string", example: "dark perfume bottle on stone" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Expanded prompt with lighting & camera directives" } }
      }
    },
    "/studio/analyze-product": {
      post: {
        tags: ["AI Studio"],
        summary: "Multimodal Vision Analysis for Colors & Scene Recommendations",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", description: "Base64 image string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Scene and color analysis" } }
      }
    },

    // ----------------------------------------------------
    // STORE UTILS
    // ----------------------------------------------------
    "/store-utils": {
      get: {
        tags: ["Store Utils"],
        summary: "Get Configured Featured & Best Seller Product Showcases",
        responses: { "200": { description: "Showcase product arrays" } }
      },
      put: {
        tags: ["Store Utils"],
        summary: "Update Featured & Best Seller Product Lists",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  featured: { type: "array", items: { type: "string" } },
                  bestSellers: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Showcases saved" } }
      }
    },

    // ----------------------------------------------------
    // EMAILS & WEBMAIL
    // ----------------------------------------------------
    "/sendEmail": {
      post: {
        tags: ["Emails & Webmail"],
        summary: "Send Transactional Email",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to", "subject", "message"],
                properties: {
                  to: { type: "string", example: "customer@example.com" },
                  subject: { type: "string", example: "Your Order is on the way" },
                  message: { type: "string", example: "Thank you for shopping with Decantre BD!" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Email sent" } }
      }
    },
    "/sendEmail/invoice": {
      post: {
        tags: ["Emails & Webmail"],
        summary: "Send Email Invoice to Customer",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderId"],
                properties: {
                  orderId: { type: "string", example: "ORD-98421" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Invoice dispatched" } }
      }
    },
    "/subscribers": {
      post: {
        tags: ["Contact & Subscribers"],
        summary: "Subscribe to Newsletter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "subscriber@example.com" }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Subscribed successfully" } }
      }
    },
    "/contact": {
      post: {
        tags: ["Contact & Subscribers"],
        summary: "Submit Contact Message / Customer Inquiry",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "message"],
                properties: {
                  name: { type: "string", example: "Tanvir Ahmed" },
                  email: { type: "string", example: "tanvir@example.com" },
                  phone: { type: "string", example: "01812345678" },
                  subject: { type: "string", example: "Product authenticity inquiry" },
                  message: { type: "string", example: "Hello, I would like to know about batch codes." }
                }
              }
            }
          }
        },
        responses: { "201": { description: "Message received" } }
      }
    },
    "/contact/messages": {
      get: {
        tags: ["Contact & Subscribers"],
        summary: "List Contact Messages (Admin)",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Messages list" } }
      }
    },

    // ----------------------------------------------------
    // SIZE CHARTS & SETTINGS
    // ----------------------------------------------------
    "/size-charts": {
      get: { tags: ["Size Charts"], summary: "Get All Size Charts", responses: { "200": { description: "Size charts list" } } },
      post: {
        tags: ["Size Charts"],
        summary: "Upsert Size Chart",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categoryId", "columns", "rows"],
                properties: {
                  categoryId: { type: "string" },
                  columns: { type: "array", items: { type: "string" } },
                  rows: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Size chart saved" } }
      }
    },
    "/settings": {
      get: { tags: ["Settings"], summary: "Get General Store Settings", responses: { "200": { description: "Settings object" } } },
      put: {
        tags: ["Settings"],
        summary: "Update Store Settings",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Settings saved" } }
      }
    },

    // ----------------------------------------------------
    // LOGS & NOTIFICATIONS
    // ----------------------------------------------------
    "/logs": {
      get: {
        tags: ["Logs & Notifications"],
        summary: "List System Activity Logs",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Logs list" } }
      }
    },
    "/logs/notifications": {
      get: {
        tags: ["Logs & Notifications"],
        summary: "Get Unread Admin Notifications",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Notifications list" } }
      }
    },

    // ----------------------------------------------------
    // SYSTEM & DEVELOPER TOOLS
    // ----------------------------------------------------
    "/version": {
      get: {
        tags: ["System & Developer"],
        summary: "Get Backend Package Version",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Version info" } }
      }
    },
    "/system/metadata": {
      get: {
        tags: ["System & Developer"],
        summary: "Get Storefront Metadata (Categories, Brands, Price ranges)",
        responses: { "200": { description: "Metadata bundle" } }
      }
    },
    "/developer/logs": {
      get: {
        tags: ["System & Developer"],
        summary: "Get Recent HTTP Telemetry Logs (JSON Polling)",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Recent log buffer" } }
      }
    },
    "/developer/logs/stream": {
      get: {
        tags: ["System & Developer"],
        summary: "Real-time Live Log Stream (Server-Sent Events / SSE)",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Event stream (text/event-stream)" } }
      }
    },
    "/developer/db-backup": {
      get: {
        tags: ["System & Developer"],
        summary: "Download Gzip Compressed MongoDB Full Database Backup",
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "Gzip compressed JSON database export (.json.gz)" } }
      }
    }
  }
};
