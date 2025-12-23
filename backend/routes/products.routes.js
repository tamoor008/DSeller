const express = require("express");
const router = express.Router();
const { 
  getProducts, 
  getProduct, 
  createProductHandler, 
  updateProductHandler, 
  deleteProductHandler 
} = require("../controllers/products.controller");

router.get("/:userId", getProducts);
router.get("/:userId/:productId", getProduct);
router.post("/:userId", createProductHandler);
router.put("/:userId/:productId", updateProductHandler);
router.delete("/:userId/:productId", deleteProductHandler);

module.exports = router;

