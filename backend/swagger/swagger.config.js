const { SWAGGER_SERVER_URL } = require("../config/constants");

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
      name: "Daraz Orders",
      description: "Daraz order details endpoints for fetching order items",
    },
    {
      name: "Daraz Products",
      description: "Daraz product listing endpoints for connected stores",
    },
    {
      name: "Daraz Reviews",
      description: "Daraz review retrieval and seller reply endpoints",
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
      url: SWAGGER_SERVER_URL,
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
  paths: {},
};

module.exports = swaggerDefinition;
