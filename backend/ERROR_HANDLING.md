# Error Handling Documentation

## Overview

The backend has been configured with comprehensive error handling to ensure the application never crashes due to API errors. All errors are caught, logged, and returned to users with appropriate HTTP status codes and error messages.

## Error Handling Architecture

### 1. Global Error Handler Middleware

**Location:** `middleware/errorHandler.js`

The global error handler middleware catches all unhandled errors and:
- Logs the error with full details (in development)
- Returns a user-friendly error response
- Prevents the server from crashing
- Hides sensitive error details in production

```javascript
{
  error: "Internal server error",
  message: "User-friendly error message",
  statusCode: 500
}
```

### 2. Process-Level Error Handlers

**Location:** `index.js`

The application includes handlers for:
- **unhandledRejection**: Catches unhandled promise rejections
- **uncaughtException**: Catches uncaught exceptions (with graceful exit for critical errors)

### 3. Controller-Level Error Handling

All controllers:
- Use try-catch blocks
- Pass errors to the `next()` function
- Include descriptive error messages
- Set appropriate HTTP status codes

### 4. Service-Level Error Handling

All services:
- Validate inputs
- Throw errors with status codes
- Provide descriptive error messages
- Handle edge cases (NaN, Infinity, etc.)

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "statusCode": 400,
  "details": "Additional error details (optional)"
}
```

## HTTP Status Codes

- **400**: Bad Request - Invalid input or missing parameters
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server-side errors
- **503**: Service Unavailable - External service failures (if applicable)

## Error Handling Flow

```
Request → Controller → Service → [Error occurs]
                                  ↓
                            Error thrown with statusCode
                                  ↓
                            Controller catches error
                                  ↓
                            Calls next(error)
                                  ↓
                            Global Error Handler
                                  ↓
                            Logs error & returns response
                                  ↓
                            User receives error response
```

## Examples

### Validation Error (400)

```json
{
  "error": "Missing or invalid quantity",
  "message": "Quantity is required and must be a valid number",
  "statusCode": 400
}
```

### Not Found Error (404)

```json
{
  "error": "Product not found",
  "message": "Product with ID abc123 not found for user user123",
  "statusCode": 404
}
```

### Server Error (500)

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch products from Firebase",
  "statusCode": 500
}
```

### Firebase Not Initialized (500)

```json
{
  "error": "Firebase Admin not initialized",
  "message": "Please configure Firebase Admin credentials",
  "details": "Firebase Admin is not configured. Please contact the administrator.",
  "statusCode": 500
}
```

## Best Practices

1. **Always use try-catch** in async functions
2. **Pass errors to next()** in controllers instead of returning directly
3. **Set statusCode** on errors for proper HTTP responses
4. **Log errors** with context (request details, stack trace)
5. **Never expose sensitive information** in production error messages
6. **Validate inputs** early to catch errors before processing

## Testing Error Handling

To test error handling:

1. **Invalid input**: Send requests with missing or invalid parameters
2. **Firebase errors**: Disable Firebase to test initialization errors
3. **Network errors**: Simulate network failures for external API calls
4. **Validation errors**: Send invalid data types or values

All errors should return proper HTTP status codes and never crash the server.

