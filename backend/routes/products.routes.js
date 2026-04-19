const express = require("express");
const router = express.Router();
const { 
  getProducts, 
  getProduct, 
  createProductHandler, 
  updateProductHandler, 
  deleteProductHandler 
} = require("../controllers/products.controller");

/**
 * @swagger
 * /api/products/{userId}:
 *   get:
 *     summary: Get all local inventory products for a user (Firebase users/{userId}/products)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get("/:userId", getProducts);

/**
 * @swagger
 * /api/products/{userId}/{productId}:
 *   get:
 *     summary: Get a single local inventory product by productId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get("/:userId/:productId", getProduct);

/**
 * @swagger
 * /api/products/{userId}:
 *   post:
 *     summary: Create a local inventory product
 *     tags: [Products]
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
 *               productName: { type: string }
 *               productDescription: { type: string }
 *               quantity: { type: number }
 *               price: { type: number }
 *               unit: { type: string }
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post("/:userId", createProductHandler);

/**
 * @swagger
 * /api/products/{userId}/{productId}:
 *   put:
 *     summary: Update a local inventory product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *       - in: path
 *         name: productId
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
 *               productName: { type: string }
 *               productDescription: { type: string }
 *               quantity: { type: number }
 *               price: { type: number }
 *               unit: { type: string }
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/:userId/:productId", updateProductHandler);

/**
 * @swagger
 * /api/products/{userId}/{productId}:
 *   delete:
 *     summary: Delete a local inventory product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete("/:userId/:productId", deleteProductHandler);

module.exports = router;
