const express = require("express");
const router = express.Router();
const { getIncomeDetails, getQueryIncomeDetails } = require("../controllers/daraz-finance.controller");

/**
 * @swagger
 * /get-daraz-income-details:
 *   get:
 *     summary: Get Daraz income details (payout status)
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: access_token
 *         required: true
 *         schema:
 *           type: string
 *           example: daraz_access_token_here
 *         description: Daraz access token
 *       - in: query
 *         name: created_after
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-02-01T00:00:00.000Z
 *         description: Filter statements created after this date (mandatory)
 *       - in: query
 *         name: storeName
 *         schema:
 *           type: string
 *           example: Tech Hunts
 *         description: Store name to attach to response
 *     responses:
 *       200:
 *         description: Income details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 financeRespone:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request (missing parameters)
 *       500:
 *         description: Server error
 */
router.get("/get-daraz-income-details", getIncomeDetails);

/**
 * @swagger
 * /get-daraz-query-income-details:
 *   get:
 *     summary: Get Daraz query income details (transaction details)
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: access_token
 *         required: true
 *         schema:
 *           type: string
 *           example: daraz_access_token_here
 *         description: Daraz access token
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-02-01T00:00:00.000Z
 *         description: Start time for transaction query
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-02-24T00:00:00.000Z
 *         description: End time for transaction query
 *       - in: query
 *         name: trade_order_id
 *         schema:
 *           type: string
 *           example: 123456789012345
 *         description: Trade order ID
 *       - in: query
 *         name: trade_order_line_id
 *         schema:
 *           type: string
 *           example: 1234567890123456789
 *         description: Trade order line ID
 *       - in: query
 *         name: trans_type
 *         schema:
 *           type: string
 *           enum: [all, payout, charge, refund]
 *           default: all
 *         description: Transaction type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           example: 100
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
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
 *                     total:
 *                       type: array
 *                     transactions:
 *                       type: array
 *                     summary:
 *                       type: object
 *       400:
 *         description: Bad request (missing access_token)
 *       500:
 *         description: Server error
 */
router.get("/get-daraz-query-income-details", getQueryIncomeDetails);

module.exports = router;
