const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { PORT } = require("./config/constants");
const { initializeFirebase } = require("./config/firebase");
const swaggerDefinition = require("./swagger/swagger.config");

// Import routes
const productsRoutes = require("./routes/products.routes");
const skusRoutes = require("./routes/skus.routes");
const calculationsRoutes = require("./routes/calculations.routes");
const healthRoutes = require("./routes/health.routes");
const practitionersRoutes = require("./routes/practitioners.routes");

// Initialize Firebase
initializeFirebase();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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
app.use("/api", calculationsRoutes);
app.use("/", practitionersRoutes);

// TODO: Import and mount Daraz routes when controllers are extracted
// app.use("/", darazAuthRoutes);
// app.use("/", darazOrdersRoutes);
// app.use("/", darazFinanceRoutes);

// Start server
app.listen(PORT, () => {
  // console.log(`🚀 Backend server is running on port ${PORT}`);
  // console.log(`📡 API available at http://localhost:${PORT}`);
  // console.log(`📚 API docs available at http://localhost:${PORT}/docs`);
});

