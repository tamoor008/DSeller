const express = require("express");
const router = express.Router();
const { 
  getSkus, 
  calculateSku, 
  updateSkuHandler, 
  batchUpdateSkusHandler 
} = require("../controllers/skus.controller");

/**
 * SKU Routes - All SKU operations go through backend and are saved to Firebase
 * 
 * IMPORTANT: All SKU operations (read/write) must go through these backend endpoints.
 * The backend handles all Firebase operations to ensure data integrity and prevent data loss.
 * 
 * Available endpoints:
 * - GET /api/skus/:userId - Get all SKUs for a user (reads from Firebase)
 * - PUT /api/skus/:userId/:sku - Update/create a single SKU (writes to Firebase)
 * - POST /api/skus/:userId/batch - Batch update/create multiple SKUs (writes to Firebase with data protection)
 * - POST /api/skus/calculate - Calculate SKU price (no Firebase, server-side calculation only)
 */
router.get("/:userId", getSkus);
router.post("/calculate", calculateSku);
router.put("/:userId/:sku", updateSkuHandler);
router.post("/:userId/batch", batchUpdateSkusHandler);

module.exports = router;

