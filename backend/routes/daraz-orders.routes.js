const express = require("express");
const router = express.Router();
const { getOrderDetails, getDeliveredOrderDetails, packAndRtsOrders } = require("../controllers/daraz-orders.controller");

/**
 * @swagger
 * /get-daraz-order-details:
 *   get:
 *     summary: Get Daraz order details
 *     tags: [Daraz Orders]
 *     parameters:
 *       - in: query
 *         name: access_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Daraz access token
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: Order status (pending, ready_to_ship, shipped, etc.)
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created after this date
 *       - in: query
 *         name: update_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders updated after this date
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 countTotal:
 *                   type: number
 *                 orderItems:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request (missing access_token)
 *       500:
 *         description: Server error
 */
router.get("/get-daraz-order-details", getOrderDetails);

/**
 * @swagger
 * /get-daraz-delivered-order-details:
 *   get:
 *     summary: Get Daraz delivered order details
 *     tags: [Daraz Orders]
 *     parameters:
 *       - in: query
 *         name: access_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Daraz access token
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: Order status (delivered, shipped_back_success, etc.)
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created after this date
 *       - in: query
 *         name: update_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders updated after this date
 *       - in: query
 *         name: update_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders updated before this date
 *     responses:
 *       200:
 *         description: Delivered order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 countTotal:
 *                   type: number
 *                 orderItems:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request (missing access_token)
 *       500:
 *         description: Server error
 */
router.get("/get-daraz-delivered-order-details", getDeliveredOrderDetails);

/**
 * @swagger
 * /make-order-pack-and-rts:
 *   post:
 *     summary: Pack orders and mark as Ready to Ship (RTS)
 *     description: First packs the orders, then automatically marks the resulting packages as RTS
 *     tags: [Daraz Orders]
 *     parameters:
 *       - in: query
 *         name: access_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Daraz access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pack_order_list
 *               - delivery_type
 *               - shipment_provider_code
 *               - shipping_allocate_type
 *             properties:
 *               pack_order_list:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order_id:
 *                       type: number
 *                     order_item_list:
 *                       type: array
 *                       items:
 *                         type: number
 *               delivery_type:
 *                 type: string
 *                 example: "dropship"
 *               shipment_provider_code:
 *                 type: string
 *                 example: "FM50"
 *               shipping_allocate_type:
 *                 type: string
 *                 example: "TFS"
 *     responses:
 *       200:
 *         description: Orders packed and marked as RTS successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 packResult:
 *                   type: object
 *                 rtsResult:
 *                   type: object
 *                 processed_orders:
 *                   type: number
 *                 failed_orders:
 *                   type: number
 *       400:
 *         description: Bad request (missing access_token or invalid pack_order_list)
 *       500:
 *         description: Server error
 */
router.post("/make-order-pack-and-rts", packAndRtsOrders);

module.exports = router;

