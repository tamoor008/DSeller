# Swagger API Documentation Guide

## Accessing Swagger UI

Once your backend server is running, you can access the Swagger documentation at:

**http://localhost:3001/docs**

## Available API Endpoints

### 🏥 Health
- `GET /test` - Test endpoint to verify API is working

### 🔐 Auth (Daraz)
- `POST /get-daraz-token` - Create Daraz access token
- `POST /refresh-daraz-token` - Refresh Daraz access token

### 📦 Orders (Daraz)
- `GET /get-daraz-orders` - Fetch Daraz orders
- `GET /get-order-items` - Fetch items for Daraz orders
- `GET /get-daraz-order-details` - Fetch orders plus item details
- `GET /get-daraz-delivered-order-details` - Get delivered orders with filtered items
- `GET /get-daraz-order-logistics` - Get order logistics information
- `POST /make-order-rts` - Mark order packages as Ready to Ship (RTS)
- `POST /make-order-pack-and-rts` - Pack orders and mark as Ready to Ship

### 💰 Finance (Daraz)
- `GET /get-daraz-income-details` - Get unpaid payout statements
- `GET /get-daraz-query-income-details` - Get transaction details with order balances

### 👥 Practitioners
- `GET /get-practitioners` - Get list of practitioners

### 🛍️ Products (NEW - Server-side calculations)
- `GET /api/products/{userId}` - Get all products for a user
- `GET /api/products/{userId}/{productId}` - Get a specific product by ID

### 📋 SKUs (NEW - Server-side calculations)
- `POST /api/skus/calculate` - Calculate SKU price (quantity × unit price)
- `PUT /api/skus/{userId}/{sku}` - Update SKU with calculated price

### 📊 Orders Calculations (NEW - Server-side calculations)
- `POST /api/orders/calculate-totals` - Calculate order totals from order items

### 📦 Stock Calculations (NEW - Server-side calculations)
- `POST /api/stock/calculate-total` - Calculate stock total value from products

## Testing APIs in Swagger UI

1. **Navigate to http://localhost:3001/docs**
2. **Find the endpoint** you want to test (grouped by tags)
3. **Click on the endpoint** to expand it
4. **Click "Try it out"** button
5. **Fill in the parameters** (path parameters, query parameters, or request body)
6. **Click "Execute"** to send the request
7. **View the response** below with status code and response body

## Example Test Cases

### Test SKU Price Calculation

**Endpoint:** `POST /api/skus/calculate`

**Request Body:**
```json
{
  "quantity": 5,
  "unitPrice": 10.5
}
```

**Expected Response:**
```json
{
  "message": "SKU price calculated successfully",
  "data": {
    "quantity": 5,
    "unitPrice": 10.5,
    "totalPrice": 52.5,
    "formattedPrice": "52.50"
  },
  "error": null,
  "statusCode": 200
}
```

### Test Order Totals Calculation

**Endpoint:** `POST /api/orders/calculate-totals`

**Request Body:**
```json
{
  "items": [
    { "price": 10, "quantity": 2 },
    { "price": 15.5, "quantity": 3 }
  ]
}
```

**Expected Response:**
```json
{
  "message": "Order totals calculated successfully",
  "data": {
    "items": [
      {
        "price": 10,
        "quantity": 2,
        "totalPrice": 20,
        "formattedTotal": "20.00"
      },
      {
        "price": 15.5,
        "quantity": 3,
        "totalPrice": 46.5,
        "formattedTotal": "46.50"
      }
    ],
    "summary": {
      "totalItems": 2,
      "grandTotal": 66.5,
      "formattedGrandTotal": "66.50"
    }
  },
  "error": null,
  "statusCode": 200
}
```

### Test Stock Total Calculation

**Endpoint:** `POST /api/stock/calculate-total`

**Request Body:**
```json
{
  "products": [
    { "price": 20, "quantity": 5 },
    { "price": 30, "quantity": 3 }
  ]
}
```

**Expected Response:**
```json
{
  "message": "Stock total calculated successfully",
  "data": {
    "products": [
      {
        "price": 20,
        "quantity": 5,
        "totalValue": 100,
        "formattedTotal": "100.00"
      },
      {
        "price": 30,
        "quantity": 3,
        "totalValue": 90,
        "formattedTotal": "90.00"
      }
    ],
    "summary": {
      "totalProducts": 2,
      "totalStockValue": 190,
      "formattedTotalValue": "190.00"
    }
  },
  "error": null,
  "statusCode": 200
}
```

## Notes

- **Calculation endpoints** (`/api/skus/calculate`, `/api/orders/calculate-totals`, `/api/stock/calculate-total`) work without Firebase and can be tested immediately
- **Product/SKU endpoints** (`/api/products/*`, `/api/skus/{userId}/{sku}`) require Firebase Admin to be configured with valid credentials
- All calculations are performed **server-side** to ensure consistency and security
- All numeric values are properly normalized and validated before calculations

## Troubleshooting

If you get 404 errors:
- Make sure the server has been restarted after adding new endpoints
- Check that you're using the correct HTTP method (GET, POST, PUT)
- Verify path parameters are correct (use actual values, not `{userId}` in the URL)

If you get 500 errors for Firebase endpoints:
- Check that Firebase Admin is properly initialized
- Verify Firebase credentials are configured
- Check server logs for detailed error messages

