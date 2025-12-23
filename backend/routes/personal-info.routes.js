const express = require("express");
const router = express.Router();
const { setPersonalInfo } = require("../controllers/personal-info.controller");

router.put("/:userId", setPersonalInfo);
router.post("/:userId", setPersonalInfo); // Support both PUT and POST

module.exports = router;

