const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { PORT } = require("./config/constants");
const { initializeFirebase } = require("./config/firebase");
const swaggerDefinition = require("./swagger/swagger.config");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Import routes
const productsRoutes = require("./routes/products.routes");
const skusRoutes = require("./routes/skus.routes");
const calculationsRoutes = require("./routes/calculations.routes");
const healthRoutes = require("./routes/health.routes");
const practitionersRoutes = require("./routes/practitioners.routes");
const darazAuthRoutes = require("./routes/daraz-auth.routes");
const darazOrdersRoutes = require("./routes/daraz-orders.routes");
const darazFinanceRoutes = require("./routes/daraz-finance.routes");
const storesRoutes = require("./routes/stores.routes");
const personalInfoRoutes = require("./routes/personal-info.routes");

// Initialize Firebase
initializeFirebase();

const app = express();

// CORS and JSON parsing
app.use(cors({ origin: true }));
app.use(express.json());

// Request logging middleware - logs all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  // Get client IP from various sources
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   'unknown';
  
  // Get host header to see what the client thinks the server is
  const hostHeader = req.get('host') || 'unknown';
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);
  console.log(`📍 [REQUEST] Client IP: ${clientIP}`);
  console.log(`📍 [REQUEST] Host header: ${hostHeader}`);
  console.log(`📍 [REQUEST] User-Agent: ${req.get('user-agent') || 'N/A'}`);
  console.log(`📋 [REQUEST] Query params:`, req.query);
  console.log(`📋 [REQUEST] Body keys:`, req.body ? Object.keys(req.body) : 'none');
  console.log(`📋 [REQUEST] Params:`, req.params);
  console.log(`⏱️ [REQUEST] Request received at: ${new Date().toISOString()}`);
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`📤 [RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    console.log(`⏱️ [RESPONSE] Response sent at: ${new Date().toISOString()}`);
    if (duration > 1000) {
      console.warn(`⚠️ [PERFORMANCE] Slow request detected: ${duration}ms for ${req.method} ${req.url}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return originalSend.call(this, data);
  };
  
  next();
});

// Swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check routes
app.use("/", healthRoutes);

// API routes
app.use("/api/products", productsRoutes);
app.use("/api/skus", skusRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/personal-info", personalInfoRoutes);
app.use("/api", calculationsRoutes);
app.use("/", practitionersRoutes);
app.use("/", darazAuthRoutes);
app.use("/", darazOrdersRoutes);
app.use("/", darazFinanceRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION] Unhandled Promise Rejection:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION] Uncaught Exception:', error);
  // For critical errors, we might want to exit gracefully
  // But for API errors, we'll continue running
  if (error.code === 'EADDRINUSE') {
    console.error('Port already in use. Please use a different port.');
    process.exit(1);
  }
});

// Start server - bind to 0.0.0.0 to accept connections from local network (for iPhone testing)
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Find local IP address
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIP = addr.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`📱 API available on local network at http://${localIP}:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}/docs`);
  console.log(`🔍 Test endpoint: http://${localIP}:${PORT}/test`);
  console.log(`🏪 Stores endpoint: http://${localIP}:${PORT}/api/stores/:userId`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 [NETWORK INFO] Detected local IP: ${localIP}`);
  console.log(`🌐 [NETWORK INFO] Server bound to: 0.0.0.0:${PORT} (all interfaces)`);
  console.log(`🌐 [NETWORK INFO] Make sure mobile app uses: http://${localIP}:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⏳ Waiting for requests...\n');
  console.log(`💡 For iPhone testing, use: http://${localIP}:${PORT}\n`);
});

