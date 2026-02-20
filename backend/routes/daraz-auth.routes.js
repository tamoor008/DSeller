const express = require("express");
const router = express.Router();
const { getDarazToken, refreshDarazToken } = require("../controllers/daraz-auth.controller");

router.post("/get-daraz-token", getDarazToken);
router.post("/refresh-daraz-token", refreshDarazToken); // Keep for compatibility if needed
router.post("/auth/token/refresh", refreshDarazToken); // New endpoint matching docs/mobile

module.exports = router;

