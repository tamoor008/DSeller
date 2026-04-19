const express = require("express");
const router = express.Router();
const {
  getDarazReviews,
  submitSellerReply,
  submitSellerReplyBulk,
} = require("../controllers/daraz-reviews.controller");

/**
 * @swagger
 * /api/daraz-reviews/{userId}:
 *   get:
 *     summary: Get Daraz reviews for all connected stores
 *     tags: [Daraz Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *         description: Firebase user ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [delivered, shipped_back_success, canceled]
 *           default: delivered
 *         description: Order status used to build id_list (default delivered)
 *       - in: query
 *         name: created_after
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-02-01T00:00:00.000Z
 *         description: Optional order creation lower bound (ISO timestamp)
 *       - in: query
 *         name: update_after
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-02-20T00:00:00.000Z
 *         description: Optional order update lower bound (ISO timestamp). If omitted, backend defaults to history window start.
 *       - in: query
 *         name: start_time
 *         required: false
 *         schema:
 *           type: number
 *           example: 1771295853684
 *         description: History window start (ms). Auto-normalized to Daraz 7-day max and 90-day lookback.
 *       - in: query
 *         name: end_time
 *         required: false
 *         schema:
 *           type: number
 *           example: 1771900653684
 *         description: History window end (ms). Auto-normalized to Daraz 7-day max and 90-day lookback.
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get("/:userId", getDarazReviews);

/**
 * @swagger
 * /api/daraz-reviews/{userId}/reply:
 *   post:
 *     summary: Submit seller reply for a single review
 *     tags: [Daraz Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *         description: Firebase user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, sellerId, content]
 *             properties:
 *               id:
 *                 type: string
 *                 example: "11111111111"
 *               sellerId:
 *                 type: string
 *                 example: PK2NBNMLI2L
 *               content:
 *                 type: string
 *                 maxLength: 500
 *                 example: Thank you for your feedback. We appreciate your support.
 *     responses:
 *       200:
 *         description: Reply submitted
 */
router.post("/:userId/reply", submitSellerReply);

/**
 * @swagger
 * /api/daraz-reviews/{userId}/reply/bulk:
 *   post:
 *     summary: Submit seller reply for multiple reviews
 *     tags: [Daraz Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: BmrCRCzqUQO6URT9wkgO8F9mzmC3
 *         description: Firebase user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, content]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 500
 *                 example: Thank you for your review. We value your feedback.
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [id, sellerId]
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "11111111111"
 *                     sellerId:
 *                       type: string
 *                       example: PK2NBNMLI2L
 *     responses:
 *       200:
 *         description: Bulk reply processed
 */
router.post("/:userId/reply/bulk", submitSellerReplyBulk);

module.exports = router;
