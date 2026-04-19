const express = require("express");
const router = express.Router();
const { getDarazProducts, getDarazProductItemDetail } = require("../controllers/daraz-products.controller");

/**
 * @swagger
 * /api/daraz-products/{userId}:
 *   get:
 *     summary: Fetch all products from all connected Daraz stores for a user
 *     tags: [Daraz Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *         description: Firebase User ID
 *     responses:
 *       200:
 *         description: List of enriched products
 *       404:
 *         description: User not found or no stores connected
 */
/**
 * @swagger
 * /api/daraz-products/{userId}/item/{itemId}:
 *   get:
 *     summary: Fetch detailed single product using Daraz /product/item/get
 *     tags: [Daraz Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *         description: Firebase User ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Daraz item ID
 *       - in: query
 *         name: sellerSku
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional seller SKU for lookup optimization
 *       - in: query
 *         name: storeName
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional store name to target a specific connected store
 *     responses:
 *       200:
 *         description: Detailed product with enriched local mapping/cost fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                       type: string
 *                     attributes:
 *                       type: object
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                     skus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           SellerSku:
 *                             type: string
 *                           price:
 *                             type: number
 *                           isMapped:
 *                             type: boolean
 *                           productId:
 *                             type: string
 *                           productQuantity:
 *                             type: string
 *                           unitPrice:
 *                             type: number
 *                           packagingPrice:
 *                             type: number
 *                           localSkuPrice:
 *                             type: number
 *                           localSkuTotalPrice:
 *                             type: number
 *       404:
 *         description: Product detail not found in connected stores
 */
router.get("/:userId/item/:itemId", getDarazProductItemDetail);
router.get("/:userId", getDarazProducts);

module.exports = router;
