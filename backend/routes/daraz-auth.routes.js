const express = require("express");
const router = express.Router();
const { getDarazToken, refreshDarazToken } = require("../controllers/daraz-auth.controller");

router.post("/get-daraz-token", getDarazToken);
router.post("/refresh-daraz-token", refreshDarazToken);

module.exports = router;

