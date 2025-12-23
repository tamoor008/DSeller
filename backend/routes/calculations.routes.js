const express = require("express");
const router = express.Router();
const { calculateOrdersTotals, calculateStock } = require("../controllers/calculations.controller");

router.post("/orders/calculate-totals", calculateOrdersTotals);
router.post("/stock/calculate-total", calculateStock);

module.exports = router;

