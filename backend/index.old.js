const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");  // Import crypto for signing
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const admin = require("firebase-admin");

const APP_KEY ='503646';
const APP_SECRET ='GRM2aosy8VXIV0xzclq6loMKeaRAv996';

// Validate required environment variables
if (!APP_KEY || !APP_SECRET) {
  process.exit(1);
}

const REGION_ENDPOINTS = {
  myanmar: "https://api.shop.com.mm/rest",
  bangladesh: "https://api.daraz.com.bd/rest",
  pakistan: "https://api.daraz.pk/rest",
  "sri lanka": "https://api.daraz.lk/rest",
  sri_lanka: "https://api.daraz.lk/rest",
  srilanka: "https://api.daraz.lk/rest",
  nepal: "https://api.daraz.com.np/rest",
};

const DEFAULT_REGION = "pakistan";

// Initialize Firebase Admin
try {
  // Initialize with service account (recommended for production)
  // For now, using Realtime Database with service account or default credentials
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://dseller-c21ee-default-rtdb.firebaseio.com"
    });
  }
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error.message);
  // Continue without Firebase Admin if initialization fails
  // This allows the server to start even if Firebase credentials are missing
}

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Daraz Helper API",
    version: "1.0.0",
    description:
      "Proxy helpers for Daraz Open Platform. All routes here simply forward requests with the required Daraz signature logic. This API handles authentication, order management, finance operations, and logistics for Daraz sellers. Additionally, it provides product and SKU management with server-side calculations for price, totals, and stock values.",
    contact: {
      name: "API Support",
    },
  },
  tags: [
    {
      name: "Auth",
      description: "Authentication endpoints for Daraz OAuth token management",
    },
    {
      name: "Orders",
      description: "Order management endpoints for fetching and processing Daraz orders",
    },
    {
      name: "Finance",
      description: "Financial endpoints for payout status and transaction details",
    },
    {
      name: "Practitioners",
      description: "Practitioner management endpoints",
    },
    {
      name: "Health",
      description: "Health check and testing endpoints",
    },
    {
      name: "Products",
      description: "Product management endpoints for fetching products from Firebase",
    },
    {
      name: "SKUs",
      description: "SKU management endpoints with server-side price calculations",
    },
    {
      name: "Stock",
      description: "Stock calculation endpoints for inventory value calculations",
    },
  ],
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || "http://localhost:3001",
      description: "Local development",
    },
  ],
  components: {
    schemas: {
      TokenResponse: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          refresh_token: { type: "string" },
          expires_in: { type: "integer" },
          refresh_expires_in: { type: "integer" },
          account_id: { type: "string", nullable: true },
          country: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "object" },
          message: { type: "string", nullable: true },
          darazError: {
            type: "object",
            nullable: true,
            properties: {
              code: { type: "string" },
              type: { type: "string" },
              message: { type: "string" },
              request_id: { type: "string", nullable: true },
              _trace_id_: { type: "string", nullable: true },
            },
          },
        },
      },
      Order: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          order_no: { type: "string" },
          status: { type: "string" },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          order_item_id: { type: "string" },
          order_id: { type: "string" },
          status: { type: "string" },
        },
      },
      Practitioner: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
          phoneNumber: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Daraz access token passed as query parameter (access_token)",
      },
    },
  },
  paths: {
    "/get-daraz-token": {
      post: {
        tags: ["Auth"],
        summary: "Create Daraz access token",
        description: "Exchanges an authorization code for a Daraz access token and seller profile.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: {
                    type: "string",
                    description: "Authorization code obtained from Daraz OAuth redirect",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Token and seller info returned from Daraz",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { $ref: "#/components/schemas/TokenResponse" },
                    seller: { type: "object" },
                    seller_id: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Missing code" },
          500: { description: "Daraz API error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/refresh-daraz-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh Daraz access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refresh_token"],
                properties: {
                  refresh_token: {
                    type: "string",
                    description: "Refresh token issued by Daraz",
                  },
                  region: {
                    type: "string",
                    description: "Optional region override (e.g. pakistan, bangladesh)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "New access token payload from Daraz",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenResponse" },
              },
            },
          },
          400: { description: "Missing refresh token or invalid region" },
          500: {
            description: "Daraz API error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-orders": {
      get: {
        tags: ["Orders"],
        summary: "Fetch Daraz orders",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string" },
            description: "Daraz order status filter",
          },
          {
            in: "query",
            name: "created_after",
            schema: { type: "string" },
            description: "ISO timestamp used by Daraz to filter by creation date",
          },
        ],
        responses: {
          200: { description: "Orders payload from Daraz" },
          400: { description: "Missing access token" },
          500: {
            description: "Daraz API error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-order-items": {
      get: {
        tags: ["Orders"],
        summary: "Fetch items for Daraz orders",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "order_ids",
            required: true,
            schema: { type: "string" },
            description: "JSON array string of order IDs, e.g. [12345,67890]",
          },
        ],
        responses: {
          200: { description: "Order items payload" },
          400: { description: "Missing parameters" },
          500: {
            description: "Daraz API error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-order-details": {
      get: {
        tags: ["Orders"],
        summary: "Fetch orders plus item details",
        description: "Combines orders/get and orders/items/get by chunking order IDs into batches of 50",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string" },
            description: "Order status filter",
          },
          {
            in: "query",
            name: "created_after",
            schema: { type: "string" },
            description: "ISO timestamp to filter orders created after this date",
          },
          {
            in: "query",
            name: "update_after",
            schema: { type: "string" },
            description: "ISO timestamp to filter orders updated after this date",
          },
        ],
        responses: {
          200: {
            description: "Orders + items summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    countTotal: { type: "integer" },
                    orderItems: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          400: { description: "Missing access token" },
          500: {
            description: "Daraz API error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-income-details": {
      get: {
        tags: ["Finance"],
        summary: "Get unpaid payout statements",
        description: "Fetches payout status from Daraz and filters for unpaid statements (paid === '0')",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
          {
            in: "query",
            name: "storeName",
            schema: { type: "string" },
            description: "Store name to attach to each statement",
          },
          {
            in: "query",
            name: "created_after",
            required: true,
            schema: { type: "string" },
            description: "ISO timestamp - mandatory parameter for payout status API",
          },
        ],
        responses: {
          200: {
            description: "Unpaid payout statements",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    financeRespone: {
                      type: "array",
                      items: { type: "object" },
                      description: "Array of unpaid statements with storeName attached",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Daraz API error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-query-income-details": {
      get: {
        tags: ["Finance"],
        summary: "Get transaction details with order balances",
        description: "Fetches transaction details and calculates order balances",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
          {
            in: "query",
            name: "start_time",
            schema: { type: "string" },
            description: "Start time for transaction query",
          },
          {
            in: "query",
            name: "end_time",
            schema: { type: "string" },
            description: "End time for transaction query",
          },
          {
            in: "query",
            name: "trans_type",
            schema: { type: "string" },
            description: "Transaction type filter",
          },
          {
            in: "query",
            name: "trade_order_id",
            schema: { type: "string" },
            description: "Specific trade order ID",
          },
          {
            in: "query",
            name: "trade_order_line_id",
            schema: { type: "string" },
            description: "Specific trade order line ID",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer" },
            description: "Limit number of results",
          },
        ],
        responses: {
          200: {
            description: "Transaction details with calculated balances",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        total: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              order_no: { type: "string" },
                              total_amount: { type: "number" },
                            },
                          },
                        },
                        transactions: { type: "array", items: { type: "object" } },
                        summary: {
                          type: "object",
                          properties: {
                            totalTransactions: { type: "integer" },
                            totalOrders: { type: "integer" },
                            totalAmount: { type: "number" },
                          },
                        },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing access token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Failed to fetch transaction details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-delivered-order-details": {
      get: {
        tags: ["Orders"],
        summary: "Get delivered orders with filtered items",
        description: "Fetches orders and their items, then filters items by status and injects access_token into each item",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string" },
            description: "Order status filter (also used to filter order items)",
          },
          {
            in: "query",
            name: "created_after",
            schema: { type: "string" },
            description: "ISO timestamp to filter orders created after this date",
          },
          {
            in: "query",
            name: "update_after",
            schema: { type: "string" },
            description: "ISO timestamp to filter orders updated after this date",
          },
          {
            in: "query",
            name: "update_before",
            schema: { type: "string" },
            description: "ISO timestamp to filter orders updated before this date",
          },
        ],
        responses: {
          200: {
            description: "Filtered orders with items matching the status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    countTotal: { type: "integer" },
                    orderItems: {
                      type: "array",
                      items: {
                        type: "object",
                        description: "Orders with filtered order_items array",
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing access token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Failed to fetch order details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-daraz-order-logistics": {
      get: {
        tags: ["Orders"],
        summary: "Get order logistics information",
        description: "Fetches logistics information for a specific order and package",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
          {
            in: "query",
            name: "order_id",
            required: true,
            schema: { type: "string" },
            description: "Order ID",
          },
          {
            in: "query",
            name: "package_id_list",
            required: true,
            schema: { type: "string" },
            description: "Package ID list",
          },
          {
            in: "query",
            name: "locale",
            required: true,
            schema: { type: "string" },
            description: "Locale (e.g., 'en_US')",
          },
        ],
        responses: {
          200: {
            description: "Logistics information from Daraz",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          400: {
            description: "Missing required parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Failed to fetch logistics info",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/make-order-rts": {
      post: {
        tags: ["Orders"],
        summary: "Mark order packages as Ready to Ship (RTS)",
        description: "Marks one or more packages as ready to ship",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["packages"],
                properties: {
                  packages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        package_id: { type: "string" },
                      },
                    },
                    description: "Array of packages to mark as RTS",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "RTS operation result from Daraz",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          400: {
            description: "Missing access token or invalid packages",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Failed to mark package(s) as RTS",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/make-order-pack-and-rts": {
      post: {
        tags: ["Orders"],
        summary: "Pack orders and mark as Ready to Ship",
        description: "First packs the orders, then automatically marks the resulting packages as RTS",
        parameters: [
          {
            in: "query",
            name: "access_token",
            required: true,
            schema: { type: "string" },
            description: "Daraz access token",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pack_order_list"],
                properties: {
                  pack_order_list: {
                    type: "array",
                    items: { type: "object" },
                    description: "Array of orders to pack",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Combined pack and RTS results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    packResult: { type: "object" },
                    rtsResult: { type: "object", nullable: true },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing access token or invalid pack_order_list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Failed to pack orders and mark as RTS",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/get-practitioners": {
      get: {
        tags: ["Practitioners"],
        summary: "Get list of practitioners",
        description: "Returns a hardcoded list of practitioners",
        responses: {
          200: {
            description: "List of practitioners",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        totalPractitioners: { type: "integer" },
                        practitioners: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string" },
                              role: { type: "string" },
                              phoneNumber: { type: "string" },
                              createdAt: { type: "string" },
                              updatedAt: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/test": {
      get: {
        tags: ["Health"],
        summary: "Test endpoint",
        description: "Simple health check endpoint to verify API is running",
        responses: {
          200: {
            description: "API is working",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "API is working fine and sound!",
                },
              },
            },
          },
        },
      },
    },
    "/api/products/{userId}": {
      get: {
        tags: ["Products"],
        summary: "Get all products for a user",
        description: "Retrieves all products from Firebase for the specified user",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
            description: "Firebase user ID",
          },
        ],
        responses: {
          200: {
            description: "Products retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "array",
                      items: { type: "object" },
                    },
                    count: { type: "integer" },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Missing userId" },
          500: {
            description: "Server error or Firebase Admin not configured",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/products/{userId}/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Get a specific product by ID",
        description: "Retrieves a single product from Firebase by user ID and product ID",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
            description: "Firebase user ID",
          },
          {
            in: "path",
            name: "productId",
            required: true,
            schema: { type: "string" },
            description: "Product ID",
          },
        ],
        responses: {
          200: {
            description: "Product retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { type: "object" },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          404: { description: "Product not found" },
          400: { description: "Missing userId or productId" },
          500: {
            description: "Server error or Firebase Admin not configured",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/skus/calculate": {
      post: {
        tags: ["SKUs"],
        summary: "Calculate SKU price",
        description: "Calculates the total price for a SKU by multiplying quantity and unit price. All calculations are performed server-side.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity", "unitPrice"],
                properties: {
                  quantity: {
                    type: "number",
                    description: "Quantity of items",
                    example: 5,
                  },
                  unitPrice: {
                    type: "number",
                    description: "Price per unit",
                    example: 10.5,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "SKU price calculated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        quantity: { type: "number" },
                        unitPrice: { type: "number" },
                        totalPrice: { type: "number" },
                        formattedPrice: { type: "string" },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or invalid quantity or unitPrice",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/skus/{userId}/{sku}": {
      put: {
        tags: ["SKUs"],
        summary: "Update SKU with calculated price",
        description: "Updates a SKU in Firebase with server-calculated price (quantity × unit price). Fetches product price from Firebase, calculates total, and updates the SKU.",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
            description: "Firebase user ID",
          },
          {
            in: "path",
            name: "sku",
            required: true,
            schema: { type: "string" },
            description: "SKU identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: {
                    type: "string",
                    description: "Product ID to link with SKU",
                  },
                  quantity: {
                    type: "string",
                    description: "Quantity of items",
                  },
                  productName: {
                    type: "string",
                    description: "Product name (optional)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "SKU updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        sku: { type: "string" },
                        price: { type: "number" },
                        productId: { type: "string" },
                        productQuantity: { type: "string" },
                        productName: { type: "string" },
                        unitPrice: { type: "number" },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Missing required parameters" },
          404: { description: "Product not found" },
          500: {
            description: "Server error or Firebase Admin not configured",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/orders/calculate-totals": {
      post: {
        tags: ["Orders"],
        summary: "Calculate order totals",
        description: "Calculates totals for multiple order items. Processes each item (price × quantity) and returns enriched items with totals plus a summary.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["items"],
                properties: {
                  items: {
                    type: "array",
                    description: "Array of order items",
                    items: {
                      type: "object",
                      properties: {
                        price: {
                          type: "number",
                          description: "Unit price (can also use unitPrice field)",
                        },
                        quantity: {
                          type: "number",
                          description: "Quantity (can also use productQuantity field)",
                        },
                        unitPrice: {
                          type: "number",
                          description: "Alternative field name for price",
                        },
                        productQuantity: {
                          type: "number",
                          description: "Alternative field name for quantity",
                        },
                      },
                    },
                  },
                },
              },
              example: {
                items: [
                  { price: 10, quantity: 2 },
                  { price: 15.5, quantity: 3 },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Order totals calculated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              unitPrice: { type: "number" },
                              quantity: { type: "number" },
                              totalPrice: { type: "number" },
                              formattedTotal: { type: "string" },
                            },
                          },
                        },
                        summary: {
                          type: "object",
                          properties: {
                            totalItems: { type: "integer" },
                            grandTotal: { type: "number" },
                            formattedGrandTotal: { type: "string" },
                          },
                        },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or invalid items array",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/stock/calculate-total": {
      post: {
        tags: ["Stock"],
        summary: "Calculate stock total value",
        description: "Calculates the total stock value from an array of products. Processes each product (price × quantity) and returns enriched products with totals plus a summary.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["products"],
                properties: {
                  products: {
                    type: "array",
                    description: "Array of products",
                    items: {
                      type: "object",
                      properties: {
                        price: {
                          type: "number",
                          description: "Price per unit",
                        },
                        quantity: {
                          type: "number",
                          description: "Quantity in stock",
                        },
                      },
                    },
                  },
                },
              },
              example: {
                products: [
                  { price: 20, quantity: 5 },
                  { price: 30, quantity: 3 },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Stock total calculated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        products: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              price: { type: "number" },
                              quantity: { type: "number" },
                              totalValue: { type: "number" },
                              formattedTotal: { type: "string" },
                            },
                          },
                        },
                        summary: {
                          type: "object",
                          properties: {
                            totalProducts: { type: "integer" },
                            totalStockValue: { type: "number" },
                            formattedTotalValue: { type: "string" },
                          },
                        },
                      },
                    },
                    error: { type: "string", nullable: true },
                    statusCode: { type: "integer" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or invalid products array",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          500: {
            description: "Server error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); // To parse JSON request body
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function calculateOrderBalances(apiResponse) {
  const orderMap = {};

  apiResponse?.forEach(item => {
    const orderNo = item.order_no;
    if (!orderNo || !item.amount) return;

    // Clean the amount: remove commas and parse to float
    const cleanedAmount = parseFloat(item.amount.toString().replace(/,/g, ''));

    if (isNaN(cleanedAmount)) return; // skip invalid numbers

    if (!orderMap[orderNo]) {
      orderMap[orderNo] = {
        order_no: orderNo,
        total_amount: 0
      };
    }

    orderMap[orderNo].total_amount += cleanedAmount;
  });

  return Object.values(orderMap);
}

// Function to generate the sign parameter
function generateSign(url, params, appSecret) {
  if (!appSecret) {
    throw new Error("APP_SECRET is required for signing requests. Please set the APP_SECRET environment variable.");
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  // Start with URL path
  let stringToSign = url;

  // Append key-value pairs in order without separators
  for (const key of sortedKeys) {
    stringToSign += key + params[key];
  }

  // Generate HMAC-SHA256 hash, then uppercase hex digest
  return crypto
    .createHmac("sha256", appSecret)
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();
}

// Middleware to validate API credentials
function validateCredentials(req, res, next) {
  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }
  next();
}

app.post("/get-daraz-token", async (req, res) => {
  console.log("\n🔵 ========== GET DARAZ TOKEN REQUEST START ==========");
  console.log("📥 [INCOMING REQUEST]");
  console.log("   Method:", req.method);
  console.log("   URL:", req.url);
  console.log("   Headers:", JSON.stringify(req.headers, null, 2));
  console.log("   Body:", JSON.stringify(req.body, null, 2));

  const timestamp = Date.now().toString();
  const { code } = req.body;

  if (!code) {
    console.log("❌ [VALIDATION ERROR] Missing authorization code");
    return res.status(400).json({ error: "Missing code" });
  }

  console.log("✅ [VALIDATION] Authorization code received:", code);

  if (!APP_KEY || !APP_SECRET) {
    console.log("❌ [CONFIG ERROR] APP_KEY or APP_SECRET missing");
    console.log("   APP_KEY exists:", !!APP_KEY);
    console.log("   APP_SECRET exists:", !!APP_SECRET);
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }

  console.log("✅ [CONFIG] APP_KEY and APP_SECRET are configured");
  console.log("   APP_KEY:", APP_KEY);
  console.log("   APP_SECRET length:", APP_SECRET ? APP_SECRET.length : 0, "characters");

  const urlPath = "/auth/token/create";
  const params = {
    app_key: APP_KEY,
    code,
    sign_method: "sha256",
    timestamp,
  };

  console.log("📋 [PARAMS] Request parameters:");
  console.log("   URL Path:", urlPath);
  console.log("   Params:", JSON.stringify(params, null, 2));

  let sign;
  try {
    sign = generateSign(urlPath, params, APP_SECRET);
    console.log("✅ [SIGNATURE] Generated successfully");
    console.log("   Sign:", sign);
  } catch (error) {
    console.log("❌ [SIGNATURE ERROR]", error.message);
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  const requestPayload = { ...params, sign };
  console.log("📤 [DARAZ REQUEST] Sending to Daraz API:");
  console.log("   URL: https://api.daraz.pk/rest/auth/token/create");
  console.log("   Method: POST");
  console.log("   Payload:", JSON.stringify(requestPayload, null, 2));

  try {
    // Step 1: Get access token
    const tokenResponse = await axios.post(
      "https://api.daraz.pk/rest/auth/token/create",
      new URLSearchParams(requestPayload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("📥 [DARAZ RESPONSE] Received from Daraz:");
    console.log("   Status:", tokenResponse.status);
    console.log("   Status Text:", tokenResponse.statusText);
    console.log("   Headers:", JSON.stringify(tokenResponse.headers, null, 2));
    console.log("   Data:", JSON.stringify(tokenResponse.data, null, 2));

    const tokenData = tokenResponse.data;

    // Check if Daraz returned an error response (even with HTTP 200)
    if (tokenData.code && tokenData.code !== "0" && tokenData.code !== 0) {
      console.log("❌ [DARAZ API ERROR RESPONSE]");
      console.log("   Error Code:", tokenData.code);
      console.log("   Error Type:", tokenData.type);
      console.log("   Error Message:", tokenData.message);
      console.log("   Request ID:", tokenData.request_id);
      console.log("   Trace ID:", tokenData._trace_id_);
      console.log("🔵 ========== GET DARAZ TOKEN REQUEST END (ERROR) ==========\n");
      
      return res.status(500).json({
        error: "Daraz API returned an error",
        darazError: {
          code: tokenData.code,
          type: tokenData.type,
          message: tokenData.message,
          request_id: tokenData.request_id,
          _trace_id_: tokenData._trace_id_,
        },
        details: tokenData.message || "The Daraz API returned an error response"
      });
    }

    // Check if this is an error response by checking for error message/type
    if (tokenData.type || tokenData.message) {
      // If it has type/message but code is "0", it might still be an error
      const isErrorCode = tokenData.code && tokenData.code !== "0" && tokenData.code !== 0;
      if (isErrorCode || (tokenData.type && tokenData.type !== "Success")) {
        console.log("❌ [DARAZ API ERROR RESPONSE]");
        console.log("   Error Code:", tokenData.code);
        console.log("   Error Type:", tokenData.type);
        console.log("   Error Message:", tokenData.message);
        console.log("🔵 ========== GET DARAZ TOKEN REQUEST END (ERROR) ==========\n");
        
        return res.status(500).json({
          error: "Daraz API returned an error",
          darazError: {
            code: tokenData.code,
            type: tokenData.type,
            message: tokenData.message,
          },
          details: tokenData.message || "The Daraz API returned an error response"
        });
      }
    }

    const { access_token } = tokenData;

    console.log("🔍 [TOKEN EXTRACTION]");
    console.log("   Full response data keys:", Object.keys(tokenData || {}));
    console.log("   access_token exists:", !!access_token);
    console.log("   access_token value:", access_token ? `${access_token.substring(0, 20)}...` : "null/undefined");

    if (!access_token) {
      console.log("❌ [ERROR] Access token not found in response");
      console.log("   Response structure:", JSON.stringify(tokenData, null, 2));
      console.log("🔵 ========== GET DARAZ TOKEN REQUEST END (ERROR) ==========\n");
      return res.status(500).json({ 
        error: "Access token not received from Daraz",
        details: {
          responseData: tokenData,
          message: "The Daraz API response did not contain an access_token field"
        }
      });
    }

    console.log("✅ [TOKEN] Access token received successfully");

    // Step 2: Get seller/store info
    console.log("\n🟢 [STEP 2] Fetching seller information...");
    const sellerTimestamp = Date.now().toString();
    const sellerParams = {
      app_key: APP_KEY,
      access_token,
      timestamp: sellerTimestamp,
      sign_method: "sha256",
    };

    console.log("📋 [SELLER PARAMS]", JSON.stringify(sellerParams, null, 2));

    let sellerSign;
    try {
      sellerSign = generateSign("/seller/get", sellerParams, APP_SECRET);
      console.log("✅ [SELLER SIGNATURE] Generated:", sellerSign);
    } catch (error) {
      console.log("❌ [SELLER SIGNATURE ERROR]", error.message);
      return res.status(500).json({
        error: "Failed to generate seller request signature",
        message: error.message,
      });
    }

    console.log("📤 [SELLER REQUEST] Sending to Daraz API:");
    console.log("   URL: https://api.daraz.pk/rest/seller/get");
    console.log("   Method: GET");
    console.log("   Params:", JSON.stringify({ ...sellerParams, sign: sellerSign }, null, 2));

    const sellerResponse = await axios.get("https://api.daraz.pk/rest/seller/get", {
      params: {
        ...sellerParams,
        sign: sellerSign,
      },
    });

    console.log("📥 [SELLER RESPONSE] Received from Daraz:");
    console.log("   Status:", sellerResponse.status);
    console.log("   Data:", JSON.stringify(sellerResponse.data, null, 2));

    const sellerData = sellerResponse.data;

    // Validate seller data structure before accessing nested properties
    console.log("🔍 [SELLER DATA VALIDATION]");
    console.log("   sellerData exists:", !!sellerData);
    console.log("   sellerData.data exists:", !!sellerData?.data);
    console.log("   sellerData.data keys:", sellerData?.data ? Object.keys(sellerData.data) : "N/A");
    console.log("   sellerData.data.short_code exists:", !!sellerData?.data?.short_code);

    if (!sellerData || !sellerData.data) {
      console.log("⚠️ [WARNING] Seller data structure is incomplete");
      console.log("   Returning response without seller_id");
      return res.status(200).json({
        token: tokenData,
        seller: sellerData,
        seller_id: null,
        warning: "Seller data structure incomplete"
      });
    }

    const sellerId = sellerData.data.short_code || null;
    if (!sellerId) {
      console.log("⚠️ [WARNING] seller_id (short_code) not found in seller data");
    }

    // Return both token and seller details
    console.log("\n✅ [SUCCESS] Returning token and seller data");
    console.log("   seller_id:", sellerId);
    console.log("🔵 ========== GET DARAZ TOKEN REQUEST END ==========\n");

    return res.status(200).json({
      token: tokenData,
      seller: sellerData,
      seller_id: sellerId
    });

  } catch (error) {
    console.log("\n❌ [ERROR] Exception caught in get-daraz-token");
    console.log("   Error Type:", error.constructor.name);
    console.log("   Error Message:", error.message);
    
    if (error.response) {
      console.log("   [HTTP ERROR RESPONSE]");
      console.log("   Status:", error.response.status);
      console.log("   Status Text:", error.response.statusText);
      console.log("   Headers:", JSON.stringify(error.response.headers, null, 2));
      console.log("   Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("   [NETWORK ERROR]");
      console.log("   Request made but no response received");
      console.log("   Request:", JSON.stringify(error.request, null, 2));
    } else {
      console.log("   [OTHER ERROR]");
      console.log("   Error:", JSON.stringify(error, null, 2));
    }
    
    console.log("   Stack:", error.stack);
    console.log("🔵 ========== GET DARAZ TOKEN REQUEST END (ERROR) ==========\n");

    return res.status(500).json({
      error: "Failed to fetch token or seller data",
      details: error.response?.data || error.message
    });
  }
});

app.post("/refresh-daraz-token", async (req, res) => {
  const { refresh_token, region } = req.body;
  const timestamp = Date.now().toString();

  if (!refresh_token) {
    return res.status(400).json({ error: "Missing refresh_token" });
  }

  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }

  const normalizedRegion = region?.toLowerCase().trim();
  let apiBase = normalizedRegion
    ? REGION_ENDPOINTS[normalizedRegion]
    : REGION_ENDPOINTS[DEFAULT_REGION];

  if (region && !apiBase) {
    return res.status(400).json({ error: "Unsupported region" });
  }

  const urlPath = "/auth/token/refresh";
  const params = {
    app_key: APP_KEY,
    refresh_token,
    sign_method: "sha256",
    timestamp,
  };

  let sign;
  try {
    sign = generateSign(urlPath, params, APP_SECRET);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {
    const response = await axios.post(
      `${apiBase}${urlPath}`,
      new URLSearchParams({ ...params, sign }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to refresh token",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-daraz-orders", async (req, res) => {

  const timestamp = Date.now().toString();
  const { access_token, created_after, status } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }

  const urlPath = "/orders/get";
  const params = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    status,
    created_after, // only if provided
  };

  // Remove undefined/null values from params
  Object.keys(params).forEach(key => {
    if (params[key] === undefined || params[key] === null) {
      delete params[key];
    }
  });

  let sign;
  try {
    sign = generateSign(urlPath, params, APP_SECRET);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {

    const response = await axios.get(
      "https://api.daraz.pk/rest/orders/get",
      {
        params: {
          ...params,
          sign,
        },
      }
    );

    if (response.data) {
      if (response.data.data) {
        if (Array.isArray(response.data.data.orders)) {
          if (response.data.data.orders.length > 0) {

          }
        }
      }
    }

    return res.status(200).json(response.data); // send full response back to client

  } catch (error) {
    
    if (error.response) {
    } else if (error.request) {

    } else {
    }

    return res.status(500).json({
      error: "Failed to fetch orders",
      details: error.response?.data || error.message
    });
  }
});

app.get("/get-order-items", async (req, res) => {
  const timestamp = Date.now().toString();
  const { access_token, order_ids } = req.query; // optionally include order_id

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }

  const urlPath = "/orders/items/get";

  // These must be sorted alphabetically inside your generateSign function
  const params = {
    access_token,
    app_key: APP_KEY,
    sign_method: "sha256",
    timestamp,
    order_ids,
  };

  let sign;
  try {
    sign = generateSign(urlPath, params, APP_SECRET);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {
    const response = await axios.get("https://api.daraz.pk/rest/orders/items/get", {
      params: {
        ...params,
        sign,
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch order items",
      details: error.response?.data || error.message,
    });
  }
});

// app.get("/get-daraz-order-details", async (req, res) => {
//   const timestamp = Date.now().toString();
//   const { access_token, created_after, status } = req.query;

//   if (!access_token) {
//     return res.status(400).json({ error: "Missing access_token" });
//   }

//   // STEP 1: Get list of orders
//   const ordersUrlPath = "/orders/get";
//   const orderParams = {
//     app_key: APP_KEY,
//     access_token,
//     sign_method: "sha256",
//     timestamp,
//     status,
//     created_after,
//   };
//   const orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);

//   try {
//     const ordersResponse = await axios.get("https://api.daraz.pk/rest/orders/get", {
//       params: {
//         ...orderParams,
//         sign: orderSign,
//       },
//     });

//     const orders = ordersResponse.data.data?.orders || [];
//     if (orders.length === 0) {
//       return res.status(200).json({
//         countTotal: 0,
//         orderItems: [],
//       });
//     }

//     const order_ids_array = orders.map(order => order.order_id);

//     const order_ids = `[${order_ids_array.join(',')},]`;
//     // STEP 2: Get order items
//     const itemsUrlPath = "/orders/items/get";
//     const itemsTimestamp = Date.now().toString();
//     const itemParams = {
//       access_token,
//       app_key: APP_KEY,
//       sign_method: "sha256",
//       timestamp: itemsTimestamp,
//       order_ids,
//     };
//     const itemSign = generateSign(itemsUrlPath, itemParams, APP_SECRET);
//     const itemsResponse = await axios.get("https://api.daraz.pk/rest/orders/items/get", {
//       params: {
//         ...itemParams,
//         sign: itemSign,
//       },
//     });

//     const orderItems = itemsResponse.data;

//     return res.status(200).json({
//       countTotal: orders.length,
//       message: 'SOME ISSUE',
//       orderNumbers: order_ids,
//       orderItems: orderItems,
//     });

//   } catch (error) {
//     return res.status(500).json({
//       error: "Failed to fetch order details",
//       details: error.response?.data || error.message
//     });
//   }
// });

// Simple test API to check server status via browser

app.get("/get-daraz-order-details", async (req, res) => {

  const timestamp = Date.now().toString();
  const { access_token, update_after, created_after, status } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }

  const ordersUrlPath = "/orders/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    status,
  };

  // ✅ Add `trans_type` only if it exists
  if (created_after) {
    orderParams.created_after = created_after;
  }
  // ✅ Add `trans_type` only if it exists
  if (update_after) {
    orderParams.update_after = update_after;
  }

  let orderSign;
  try {
    orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {
    // STEP 1: Get list of orders
    const ordersResponse = await axios.get("https://api.daraz.pk/rest/orders/get", {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const orders = ordersResponse.data.data?.orders || [];
    
    if (orders.length > 0) {

    }

    if (orders.length === 0) {
      return res.status(200).json({
        countTotal: 0,
        orderItems: [],
      });
    }

    const order_ids_array = orders.map(order => {
      if (!order) {
        return null;
      }
      return order.order_id;
    }).filter(id => id !== null);

    // STEP 2: Break into chunks of 50 and fetch items
    const chunkSize = 50;
    const orderItemsCombined = [];
    const totalChunks = Math.ceil(order_ids_array.length / chunkSize);

    for (let i = 0; i < order_ids_array.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = order_ids_array.slice(i, i + chunkSize);
      const order_ids = `[${chunk.join(',')}]`;

      const itemsUrlPath = "/orders/items/get";
      const itemsTimestamp = Date.now().toString();
      const itemParams = {
        access_token,
        app_key: APP_KEY,
        sign_method: "sha256",
        timestamp: itemsTimestamp,
        order_ids,
      };

      let itemSign;
      try {
        itemSign = generateSign(itemsUrlPath, itemParams, APP_SECRET);
      } catch (error) {
        return res.status(500).json({
          error: "Failed to generate items request signature",
          message: error.message,
        });
      }

      const itemsResponse = await axios.get("https://api.daraz.pk/rest/orders/items/get", {
        params: {
          ...itemParams,
          sign: itemSign,
        },
      });

      // Safety check: ensure data.data exists and is an array
      if (!itemsResponse.data) {
        continue; // Skip this chunk and continue with next
      }

      if (!itemsResponse.data.data) {
        continue; // Skip this chunk and continue with next
      }

      if (!Array.isArray(itemsResponse.data.data)) {
        continue; // Skip this chunk and continue with next
      }

      const items = itemsResponse.data.data;

      if (items.length > 0) {

      }

      // Safety check: filter out any null/undefined items before pushing
      const validItems = items.filter(item => {
        if (!item) {
          return false;
        }
        return true;
      });

      orderItemsCombined.push(...validItems);
    }

    return res.status(200).json({
      countTotal: orders.length,
      orderItems: orderItemsCombined,
    });

  } catch (error) {
    
    if (error.response) {
    } else if (error.request) {
    } else {
    }

    return res.status(500).json({
      error: "Failed to fetch order details",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-daraz-income-details", async (req, res) => {
  console.log("\n🟢 ========== GET DARAZ INCOME DETAILS REQUEST START ==========");
  console.log("📥 [INCOMING REQUEST]");
  console.log("   Method:", req.method);
  console.log("   URL:", req.url);
  console.log("   Query Params:", JSON.stringify(req.query, null, 2));

  const timestamp = Date.now().toString();
  const { access_token, storeName, created_after } = req.query;

  if (!access_token) {
    console.log("❌ [VALIDATION ERROR] Missing access_token");
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!created_after) {
    console.log("❌ [VALIDATION ERROR] Missing created_after parameter");
    console.log("   ⚠️ created_after is mandatory for /finance/payout/status/get API");
    return res.status(400).json({ 
      error: "Missing created_after parameter",
      details: "The created_after parameter is mandatory for this API endpoint"
    });
  }

  console.log("✅ [VALIDATION] Access token received");
  console.log("   🔑 Access Token:", access_token ? `${access_token.substring(0, 20)}...` : "MISSING");
  console.log("   🏪 Store Name:", storeName || "Not provided");
  console.log("   📅 Created after (raw from query):", created_after);

  // Decode URL-encoded date if needed and use correct parameter name
  let createdAfter = created_after;
  // Decode URL encoding (e.g., %3A becomes :)
  try {
    const beforeDecode = createdAfter;
    createdAfter = decodeURIComponent(createdAfter);
    console.log("   🔄 [URL DECODING]");
    console.log("      Before decode:", beforeDecode);
    console.log("      After decode:", createdAfter);
    console.log("      Changed:", beforeDecode !== createdAfter);
  } catch (e) {
    console.log("   ⚠️ [URL DECODE ERROR] Could not decode created_after");
    console.log("      Error:", e.message);
    console.log("      Using value as-is:", createdAfter);
  }

  const ordersUrlPath = "/finance/payout/status/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
  };

  // Add created_after (Daraz expects snake_case and it's mandatory)
  orderParams.created_after = createdAfter;
  console.log("   ✅ [PARAM] Added created_after parameter:", createdAfter);

  console.log("📋 [REQUEST PREPARATION]");
  console.log("   📍 URL Path:", ordersUrlPath);
  console.log("   ⏰ Timestamp:", timestamp);
  console.log("   📦 Final Params (before signature):", JSON.stringify(orderParams, null, 2));
  console.log("   🔑 APP_KEY:", APP_KEY ? `${APP_KEY.substring(0, 5)}...` : "MISSING");
  console.log("   🔐 APP_SECRET:", APP_SECRET ? "***SET***" : "MISSING");

  let orderSign;
  try {
    console.log("🔐 [SIGNATURE GENERATION]");
    console.log("   📋 URL Path:", ordersUrlPath);
    console.log("   📦 Params for signature:", JSON.stringify(orderParams, null, 2));
    orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);
    console.log("   ✅ Signature generated successfully");
    console.log("   🔑 Signature (first 20 chars):", orderSign ? `${orderSign.substring(0, 20)}...` : "EMPTY");
  } catch (error) {
    console.log("❌ [SIGNATURE GENERATION ERROR]");
    console.log("   ⚠️ Error Type:", error.constructor.name);
    console.log("   💬 Error Message:", error.message);
    console.log("   📚 Error Stack:", error.stack);
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {
    const darazApiUrl = "https://api.daraz.pk/rest/finance/payout/status/get";
    console.log("📤 [DARAZ API REQUEST]");
    console.log("   🔗 API Endpoint: " + darazApiUrl);
    console.log("   📋 API Path: /finance/payout/status/get");
    console.log("   📦 Request Params:", JSON.stringify({
      ...orderParams,
      sign: orderSign,
    }, null, 2));
    
    const financeRespone = await axios.get(darazApiUrl, {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    console.log("📥 [DARAZ API RESPONSE]");
    console.log("   🔗 API Endpoint: " + darazApiUrl);
    console.log("   📋 API Path: /finance/payout/status/get");
    console.log("   ✅ HTTP Status:", financeRespone.status);
    console.log("   📝 Status Text:", financeRespone.statusText);
    console.log("   📊 Full Response Data:", JSON.stringify(financeRespone.data, null, 2));
    console.log("   🔍 Response Structure Analysis:", JSON.stringify({
      hasData: !!financeRespone.data,
      hasDataData: !!financeRespone.data?.data,
      dataType: Array.isArray(financeRespone.data?.data) ? 'array' : typeof financeRespone.data?.data,
      dataLength: Array.isArray(financeRespone.data?.data) ? financeRespone.data.data.length : 'N/A',
      responseKeys: financeRespone.data ? Object.keys(financeRespone.data) : [],
    }, null, 2));

    // Check if HTTP status indicates an error
    if (financeRespone.status >= 400) {
      console.log("❌ [DARAZ API HTTP ERROR]");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   ⚠️ HTTP Status:", financeRespone.status);
      console.log("   📊 Full Error Response:", JSON.stringify(financeRespone.data, null, 2));
      return res.status(financeRespone.status).json({
        error: "Daraz API returned an HTTP error",
        apiEndpoint: darazApiUrl,
        apiPath: "/finance/payout/status/get",
        status: financeRespone.status,
        darazResponse: financeRespone.data,
      });
    }

    // Safety check: ensure data.data exists and is an array before filtering
    if (!financeRespone.data) {
      console.log("❌ [DARAZ API ERROR] Response has no data property");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      return res.status(500).json({
        error: "Invalid response from Daraz API",
        apiEndpoint: darazApiUrl,
        apiPath: "/finance/payout/status/get",
        details: "Response data is missing",
      });
    }

    // Check if this is a Daraz API error response (even with 200 status)
    // Note: code "0" means success in Daraz API, so we only treat non-zero codes as errors
    const responseCode = financeRespone.data.code;
    const isErrorCode = responseCode && responseCode !== "0" && responseCode !== 0;
    const hasErrorMessage = financeRespone.data.message;
    const hasErrorType = financeRespone.data.type;
    
    if (isErrorCode || hasErrorMessage || hasErrorType) {
      console.log("❌ [DARAZ API ERROR RESPONSE]");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   ⚠️ Daraz returned an error response (even with HTTP 200):");
      console.log("   🔢 Error Code:", financeRespone.data.code);
      console.log("   📌 Error Type:", financeRespone.data.type);
      console.log("   💬 Error Message:", financeRespone.data.message);
      console.log("   🆔 Request ID:", financeRespone.data.request_id);
      console.log("   🔍 Trace ID:", financeRespone.data._trace_id_);
      console.log("   📊 Full Error Response:", JSON.stringify(financeRespone.data, null, 2));
      
      return res.status(500).json({
        error: "Daraz API returned an error",
        apiEndpoint: darazApiUrl,
        apiPath: "/finance/payout/status/get",
        darazError: {
          code: financeRespone.data.code,
          type: financeRespone.data.type,
          message: financeRespone.data.message,
          request_id: financeRespone.data.request_id,
          _trace_id_: financeRespone.data._trace_id_,
        },
        details: "The Daraz API returned an error response instead of data. Check the darazError object for details.",
        fullResponse: financeRespone.data,
      });
    }
    
    // Log success code if present
    if (responseCode === "0" || responseCode === 0) {
      console.log("✅ [DARAZ API SUCCESS] Response code indicates success (code: 0)");
    }

    if (!financeRespone.data.data) {
      console.log("❌ [DARAZ API ERROR] Response data.data is missing");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   🔑 Available keys in response.data:", Object.keys(financeRespone.data));
      console.log("   📊 Full response.data:", JSON.stringify(financeRespone.data, null, 2));
      
      return res.status(500).json({
        error: "Invalid response from Daraz API",
        apiEndpoint: darazApiUrl,
        apiPath: "/finance/payout/status/get",
        details: "Response data.data is missing",
        availableKeys: Object.keys(financeRespone.data),
        fullResponse: financeRespone.data,
      });
    }

    if (!Array.isArray(financeRespone.data.data)) {
      console.log("❌ [DARAZ API ERROR] Response data.data is not an array");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   ⚠️ Expected: Array");
      console.log("   📌 Actual Type:", typeof financeRespone.data.data);
      console.log("   📊 Actual Value:", JSON.stringify(financeRespone.data.data, null, 2));
      console.log("   🔍 Is Array?:", Array.isArray(financeRespone.data.data));
      return res.status(500).json({
        error: "Invalid response from Daraz API",
        apiEndpoint: darazApiUrl,
        apiPath: "/finance/payout/status/get",
        details: "Response data.data is not an array",
        expectedType: "array",
        actualType: typeof financeRespone.data.data,
        actualValue: financeRespone.data.data,
      });
    }

    console.log("📊 [DATA PROCESSING]");
    console.log("   📈 Total items received:", financeRespone.data.data.length);

    if (financeRespone.data.data.length > 0) {
      console.log("   🔍 [SAMPLE DATA] First item structure:");
      console.log("      Paid status:", financeRespone.data.data[0].paid);
      console.log("      All keys:", Object.keys(financeRespone.data.data[0]));
      console.log("      Full first item:", JSON.stringify(financeRespone.data.data[0], null, 2));
      
      // Show distribution of paid statuses
      const paidStatuses = {};
      financeRespone.data.data.forEach(item => {
        const status = item?.paid || "unknown";
        paidStatuses[status] = (paidStatuses[status] || 0) + 1;
      });
      console.log("   📊 [STATUS DISTRIBUTION] Paid status breakdown:", JSON.stringify(paidStatuses, null, 2));
    } else {
      console.log("   ℹ️ [EMPTY] No data items received from Daraz API");
    }

    console.log("🔍 [FILTERING] Filtering for unpaid statements (paid === '0')");
    let skippedCount = 0;
    const unpaidStatements = financeRespone.data.data
      .filter(item => {
        if (!item) {
          skippedCount++;
          console.log(`   ⚠️ [SKIP ${skippedCount}] Found null/undefined item, skipping`);
          return false;
        }
        const isUnpaid = item.paid === "0";
        if (!isUnpaid) {
          skippedCount++;
        }
        return isUnpaid;
      })
      .map(item => ({
        ...item,
        storeName: storeName, // ← add your variable here
      }));

    console.log("✅ [FILTER RESULTS]");
    console.log("   📊 Total items before filter:", financeRespone.data.data.length);
    console.log("   ✅ Unpaid items (paid === '0'):", unpaidStatements.length);
    console.log("   ⏭️ Skipped items:", skippedCount);
    console.log("   📈 Filter efficiency:", `${((unpaidStatements.length / financeRespone.data.data.length) * 100).toFixed(2)}% unpaid`);
    
    if (unpaidStatements.length > 0) {
      console.log("   🔍 [SAMPLE UNPAID] First unpaid item:", JSON.stringify({
        paid: unpaidStatements[0].paid,
        storeName: unpaidStatements[0].storeName,
        keys: Object.keys(unpaidStatements[0]),
      }, null, 2));
    }
    
    console.log("🟢 ========== GET DARAZ INCOME DETAILS REQUEST END ==========\n");

    return res.status(200).json({
      financeRespone: unpaidStatements,
    });

  } catch (error) {
    const darazApiUrl = "https://api.daraz.pk/rest/finance/payout/status/get";
    console.log("\n❌ [EXCEPTION ERROR] Exception caught in get-daraz-income-details");
    console.log("   🔗 API Endpoint: " + darazApiUrl);
    console.log("   📋 API Path: /finance/payout/status/get");
    console.log("   ⚠️ Error Type:", error.constructor.name);
    console.log("   💬 Error Message:", error.message);
    console.log("   📚 Error Stack:", error.stack);
    
    if (error.response) {
      console.log("   ❌ [HTTP ERROR RESPONSE]");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   ⚠️ HTTP Status:", error.response.status);
      console.log("   📝 Status Text:", error.response.statusText);
      console.log("   📊 Full Error Response Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log("   ❌ [NETWORK ERROR]");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   ⚠️ Request made but no response received from Daraz API");
    } else {
      console.log("   ❌ [OTHER ERROR]");
      console.log("   🔗 API Endpoint: " + darazApiUrl);
      console.log("   📋 API Path: /finance/payout/status/get");
      console.log("   📊 Full Error Object:", JSON.stringify(error, null, 2));
    }
    
    console.log("🟢 ========== GET DARAZ INCOME DETAILS REQUEST END (ERROR) ==========\n");

    return res.status(500).json({
      error: "Failed to fetch order details",
      apiEndpoint: darazApiUrl,
      apiPath: "/finance/payout/status/get",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-daraz-query-income-details", async (req, res) => {
  const timestamp = Date.now().toString();
  const { access_token, trade_order_id, end_time, start_time, trans_type, limit, trade_order_line_id } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  const ordersUrlPath = "/finance/transaction/details/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    start_time,
    end_time,
  };

  // ✅ Add `trans_type` only if it exists
  if (trans_type) {
    orderParams.trans_type = trans_type;
  }

  if (trade_order_id) {
    orderParams.trade_order_id = trade_order_id;
  }
  if (limit) {
    orderParams.limit = limit;
  }
  if (trade_order_line_id) {
    orderParams.trade_order_line_id = trade_order_line_id;
  }
  const orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);

  try {
    // STEP 1: Get list of orders
    const financeRespone = await axios.get("https://api.daraz.pk/rest/finance/transaction/details/get", {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const transactions = financeRespone?.data?.data || [];
    const total = calculateOrderBalances(transactions);

    return res.status(200).json({
      message: 'Transaction details retrieved successfully',
      data: {
        total: total,
        transactions: transactions,
        summary: {
          totalTransactions: transactions.length,
          totalOrders: total.length,
          totalAmount: total.reduce((sum, order) => sum + order.total_amount, 0)
        }
      },
      error: null,
      statusCode: 200,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch Transaction details",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-daraz-delivered-order-details", async (req, res) => {

  const timestamp = Date.now().toString();
  const { access_token, update_after, update_before, created_after, status } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  const ordersUrlPath = "/orders/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    status,
  };

  if (created_after) {
    orderParams.created_after = created_after;
  }

  if (update_after) {
    orderParams.update_after = update_after;
  }

  if (update_before) {
    orderParams.update_before = update_before;
  }

  let orderSign;
  try {
    orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate request signature",
      message: error.message,
    });
  }

  try {
    // STEP 1: Get list of orders
    const ordersResponse = await axios.get("https://api.daraz.pk/rest/orders/get", {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const orders = ordersResponse.data.data?.orders || [];
    
    if (orders.length > 0) {

    }

    if (orders.length === 0) {
      return res.status(200).json({
        countTotal: 0,
        orderItems: [],
      });
    }

    const order_ids_array = orders.map(order => order.order_id);

    // STEP 2: Break into chunks of 50 and fetch items
    const chunkSize = 50;
    const orderItemsCombined = [];
    const totalChunks = Math.ceil(order_ids_array.length / chunkSize);

    for (let i = 0; i < order_ids_array.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = order_ids_array.slice(i, i + chunkSize);
      const order_ids = `[${chunk.join(',')}]`;

      const itemsUrlPath = "/orders/items/get";
      const itemsTimestamp = Date.now().toString();
      const itemParams = {
        access_token,
        app_key: APP_KEY,
        sign_method: "sha256",
        timestamp: itemsTimestamp,
        order_ids,
      };

      let itemSign;
      try {
        itemSign = generateSign(itemsUrlPath, itemParams, APP_SECRET);
      } catch (error) {
        return res.status(500).json({
          error: "Failed to generate items request signature",
          message: error.message,
        });
      }

      const itemsResponse = await axios.get("https://api.daraz.pk/rest/orders/items/get", {
        params: {
          ...itemParams,
          sign: itemSign,
        },
      });

      const items = itemsResponse.data?.data || [];

      if (items.length > 0) {

        if (items[0].order_items && Array.isArray(items[0].order_items) && items[0].order_items.length > 0) {

        }
      }

      // ✅ Inject access_token into each order_items array with safety checks
      const itemsWithTokenInside = items.map((order, orderIndex) => {
        if (!order) {
          return null;
        }

        // Safety check: ensure order_items exists and is an array
        if (!order.order_items) {
          return {
            ...order,
            order_items: [], // Set to empty array instead of undefined
          };
        }

        if (!Array.isArray(order.order_items)) {
          return {
            ...order,
            order_items: [], // Set to empty array instead of non-array
          };
        }

        return {
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          access_token,
        })),
        };
      }).filter(order => order !== null); // Remove null entries

      orderItemsCombined.push(...itemsWithTokenInside);
    }

    const filteredOrderItems = orderItemsCombined
      .map((order, orderIndex) => {
        if (!order) {
          return null;
        }

        // Safety check: ensure order_items exists and is an array before filtering
        if (!order.order_items) {
          return {
        ...order,
            order_items: [],
          };
        }

        if (!Array.isArray(order.order_items)) {
          return {
            ...order,
            order_items: [],
          };
        }

        const filteredItems = order.order_items.filter(item => {
          if (!item) return false;
          return item.status === status;
        });

        return {
          ...order,
          order_items: filteredItems,
        };
      })
      .filter(order => {
        if (!order) return false;
        // Safety check: ensure order_items exists and has length
        const hasItems = order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0;
        return hasItems;
      }); // remove empty orders

    return res.status(200).json({
      countTotal: orders.length,
      orderItems: filteredOrderItems,
    });

  } catch (error) {
    
    if (error.response) {
    } else if (error.request) {
    } else {
    }

    return res.status(500).json({
      error: "Failed to fetch order details",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-daraz-order-logistics", async (req, res) => {
  const timestamp = Date.now().toString();
  const { access_token, order_id, package_id_list, locale } = req.query;

  if (!access_token || !order_id || !package_id_list || !locale) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const urlPath = "/order/logistic/get";
  const params = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    order_id,
    package_id_list,
    locale,
  };

  const sign = generateSign(urlPath, params, APP_SECRET);

  try {
    const response = await axios.get("https://api.daraz.pk/rest/order/logistic/get", {
      params: {
        ...params,
        sign,
      },
    });

    return res.status(200).json(response.data);

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch logistics info",
      details: error.response?.data || error.message,
    });
  }
});

app.post("/make-order-rts", async (req, res) => {
  const timestamp = Date.now().toString();
  const readyToShipReq = req.body || {};
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!readyToShipReq || !Array.isArray(readyToShipReq.packages)) {
    return res.status(400).json({ error: "Missing or invalid packages" });
  }

  const apiPath = "/order/package/rts";
  const params = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
  };

  // For POST requests with body, include the body content in signature
  const paramsWithBody = {
    ...params,
    readyToShipReq: JSON.stringify(readyToShipReq)
  };

  const sign = generateSign(apiPath, paramsWithBody, APP_SECRET);

  try {
    const response = await axios.post(
      "https://api.daraz.pk/rest/order/package/rts",
      new URLSearchParams({ readyToShipReq: JSON.stringify(readyToShipReq) }),
      {
        params: { ...params, sign },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to mark package(s) as RTS",
      details: error.response?.data || error.message,
    });
  }
});

app.post("/make-order-pack-and-rts", async (req, res) => {
  const timestamp = Date.now().toString();
  const packReq = req.body || {};
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }

  if (!packReq || !Array.isArray(packReq.pack_order_list)) {
    return res.status(400).json({ error: "Missing or invalid pack_order_list" });
  }

  try {
    // STEP 1: Pack the orders
    const packApiPath = "/order/fulfill/pack";
    const packParams = {
      app_key: APP_KEY,
      access_token,
      sign_method: "sha256",
      timestamp,
    };

    const packParamsWithBody = {
      ...packParams,
      packReq: JSON.stringify(packReq)
    };

    const packSign = generateSign(packApiPath, packParamsWithBody, APP_SECRET);

    const packResponse = await axios.post(
      "https://api.daraz.pk/rest/order/fulfill/pack",
      new URLSearchParams({ packReq: JSON.stringify(packReq) }),
      {
        params: { ...packParams, sign: packSign },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // STEP 2: Extract package IDs from pack response and mark as RTS
    
    // Extract package IDs from the pack response
    const packageIds = [];
    if (packResponse.data && packResponse.data.result && packResponse.data.result.data) {
      const packData = packResponse.data.result.data;
      
      // Check for pack_order_list structure
      if (packData.pack_order_list && Array.isArray(packData.pack_order_list)) {
        packData.pack_order_list.forEach(order => {
          if (order.order_item_list && Array.isArray(order.order_item_list)) {
            order.order_item_list.forEach(item => {
              if (item.package_id) {
                packageIds.push(item.package_id);
              }
            });
          }
        });
      }
      
      // Also check for direct packages structure
      if (packData.packages && Array.isArray(packData.packages)) {
        packData.packages.forEach(pkg => {
          if (pkg.package_id) {
            packageIds.push(pkg.package_id);
          }
        });
      }
      
      // Also check for direct package_id in response
      if (packData.package_id) {
        packageIds.push(packData.package_id);
      }
    }

    if (packageIds.length === 0) {
      return res.status(200).json({
        message: "Orders packed successfully, but no package IDs found for RTS",
        packResult: packResponse.data,
        rtsResult: null
      });
    }

    // Create RTS request
    const readyToShipReq = {
      packages: packageIds.map(packageId => ({
        package_id: packageId
      }))
    };

    // STEP 3: Mark packages as RTS
    const rtsTimestamp = Date.now().toString();
    const rtsApiPath = "/order/package/rts";
    const rtsParams = {
      app_key: APP_KEY,
      access_token,
      sign_method: "sha256",
      timestamp: rtsTimestamp,
    };

    const rtsParamsWithBody = {
      ...rtsParams,
      readyToShipReq: JSON.stringify(readyToShipReq)
    };

    const rtsSign = generateSign(rtsApiPath, rtsParamsWithBody, APP_SECRET);

    const rtsResponse = await axios.post(
      "https://api.daraz.pk/rest/order/package/rts",
      new URLSearchParams({ readyToShipReq: JSON.stringify(readyToShipReq) }),
      {
        params: { ...rtsParams, sign: rtsSign },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Return combined result
    return res.status(200).json({
      message: "Orders packed and marked as RTS successfully",
      packResult: packResponse.data,
      rtsResult: rtsResponse.data
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to pack orders and mark as RTS",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/get-practitioners", async (req, res) => {

  try {
    // Return hardcoded practitioner data
    const practitioners = [
      {
        "id": "685d2ada8385f0131d591f67",
        "name": "Malik Humza",
        "email": "1@email.com",
        "role": "practitioner",
        "phoneNumber": "+921111111111",
        "createdAt": "2025-06-26T11:11:22.184Z",
        "updatedAt": "2025-06-26T11:11:22.184Z"
      },
      {
        "id": "6876397d04420f9830b4a8c9",
        "name": "Haleema MoonSys",
        "email": "haleema@email.com",
        "role": "practitioner",
        "phoneNumber": "03014358102",
        "createdAt": "2025-07-15T11:20:29.936Z",
        "updatedAt": "2025-07-21T11:45:47.504Z"
      },
      {
        "id": "6888de0c5e9d132a9f2a3516",
        "name": "Tamoor Malik",
        "email": "tamoormalik088@gmail.com",
        "role": "practitioner",
        "phoneNumber": "03215799205",
        "createdAt": "2025-07-29T14:43:24.050Z",
        "updatedAt": "2025-07-29T14:43:24.050Z"
      }
    ];

    return res.status(200).json({
      message: 'Practitioners retrieved successfully',
      data: {
        totalPractitioners: practitioners.length,
        practitioners: practitioners
      },
      error: null,
      statusCode: 200,
    });

  } catch (error) {
    
    return res.status(500).json({
      message: 'Something went wrong while fetching practitioners',
      data: null,
      error: error.message,
      statusCode: 500,
    });
  }
});

// ============================================================================
// PRODUCT & SKU APIs - Handle calculations server-side
// ============================================================================

/**
 * Get all products for a user
 * GET /api/products/:userId
 */
app.get("/api/products/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        details: "Please configure Firebase Admin credentials"
      });
    }

    const db = admin.database();
    const productsRef = db.ref(`users/${userId}/products`);
    const snapshot = await productsRef.once("value");
    const products = snapshot.val() || {};

    // Convert to array format with IDs
    const productsArray = Object.entries(products).map(([id, value]) => ({
      id,
      ...value,
    }));

    return res.status(200).json({
      message: "Products retrieved successfully",
      data: productsArray,
      count: productsArray.length,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
});

/**
 * Get a specific product by ID
 * GET /api/products/:userId/:productId
 */
app.get("/api/products/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        details: "Please configure Firebase Admin credentials"
      });
    }

    const db = admin.database();
    const productRef = db.ref(`users/${userId}/products/${productId}`);
    const snapshot = await productRef.once("value");
    const product = snapshot.val();

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        statusCode: 404,
      });
    }

    // Normalize price to number
    const normalizedProduct = {
      id: productId,
      ...product,
      price: typeof product.price === 'string' 
        ? parseFloat(product.price) || 0 
        : (typeof product.price === 'number' ? product.price : 0)
    };

    return res.status(200).json({
      message: "Product retrieved successfully",
      data: normalizedProduct,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      error: "Failed to fetch product",
      details: error.message,
    });
  }
});

/**
 * Calculate SKU price (quantity * unit price)
 * POST /api/skus/calculate
 * Body: { quantity, unitPrice }
 */
app.post("/api/skus/calculate", async (req, res) => {
  try {
    const { quantity, unitPrice } = req.body;

    // Validation
    if (quantity === undefined || quantity === null || quantity === '') {
      return res.status(400).json({
        error: "Missing or invalid quantity",
        statusCode: 400,
      });
    }

    if (unitPrice === undefined || unitPrice === null || unitPrice === '') {
      return res.status(400).json({
        error: "Missing or invalid unitPrice",
        statusCode: 400,
      });
    }

    // Parse and normalize values
    const quantityNum = parseFloat(quantity) || 0;
    let priceNum = 0;
    
    if (typeof unitPrice === 'string') {
      priceNum = parseFloat(unitPrice) || 0;
    } else if (typeof unitPrice === 'number') {
      priceNum = unitPrice;
    } else {
      priceNum = parseFloat(String(unitPrice || '0')) || 0;
    }

    // Calculate total price
    const calculatedPrice = quantityNum * priceNum;

    return res.status(200).json({
      message: "SKU price calculated successfully",
      data: {
        quantity: quantityNum,
        unitPrice: priceNum,
        totalPrice: calculatedPrice,
        formattedPrice: calculatedPrice.toFixed(2),
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error calculating SKU price:", error);
    return res.status(500).json({
      error: "Failed to calculate SKU price",
      details: error.message,
    });
  }
});

/**
 * Update SKU with calculated price
 * PUT /api/skus/:userId/:sku
 * Body: { productId, quantity, productName }
 */
app.put("/api/skus/:userId/:sku", async (req, res) => {
  try {
    const { userId, sku } = req.params;
    const { productId, quantity, productName } = req.body;

    if (!userId || !sku) {
      return res.status(400).json({ error: "Missing userId or sku" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        details: "Please configure Firebase Admin credentials"
      });
    }

    // Fetch product to get unit price
    const db = admin.database();
    const productRef = db.ref(`users/${userId}/products/${productId}`);
    const productSnapshot = await productRef.once("value");
    const product = productSnapshot.val();

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        statusCode: 404,
      });
    }

    // Normalize price
    const unitPrice = typeof product.price === 'string' 
      ? parseFloat(product.price) || 0 
      : (typeof product.price === 'number' ? product.price : 0);

    // Normalize quantity
    const quantityNum = parseFloat(quantity || '0') || 0;

    // Calculate total price server-side
    const calculatedPrice = quantityNum * unitPrice;

    // Update SKU in Firebase
    const skuRef = db.ref(`users/${userId}/skusList/${sku}`);
    const updates = {
      price: calculatedPrice,
      productId: productId,
      productQuantity: quantityNum.toString(),
      productName: productName || product.productName || '',
      sku: sku,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    await skuRef.update(updates);

    return res.status(200).json({
      message: "SKU updated successfully",
      data: {
        sku,
        ...updates,
        unitPrice,
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    return res.status(500).json({
      error: "Failed to update SKU",
      details: error.message,
    });
  }
});

/**
 * Calculate order totals from order items
 * POST /api/orders/calculate-totals
 * Body: { items: [{ price, quantity, ... }, ...] }
 */
app.post("/api/orders/calculate-totals", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Missing or invalid items array",
        statusCode: 400,
      });
    }

    // Calculate total for each item and overall total
    let grandTotal = 0;
    const enrichedItems = items.map(item => {
      // Handle different price field names (price, unitPrice, etc.)
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : item.price;
      const quantity = item.quantity || item.productQuantity || 0;

      // Normalize to numbers
      const priceNum = typeof unitPrice === 'number' 
        ? unitPrice 
        : parseFloat(unitPrice || '0') || 0;
      const qtyNum = typeof quantity === 'number' 
        ? quantity 
        : parseFloat(quantity || '0') || 0;

      // Calculate item total
      const itemTotal = priceNum * qtyNum;
      grandTotal += itemTotal;

      return {
        ...item,
        unitPrice: priceNum,
        quantity: qtyNum,
        totalPrice: itemTotal,
        formattedTotal: itemTotal.toFixed(2),
      };
    });

    return res.status(200).json({
      message: "Order totals calculated successfully",
      data: {
        items: enrichedItems,
        summary: {
          totalItems: enrichedItems.length,
          grandTotal: grandTotal,
          formattedGrandTotal: grandTotal.toFixed(2),
        },
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error calculating order totals:", error);
    return res.status(500).json({
      error: "Failed to calculate order totals",
      details: error.message,
    });
  }
});

/**
 * Calculate stock total from products
 * POST /api/stock/calculate-total
 * Body: { products: [{ price, quantity, ... }, ...] }
 */
app.post("/api/stock/calculate-total", async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        error: "Missing or invalid products array",
        statusCode: 400,
      });
    }

    // Calculate total stock value
    let totalStockValue = 0;
    const enrichedProducts = products.map(product => {
      const price = product.price || 0;
      const quantity = product.quantity || 0;

      // Normalize to numbers
      const priceNum = typeof price === 'number' 
        ? price 
        : parseFloat(price || '0') || 0;
      const qtyNum = typeof quantity === 'number' 
        ? quantity 
        : parseFloat(quantity || '0') || 0;

      // Calculate product total
      const productTotal = priceNum * qtyNum;
      totalStockValue += productTotal;

      return {
        ...product,
        price: priceNum,
        quantity: qtyNum,
        totalValue: productTotal,
        formattedTotal: productTotal.toFixed(2),
      };
    });

    return res.status(200).json({
      message: "Stock total calculated successfully",
      data: {
        products: enrichedProducts,
        summary: {
          totalProducts: enrichedProducts.length,
          totalStockValue: totalStockValue,
          formattedTotalValue: totalStockValue.toFixed(2),
        },
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error calculating stock total:", error);
    return res.status(500).json({
      error: "Failed to calculate stock total",
      details: error.message,
    });
  }
});

app.get("/test", (req, res) => {
  res.send("API is working fine and sound!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}/docs`);
});
