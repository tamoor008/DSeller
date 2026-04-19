const express = require("express");
const router = express.Router();
const { getStores, addStoreHandler, removeStoreHandler } = require("../controllers/stores.controller");

/**
 * @swagger
 * /api/stores/{userId}:
 *   get:
 *     summary: Get all stores for a user
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *     responses:
 *       200:
 *         description: List of stores
 */
router.get("/:userId", getStores);

/**
 * @swagger
 * /api/stores/{userId}:
 *   post:
 *     summary: Add a new store for a user
 *     tags: [Stores]
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
 *               id: { type: string }
 *               name: { type: string }
 *               region: { type: string }
 *     responses:
 *       201:
 *         description: Store added
 */
router.post("/:userId", addStoreHandler);

/**
 * @swagger
 * /api/stores/{userId}/{storeId}:
 *   delete:
 *     summary: Remove a store
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store removed
 */
router.delete("/:userId/:storeId", removeStoreHandler);

module.exports = router;
