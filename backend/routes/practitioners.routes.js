const express = require("express");
const router = express.Router();
const { getPractitioners } = require("../controllers/practitioners.controller");

router.get("/get-practitioners", getPractitioners);

module.exports = router;

