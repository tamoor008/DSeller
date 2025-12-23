const { calculateSkuPrice } = require("../services/calculation.service");
const { getProductById, updateSku, getUserSkus, batchUpdateSkus } = require("../services/firebase.service");
const { isFirebaseInitialized } = require("../config/firebase");

/**
 * Get all SKUs for a user
 */
async function getSkus(req, res, next) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    const skus = await getUserSkus(userId);

    return res.status(200).json({
      message: "SKUs retrieved successfully",
      data: skus,
      count: skus.length,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch SKUs";
    next(error);
  }
}

/**
 * Calculate SKU price (quantity × unit price)
 */
function calculateSku(req, res, next) {
  try {
    const { quantity, unitPrice } = req.body;

    // Validation
    if (quantity === undefined || quantity === null || quantity === '') {
      return res.status(400).json({
        error: "Missing or invalid quantity",
        message: "Quantity is required and must be a valid number",
        statusCode: 400,
      });
    }

    if (unitPrice === undefined || unitPrice === null || unitPrice === '') {
      return res.status(400).json({
        error: "Missing or invalid unitPrice",
        message: "Unit price is required and must be a valid number",
        statusCode: 400,
      });
    }

    const result = calculateSkuPrice(quantity, unitPrice);

    return res.status(200).json({
      message: "SKU price calculated successfully",
      data: result,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error calculating SKU price:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to calculate SKU price";
    next(error);
  }
}

/**
 * Update SKU with calculated price
 */
async function updateSkuHandler(req, res, next) {
  try {
    const { userId, sku } = req.params;
    const { productId, quantity, productName } = req.body;

    if (!userId || !sku) {
      return res.status(400).json({ 
        error: "Missing userId or sku",
        message: "User ID and SKU are required",
        statusCode: 400
      });
    }

    if (!productId) {
      return res.status(400).json({ 
        error: "Missing productId",
        message: "Product ID is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        details: "Firebase Admin is not configured. Please contact the administrator.",
        statusCode: 500
      });
    }

    // Fetch product to get unit price
    const product = await getProductById(userId, productId);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        message: `Product with ID ${productId} not found for user ${userId}`,
        statusCode: 404,
      });
    }

    // Normalize quantity
    const quantityNum = parseFloat(quantity || '0') || 0;

    // Calculate total price server-side
    const calculatedPrice = quantityNum * product.price;

    // Update SKU in Firebase
    const updates = {
      price: calculatedPrice,
      productId: productId,
      productQuantity: quantityNum.toString(),
      productName: productName || product.productName || '',
      sku: sku,
    };

    await updateSku(userId, sku, updates);

    return res.status(200).json({
      message: "SKU updated successfully",
      data: {
        sku,
        ...updates,
        unitPrice: product.price,
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to update SKU";
    next(error);
  }
}

/**
 * Batch update/create SKUs
 */
async function batchUpdateSkusHandler(req, res, next) {
  try {
    const { userId } = req.params;
    const { skus } = req.body; // Object of SKU data keyed by SKU identifier

    if (!userId) {
      return res.status(400).json({ 
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!skus || typeof skus !== 'object') {
      return res.status(400).json({ 
        error: "Missing or invalid skus",
        message: "SKUs must be an object with SKU identifiers as keys",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      return res.status(500).json({ 
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    // SAFETY CHECK: Log what we're about to update
    const skusWithPriceZero = Object.values(skus).filter(sku => !sku.price || sku.price === 0).length;
    const skusWithPrice = Object.values(skus).filter(sku => sku && sku.price > 0).length;
    
    console.log(`🔒 [batchUpdateSkusHandler] SAFETY CHECK before update:`, {
      totalSkusToUpdate: Object.keys(skus).length,
      skusWithPrice: skusWithPrice,
      skusWithPriceZero: skusWithPriceZero,
      warning: skusWithPriceZero > 0 ? '⚠️ Some SKUs have price 0 - backend will preserve existing prices > 0' : 'OK'
    });

    await batchUpdateSkus(userId, skus);

    return res.status(200).json({
      message: "SKUs updated successfully (existing prices preserved)",
      data: {
        count: Object.keys(skus).length,
        note: "Existing SKUs with prices > 0 were preserved and not overwritten"
      },
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("❌ [batchUpdateSkusHandler] Error batch updating SKUs:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to update SKUs";
    next(error);
  }
}

module.exports = {
  getSkus,
  calculateSku,
  updateSkuHandler,
  batchUpdateSkusHandler,
};
