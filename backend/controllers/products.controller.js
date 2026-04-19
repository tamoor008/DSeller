const {
  getUserProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../services/firebase.service");
const { isFirebaseInitialized } = require("../config/firebase");

/**
 * Get all products for a user
 */
async function getProducts(req, res, next) {
  const startTime = Date.now();
  const { userId } = req.params;

  // console.log('📥 [BACKEND - GET PRODUCTS] Request received');
  // console.log('📥 [BACKEND - GET PRODUCTS] User ID:', userId);
  // console.log('📥 [BACKEND - GET PRODUCTS] Request URL:', req.originalUrl);
  // console.log('📥 [BACKEND - GET PRODUCTS] Request method:', req.method);
  // console.log('📥 [BACKEND - GET PRODUCTS] Request headers:', {
  //   'content-type': req.headers['content-type'],
  //   'user-agent': req.headers['user-agent'],
  //   'host': req.headers['host']
  // });

  try {
    if (!userId) {
      console.warn('⚠️ [BACKEND - GET PRODUCTS] Missing userId');
      return res.status(400).json({
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      console.error('❌ [BACKEND - GET PRODUCTS] Firebase Admin not initialized');
      return res.status(500).json({
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        details: "Firebase Admin is not configured. Please contact the administrator.",
        statusCode: 500
      });
    }

    // console.log('🔄 [BACKEND - GET PRODUCTS] Fetching products from Firebase...');
    const products = await getUserProducts(userId);

    const duration = Date.now() - startTime;
    // console.log('✅ [BACKEND - GET PRODUCTS] Products fetched successfully');
    // console.log('📊 [BACKEND - GET PRODUCTS] Products count:', products.length);
    // console.log('⏱️ [BACKEND - GET PRODUCTS] Duration:', duration, 'ms');

    if (products.length > 0) {
      // console.log('📦 [BACKEND - GET PRODUCTS] Sample products (first 3):', 
      //   products.slice(0, 3).map(p => ({ id: p.id, productName: p.productName, price: p.price, quantity: p.quantity }))
      // );
    }

    return res.status(200).json({
      message: "Products retrieved successfully",
      data: products,
      count: products.length,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - GET PRODUCTS] Error fetching products');
    console.error('❌ [BACKEND - GET PRODUCTS] Error message:', error.message);
    console.error('❌ [BACKEND - GET PRODUCTS] Error stack:', error.stack);
    console.error('❌ [BACKEND - GET PRODUCTS] Duration before error:', duration, 'ms');
    console.error('❌ [BACKEND - GET PRODUCTS] User ID was:', userId);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch products";
    next(error);
  }
}

/**
 * Get a specific product by ID
 */
async function getProduct(req, res, next) {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      return res.status(400).json({
        error: "Missing userId or productId",
        message: "User ID and Product ID are required",
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

    const product = await getProductById(userId, productId);

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        message: `Product with ID ${productId} not found for user ${userId}`,
        statusCode: 404,
      });
    }

    return res.status(200).json({
      message: "Product retrieved successfully",
      data: product,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch product";
    next(error);
  }
}

/**
 * Create a new product
 */
async function createProductHandler(req, res, next) {
  try {
    const { userId } = req.params;
    const { productName, productDescription, quantity, price, unit } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!productName) {
      return res.status(400).json({
        error: "Missing productName",
        message: "Product name is required",
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

    const productData = {
      productName,
      productDescription: productDescription || '',
      quantity: quantity || 0,
      price: price || 0,
      unit: unit || '',
    };

    const productId = await createProduct(userId, productData);

    return res.status(201).json({
      message: "Product created successfully",
      data: {
        id: productId,
        ...productData,
      },
      error: null,
      statusCode: 201,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to create product";
    next(error);
  }
}

/**
 * Update a product
 */
async function updateProductHandler(req, res, next) {
  try {
    const { userId, productId } = req.params;
    const updates = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        error: "Missing userId or productId",
        message: "User ID and Product ID are required",
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

    await updateProduct(userId, productId, updates);

    // Fetch updated product to return
    const updatedProduct = await getProductById(userId, productId);

    return res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to update product";
    next(error);
  }
}

/**
 * Delete a product
 */
async function deleteProductHandler(req, res, next) {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      return res.status(400).json({
        error: "Missing userId or productId",
        message: "User ID and Product ID are required",
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

    await deleteProduct(userId, productId);

    return res.status(200).json({
      message: "Product deleted successfully",
      data: null,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to delete product";
    next(error);
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
};
