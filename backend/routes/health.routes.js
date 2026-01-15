const express = require("express");
const router = express.Router();
const { test, testFirebase } = require("../controllers/health.controller");

router.get("/test", test);
router.get("/test-firebase", testFirebase);

module.exports = router;

