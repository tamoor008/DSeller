/**
 * Calculate SKU price (quantity × unit price + packaging price)
 * @param {number|string} quantity - Quantity of items
 * @param {number|string} unitPrice - Price per unit
 * @param {number|string} packagingPrice - Packaging price (optional, defaults to 0)
 * @returns {object} - Calculation result with totals
 */
function calculateSkuPrice(quantity, unitPrice, packagingPrice = 0) {
  try {
    // Parse and normalize values
    const quantityNum = parseFloat(quantity) || 0;
    let priceNum = 0;
    let packagingNum = 0;
    
    if (typeof unitPrice === 'string') {
      priceNum = parseFloat(unitPrice) || 0;
    } else if (typeof unitPrice === 'number') {
      priceNum = unitPrice;
    } else {
      priceNum = parseFloat(String(unitPrice || '0')) || 0;
    }

    if (typeof packagingPrice === 'string') {
      packagingNum = parseFloat(packagingPrice) || 0;
    } else if (typeof packagingPrice === 'number') {
      packagingNum = packagingPrice;
    } else {
      packagingNum = parseFloat(String(packagingPrice || '0')) || 0;
    }

    // Validate inputs
    if (isNaN(quantityNum)) {
      const error = new Error("Invalid quantity value");
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(priceNum)) {
      const error = new Error("Invalid unit price value");
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(packagingNum)) {
      const error = new Error("Invalid packaging price value");
      error.statusCode = 400;
      throw error;
    }

    // Calculate total price: (quantity × unit price) + packaging price
    const productTotal = quantityNum * priceNum;
    const calculatedPrice = productTotal + packagingNum;

    // Check for invalid calculations (Infinity, NaN)
    if (!isFinite(calculatedPrice)) {
      const error = new Error("Calculation resulted in invalid value");
      error.statusCode = 500;
      throw error;
    }

    return {
      quantity: quantityNum,
      unitPrice: priceNum,
      packagingPrice: packagingNum,
      productTotal: productTotal,
      totalPrice: calculatedPrice,
      formattedPrice: calculatedPrice.toFixed(2),
    };
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to calculate SKU price";
    }
    throw error;
  }
}

/**
 * Calculate order totals from order items
 * @param {Array} items - Array of order items
 * @returns {object} - Enriched items with totals and summary
 */
function calculateOrderTotals(items) {
  try {
    if (!Array.isArray(items)) {
      const error = new Error("Items must be an array");
      error.statusCode = 400;
      throw error;
    }

    let grandTotal = 0;
    
    const enrichedItems = items.map(item => {
    // Handle different price field names (price, unitPrice, etc.)
    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : item.price;
    const quantity = item.quantity || item.productQuantity || 0;

    // Normalize to numbers
    const priceNum = typeof unitPrice === 'number' 
      ? unitPrice 
      : parseFloat(unitPrice || '0') || 0;
    const qtyNum = typeof quantity === 'number' 
      ? quantity 
      : parseFloat(quantity || '0') || 0;

    // Calculate item total
    const itemTotal = priceNum * qtyNum;
    grandTotal += itemTotal;

    return {
      ...item,
      unitPrice: priceNum,
      quantity: qtyNum,
      totalPrice: itemTotal,
      formattedTotal: itemTotal.toFixed(2),
    };
  });

    // Check for invalid calculations
    if (!isFinite(grandTotal)) {
      const error = new Error("Calculation resulted in invalid total");
      error.statusCode = 500;
      throw error;
    }

    return {
      items: enrichedItems,
      summary: {
        totalItems: enrichedItems.length,
        grandTotal: grandTotal,
        formattedGrandTotal: grandTotal.toFixed(2),
      },
    };
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to calculate order totals";
    }
    throw error;
  }
}

/**
 * Calculate stock total value from products
 * @param {Array} products - Array of products
 * @returns {object} - Enriched products with totals and summary
 */
function calculateStockTotal(products) {
  try {
    if (!Array.isArray(products)) {
      const error = new Error("Products must be an array");
      error.statusCode = 400;
      throw error;
    }

    let totalStockValue = 0;
    
    const enrichedProducts = products.map(product => {
    const price = product.price || 0;
    const quantity = product.quantity || 0;

    // Normalize to numbers
    const priceNum = typeof price === 'number' 
      ? price 
      : parseFloat(price || '0') || 0;
    const qtyNum = typeof quantity === 'number' 
      ? quantity 
      : parseFloat(quantity || '0') || 0;

    // Calculate product total
    const productTotal = priceNum * qtyNum;
    totalStockValue += productTotal;

    return {
      ...product,
      price: priceNum,
      quantity: qtyNum,
      totalValue: productTotal,
      formattedTotal: productTotal.toFixed(2),
    };
  });

    // Check for invalid calculations
    if (!isFinite(totalStockValue)) {
      const error = new Error("Calculation resulted in invalid total");
      error.statusCode = 500;
      throw error;
    }

    return {
      products: enrichedProducts,
      summary: {
        totalProducts: enrichedProducts.length,
        totalStockValue: totalStockValue,
        formattedTotalValue: totalStockValue.toFixed(2),
      },
    };
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to calculate stock total";
    }
    throw error;
  }
}

module.exports = {
  calculateSkuPrice,
  calculateOrderTotals,
  calculateStockTotal,
};

