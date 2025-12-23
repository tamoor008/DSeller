/**
 * Global error handling middleware
 * Catches all errors and prevents the app from crashing
 */
function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString();
  console.error(`❌ [ERROR HANDLER] [${timestamp}] Unhandled error`);
  console.error("❌ [ERROR HANDLER] Error details:", {
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });
  console.error("❌ [ERROR HANDLER] Stack trace:", err.stack);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Default error response
  const errorResponse = {
    error: "Internal server error",
    message: isDevelopment ? err.message : "An unexpected error occurred",
    statusCode: err.statusCode || 500,
  };

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Add details if available
  if (err.details) {
    errorResponse.details = err.details;
  }

  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  res.status(errorResponse.statusCode).json(errorResponse);
}

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};

