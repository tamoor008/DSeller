const express = require("express");
const router = express.Router();
const { getStores, addStoreHandler, removeStoreHandler } = require("../controllers/stores.controller");

router.get("/:userId", getStores);
router.post("/:userId", addStoreHandler);
router.delete("/:userId/:storeId", removeStoreHandler);

module.exports = router;

