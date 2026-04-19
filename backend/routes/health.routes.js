const express = require("express");
const router = express.Router();
const { test, testFirebase } = require("../controllers/health.controller");

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/test", test);

/**
 * @swagger
 * /test-firebase:
 *   get:
 *     summary: Firebase health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Firebase connection status
 */
router.get("/test-firebase", testFirebase);

module.exports = router;

