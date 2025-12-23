const { calculateOrderTotals, calculateStockTotal } = require("../services/calculation.service");

/**
 * Calculate order totals from order items
 */
function calculateOrdersTotals(req, res, next) {
  const startTime = Date.now();
  
  console.log('📥 [BACKEND - CALCULATE ORDERS TOTALS] Request received');
  
  try {
    const { items } = req.body;
    console.log('📊 [BACKEND - CALCULATE ORDERS TOTALS] Items count:', items ? items.length : 0);

    if (!items || !Array.isArray(items)) {
      console.warn('⚠️ [BACKEND - CALCULATE ORDERS TOTALS] Invalid items array');
      return res.status(400).json({
        error: "Missing or invalid items array",
        message: "Items must be an array of order items",
        statusCode: 400,
      });
    }

    console.log('🔄 [BACKEND - CALCULATE ORDERS TOTALS] Calculating totals...');
    const result = calculateOrderTotals(items);
    
    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND - CALCULATE ORDERS TOTALS] Calculation completed');
    console.log('💰 [BACKEND - CALCULATE ORDERS TOTALS] Grand total:', result.summary?.grandTotal);
    console.log('📈 [BACKEND - CALCULATE ORDERS TOTALS] Total items:', result.summary?.totalItems);
    console.log('⏱️ [BACKEND - CALCULATE ORDERS TOTALS] Duration:', duration, 'ms');

    return res.status(200).json({
      message: "Order totals calculated successfully",
      data: result,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - CALCULATE ORDERS TOTALS] Error calculating totals');
    console.error('❌ [BACKEND - CALCULATE ORDERS TOTALS] Error message:', error.message);
    console.error('❌ [BACKEND - CALCULATE ORDERS TOTALS] Error stack:', error.stack);
    console.error('❌ [BACKEND - CALCULATE ORDERS TOTALS] Duration before error:', duration, 'ms');
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to calculate order totals";
    next(error);
  }
}

/**
 * Calculate stock total value from products
 */
function calculateStock(req, res, next) {
  const startTime = Date.now();
  
  console.log('📥 [BACKEND - CALCULATE STOCK TOTAL] Request received');
  
  try {
    const { products } = req.body;
    console.log('📊 [BACKEND - CALCULATE STOCK TOTAL] Products count:', products ? products.length : 0);

    if (!products || !Array.isArray(products)) {
      console.warn('⚠️ [BACKEND - CALCULATE STOCK TOTAL] Invalid products array');
      return res.status(400).json({
        error: "Missing or invalid products array",
        message: "Products must be an array of product objects",
        statusCode: 400,
      });
    }

    console.log('🔄 [BACKEND - CALCULATE STOCK TOTAL] Calculating totals...');
    const result = calculateStockTotal(products);
    
    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND - CALCULATE STOCK TOTAL] Calculation completed');
    console.log('💰 [BACKEND - CALCULATE STOCK TOTAL] Total stock value:', result.summary?.totalStockValue);
    console.log('📈 [BACKEND - CALCULATE STOCK TOTAL] Total products:', result.summary?.totalProducts);
    console.log('⏱️ [BACKEND - CALCULATE STOCK TOTAL] Duration:', duration, 'ms');

    return res.status(200).json({
      message: "Stock total calculated successfully",
      data: result,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - CALCULATE STOCK TOTAL] Error calculating total');
    console.error('❌ [BACKEND - CALCULATE STOCK TOTAL] Error message:', error.message);
    console.error('❌ [BACKEND - CALCULATE STOCK TOTAL] Error stack:', error.stack);
    console.error('❌ [BACKEND - CALCULATE STOCK TOTAL] Duration before error:', duration, 'ms');
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to calculate stock total";
    next(error);
  }
}

module.exports = {
  calculateOrdersTotals,
  calculateStock,
};

