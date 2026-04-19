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
/**
 * @swagger
 * /api/skus/{userId}:
 *   get:
 *     summary: Get all SKUs for a user
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *     responses:
 *       200:
 *         description: List of SKUs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sku: { type: string }
 *                       productId: { type: string }
 *                       productQuantity: { type: string }
 *                       unitPrice: { type: number }
 *                       price: { type: number, description: "Base SKU cost (quantity × unit price)" }
 *                       totalPrice: { type: number, description: "Base SKU cost + packaging price" }
 *                       packagingPrice: { type: number }
 *                       packagingPriceConfigured: { type: boolean }
 */
router.get("/:userId", getSkus);

/**
 * @swagger
 * /api/skus/calculate:
 *   post:
 *     summary: Calculate SKU price based on unit price and quantity
 *     tags: [SKUs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitPrice: { type: number }
 *               quantity: { type: string }
 *               packagingPrice: { type: string }
 *     responses:
 *       200:
 *         description: Calculated price
 */
router.post("/calculate", calculateSku);

/**
 * @swagger
 * /api/skus/{userId}/{sku}:
 *   put:
 *     summary: Update or create a single SKU mapping
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: string }
 *               productName: { type: string }
 *               packagingPrice: { type: string }
 *               unitPrice:
 *                 type: string
 *                 description: Optional custom unit price override for this SKU mapping
 *     responses:
 *       200:
 *         description: SKU updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     sku: { type: string }
 *                     productId: { type: string }
 *                     productQuantity: { type: string }
 *                     unitPrice: { type: number }
 *                     price: { type: number, description: "Base SKU cost (quantity × unit price)" }
 *                     totalPrice: { type: number, description: "Base SKU cost + packaging price" }
 *                     packagingPrice: { type: number }
 *                     packagingPriceConfigured: { type: boolean }
 */
router.put("/:userId/:sku", updateSkuHandler);

/**
 * @swagger
 * /api/skus/{userId}/batch:
 *   post:
 *     summary: Batch update multiple SKUs
 *     tags: [SKUs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skus:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Batch update results
 */
router.post("/:userId/batch", batchUpdateSkusHandler);

module.exports = router;
