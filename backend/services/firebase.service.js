const { getFirebaseAdmin, isFirebaseInitialized } = require("../config/firebase");
const { withTimeout } = require("../utils/firebaseTimeout");

/**
 * Get all products for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Array>} - Array of products
 */
async function getUserProducts(userId) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const productsRef = db.ref(`users/${userId}/products`);
    console.log('⏱️ [FIREBASE SERVICE] getUserProducts operation started at:', new Date().toISOString());
    const operationStartTime = Date.now();

    const snapshot = await withTimeout(
      productsRef.once("value"),
      15000,
      `getUserProducts for user ${userId}`
    );

    const operationDuration = Date.now() - operationStartTime;
    console.log(`⏱️ [FIREBASE SERVICE] getUserProducts operation completed in ${operationDuration}ms`);

    const products = snapshot.val() || {};

    // Convert to array format with IDs
    return Object.entries(products).map(([id, value]) => ({
      id,
      ...value,
    }));
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to fetch products from Firebase";
    }
    throw error;
  }
}

/**
 * Get a specific product by ID
 * @param {string} userId - Firebase user ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} - Product object or null
 */
async function getProductById(userId, productId) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !productId) {
      const error = new Error("User ID and Product ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const productRef = db.ref(`users/${userId}/products/${productId}`);
    const snapshot = await productRef.once("value");
    const product = snapshot.val();

    if (!product) {
      return null;
    }

    // Normalize price to number
    return {
      id: productId,
      ...product,
      price: typeof product.price === 'string'
        ? parseFloat(product.price) || 0
        : (typeof product.price === 'number' ? product.price : 0)
    };
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to fetch product from Firebase";
    }
    throw error;
  }
}

/**
 * Update SKU in Firebase
 * @param {string} userId - Firebase user ID
 * @param {string} sku - SKU identifier
 * @param {object} updates - SKU update data
 * @returns {Promise<void>}
 */
/**
 * Update or create a single SKU in Firebase
 * Uses .update() which will create the SKU if it doesn't exist
 * 
 * @param {string} userId - Firebase user ID
 * @param {string} sku - SKU identifier
 * @param {object} updates - SKU data to update/create
 * @returns {Promise<void>}
 */
async function updateSku(userId, sku, updates) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !sku) {
      const error = new Error("User ID and SKU are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const skuRef = db.ref(`users/${userId}/skusList/${sku}`);

    // Get existing SKU to preserve price if it exists
    const existingSnapshot = await skuRef.once('value');
    const existingSku = existingSnapshot.val();

    const updateData = {
      ...updates,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    // CRITICAL: Preserve existing price if it's > 0
    if (existingSku && existingSku.price > 0 && (!updates.price || updates.price === 0)) {
      updateData.price = existingSku.price;
      console.log(`🔒 [updateSku] Preserving existing price for SKU ${sku}: ${existingSku.price}`);
    }

    // Use .update() which will create if doesn't exist, or update if it does
    await skuRef.update(updateData);

    console.log(`✅ [updateSku] SKU ${sku} updated/created in Firebase for user ${userId}`);
  } catch (error) {
    // Re-throw with status code if not already set
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to update SKU in Firebase";
    }
    throw error;
  }
}

/**
 * Create a new product
 * @param {string} userId - Firebase user ID
 * @param {object} productData - Product data
 * @returns {Promise<string>} - New product ID
 */
async function createProduct(userId, productData) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const productsRef = db.ref(`users/${userId}/products`);

    // Push new product (equivalent to Firebase push())
    const newProductRef = productsRef.push();
    const productId = newProductRef.key;

    const normalizedProduct = {
      ...productData,
      price: typeof productData.price === 'string'
        ? parseFloat(productData.price) || 0
        : (typeof productData.price === 'number' ? productData.price : 0),
      quantity: typeof productData.quantity === 'string'
        ? parseFloat(productData.quantity) || 0
        : (typeof productData.quantity === 'number' ? productData.quantity : 0),
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    await newProductRef.set(normalizedProduct);
    return productId;
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to create product";
    }
    throw error;
  }
}

/**
 * Update a product
 * @param {string} userId - Firebase user ID
 * @param {string} productId - Product ID
 * @param {object} updates - Product updates
 * @returns {Promise<void>}
 */
async function updateProduct(userId, productId, updates) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !productId) {
      const error = new Error("User ID and Product ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const productRef = db.ref(`users/${userId}/products/${productId}`);

    // Normalize price if it's being updated
    if (updates.price !== undefined) {
      updates.price = typeof updates.price === 'string'
        ? parseFloat(updates.price) || 0
        : (typeof updates.price === 'number' ? updates.price : 0);
    }

    const updateData = {
      ...updates,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    await productRef.update(updateData);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to update product";
    }
    throw error;
  }
}

/**
 * Delete a product
 * @param {string} userId - Firebase user ID
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
async function deleteProduct(userId, productId) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !productId) {
      const error = new Error("User ID and Product ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const productRef = db.ref(`users/${userId}/products/${productId}`);
    await productRef.remove();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to delete product";
    }
    throw error;
  }
}

/**
 * Get all SKUs for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Array>} - Array of SKUs
 */
async function getUserSkus(userId) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const skusRef = db.ref(`users/${userId}/skusList`);
    console.log('⏱️ [FIREBASE SERVICE] getUserSkus operation started at:', new Date().toISOString());
    const operationStartTime = Date.now();

    const snapshot = await withTimeout(
      skusRef.once("value"),
      15000,
      `getUserSkus for user ${userId}`
    );

    const operationDuration = Date.now() - operationStartTime;
    console.log(`⏱️ [FIREBASE SERVICE] getUserSkus operation completed in ${operationDuration}ms`);

    const skus = snapshot.val() || {};

    // Convert to array format
    return Object.entries(skus).map(([sku, value]) => ({
      sku,
      ...value,
    }));
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to fetch SKUs from Firebase";
    }
    throw error;
  }
}

/**
 * CRITICAL: Batch update SKUs with data loss protection
 * 
 * SAFETY FEATURES:
 * 1. NEVER overwrites existing prices > 0 with price 0
 * 2. Uses .update() instead of .set() to merge, not replace
 * 3. Fetches existing data first to preserve it
 * 4. Validates no price data loss before committing
 * 5. Aborts if price count decreases (data loss detected)
 * 
 * This function is designed to prevent the catastrophic data loss
 * that occurred when .set() was used, which replaced all SKUs.
 * 
 * @param {string} userId - Firebase user ID
 * @param {object} skusData - Object of SKU data keyed by SKU identifier
 * @throws {Error} If data loss is detected (price count decreases)
 */
async function batchUpdateSkus(userId, skusData) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const skusRef = db.ref(`users/${userId}/skusList`);

    // CRITICAL: Get existing SKUs first to preserve prices
    const existingSnapshot = await skusRef.once('value');
    const existingSkus = existingSnapshot.val() || {};

    // SAFETY CHECK: Count existing SKUs with prices > 0
    const existingSkusWithPrice = Object.values(existingSkus).filter(sku => sku && (sku.price > 0)).length;
    const newSkusWithPriceZero = Object.values(skusData).filter(sku => sku && (!sku.price || sku.price === 0)).length;

    console.log(`🔒 [batchUpdateSkus] SAFETY CHECK:`, {
      existingSkusCount: Object.keys(existingSkus).length,
      existingSkusWithPrice: existingSkusWithPrice,
      newSkusCount: Object.keys(skusData).length,
      newSkusWithPriceZero: newSkusWithPriceZero,
      warning: newSkusWithPriceZero > 0 && existingSkusWithPrice > 0 ? '⚠️ Attempting to add SKUs with price 0 - will preserve existing prices' : 'OK'
    });

    // CRITICAL PROTECTION: Never overwrite existing prices with 0
    // Merge new SKUs with existing ones, ALWAYS preserving existing prices > 0
    const mergedSkus = { ...existingSkus };
    let newSkusAdded = 0;
    let existingSkusPreserved = 0;
    let pricesProtected = 0;

    Object.keys(skusData).forEach(skuKey => {
      if (!mergedSkus[skuKey]) {
        // New SKU - add it (even if price is 0, this is OK for new SKUs)
        mergedSkus[skuKey] = skusData[skuKey];
        newSkusAdded++;
        console.log(`✅ [batchUpdateSkus] Adding NEW SKU: ${skuKey} with price: ${skusData[skuKey].price || 0}`);
      } else {
        // Existing SKU - CRITICAL: NEVER overwrite price if it's > 0
        const existingPrice = parseFloat(mergedSkus[skuKey].price) || 0;
        const newPrice = parseFloat(skusData[skuKey].price) || 0;

        if (existingPrice > 0) {
          // CRITICAL PROTECTION: Existing price > 0 - ALWAYS preserve it
          mergedSkus[skuKey] = {
            ...mergedSkus[skuKey],
            ...skusData[skuKey],
            price: existingPrice // FORCE keep existing price - never overwrite with 0
          };
          existingSkusPreserved++;
          pricesProtected++;
          console.log(`🔒 [batchUpdateSkus] PROTECTED: Preserving existing price for SKU: ${skuKey} (${existingPrice}) - ignoring new price: ${newPrice}`);
        } else if (newPrice > 0) {
          // Existing price is 0, new price > 0 - update it
          mergedSkus[skuKey] = {
            ...mergedSkus[skuKey],
            ...skusData[skuKey]
          };
          console.log(`✅ [batchUpdateSkus] Updating price for SKU: ${skuKey} from ${existingPrice} to ${newPrice}`);
        } else {
          // Both are 0 - just merge other fields, don't touch price
          mergedSkus[skuKey] = {
            ...mergedSkus[skuKey],
            ...skusData[skuKey],
            price: 0 // Explicitly keep as 0
          };
          console.log(`ℹ️ [batchUpdateSkus] Merging SKU: ${skuKey} (both prices are 0)`);
        }
      }
    });

    // FINAL SAFETY CHECK: Verify we didn't lose any prices
    const finalSkusWithPrice = Object.values(mergedSkus).filter(sku => sku && (sku.price > 0)).length;
    if (finalSkusWithPrice < existingSkusWithPrice) {
      const error = new Error(`CRITICAL: Price data loss detected! Had ${existingSkusWithPrice} SKUs with prices, now have ${finalSkusWithPrice}. Aborting update.`);
      error.statusCode = 500;
      console.error(`❌ [batchUpdateSkus] ${error.message}`);
      throw error;
    }

    // Use update() instead of set() to merge, not replace
    await skusRef.update(mergedSkus);

    console.log(`✅ [batchUpdateSkus] SAFELY updated SKUs:`, {
      newSkusAdded: newSkusAdded,
      existingSkusPreserved: existingSkusPreserved,
      pricesProtected: pricesProtected,
      totalSkusBefore: Object.keys(existingSkus).length,
      totalSkusAfter: Object.keys(mergedSkus).length,
      skusWithPriceBefore: existingSkusWithPrice,
      skusWithPriceAfter: finalSkusWithPrice,
      status: 'SUCCESS - No data loss'
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to update SKUs in Firebase";
    }
    console.error(`❌ [batchUpdateSkus] ERROR:`, error.message);
    throw error;
  }
}

/**
 * Get all stores for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Array>} - Array of stores
 */
async function getUserStores(userId) {
  console.log('🔍 [FIREBASE SERVICE] getUserStores called');
  console.log('🔍 [FIREBASE SERVICE] User ID:', userId);

  try {
    if (!isFirebaseInitialized()) {
      console.error('❌ [FIREBASE SERVICE] Firebase Admin not initialized');
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      console.error('❌ [FIREBASE SERVICE] User ID is missing');
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const firebasePath = `users/${userId}/stores`;
    console.log('📍 [FIREBASE SERVICE] Firebase path:', firebasePath);

    const storesRef = db.ref(firebasePath);
    console.log('🔄 [FIREBASE SERVICE] Fetching data from Firebase...');
    console.log('⏱️ [FIREBASE SERVICE] Operation started at:', new Date().toISOString());
    const operationStartTime = Date.now();

    const snapshot = await withTimeout(
      storesRef.once("value"),
      15000,
      `getUserStores for user ${userId}`
    );

    const operationDuration = Date.now() - operationStartTime;
    console.log(`⏱️ [FIREBASE SERVICE] Firebase operation completed in ${operationDuration}ms`);
    console.log('⏱️ [FIREBASE SERVICE] Operation completed at:', new Date().toISOString());

    const stores = snapshot.val() || {};

    console.log('✅ [FIREBASE SERVICE] Firebase data retrieved');
    console.log('📊 [FIREBASE SERVICE] Raw stores data type:', typeof stores);
    console.log('📊 [FIREBASE SERVICE] Raw stores keys count:', Object.keys(stores).length);
    console.log('📊 [FIREBASE SERVICE] Raw stores keys:', Object.keys(stores));

    // Convert to array format
    const storesArray = Object.entries(stores).map(([id, value]) => ({
      id,
      ...value,
    }));

    console.log('✅ [FIREBASE SERVICE] Stores array created');
    console.log('📊 [FIREBASE SERVICE] Stores array length:', storesArray.length);

    return storesArray;
  } catch (error) {
    console.error('❌ [FIREBASE SERVICE] Error in getUserStores');
    console.error('❌ [FIREBASE SERVICE] Error message:', error.message);
    console.error('❌ [FIREBASE SERVICE] Error code:', error.code);
    console.error('❌ [FIREBASE SERVICE] Error stack:', error.stack);

    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to fetch stores from Firebase";
    }
    throw error;
  }
}

/**
 * Add a store for a user
 * @param {string} userId - Firebase user ID
 * @param {string} storeId - Store ID
 * @param {object} storeData - Store data
 * @returns {Promise<object>} - Result with added status
 */
async function addStore(userId, storeId, storeData) {
  console.log('🔍 [FIREBASE SERVICE] addStore called');
  console.log('🔍 [FIREBASE SERVICE] User ID:', userId);
  console.log('🔍 [FIREBASE SERVICE] Store ID:', storeId);

  try {
    if (!isFirebaseInitialized()) {
      console.error('❌ [FIREBASE SERVICE] Firebase Admin not initialized');
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !storeId) {
      console.error('❌ [FIREBASE SERVICE] User ID or Store ID is missing');
      const error = new Error("User ID and Store ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const firebasePath = `users/${userId}/stores/${storeId}`;
    console.log('📍 [FIREBASE SERVICE] Firebase path:', firebasePath);

    const storeRef = db.ref(firebasePath);

    // Check if store already exists
    console.log('🔄 [FIREBASE SERVICE] Checking if store exists...');
    const snapshot = await storeRef.once("value");
    if (snapshot.exists()) {
      console.log('ℹ️ [FIREBASE SERVICE] Store already exists:', storeId);
      return { added: false, reason: 'already_exists' };
    }

    console.log('🔄 [FIREBASE SERVICE] Adding new store to Firebase...');
    await storeRef.set(storeData);
    console.log('✅ [FIREBASE SERVICE] Store added successfully:', storeId);
    return { added: true, storeId };
  } catch (error) {
    console.error('❌ [FIREBASE SERVICE] Error in addStore');
    console.error('❌ [FIREBASE SERVICE] Error message:', error.message);
    console.error('❌ [FIREBASE SERVICE] Error code:', error.code);
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to add store";
    }
    throw error;
  }
}

/**
 * Remove a store for a user
 * @param {string} userId - Firebase user ID
 * @param {string} storeId - Store ID
 * @returns {Promise<void>}
 */
async function removeStore(userId, storeId) {
  console.log('🔍 [FIREBASE SERVICE] removeStore called');
  console.log('🔍 [FIREBASE SERVICE] User ID:', userId);
  console.log('🔍 [FIREBASE SERVICE] Store ID:', storeId);

  try {
    if (!isFirebaseInitialized()) {
      console.error('❌ [FIREBASE SERVICE] Firebase Admin not initialized');
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !storeId) {
      console.error('❌ [FIREBASE SERVICE] User ID or Store ID is missing');
      const error = new Error("User ID and Store ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const firebasePath = `users/${userId}/stores/${storeId}`;
    console.log('📍 [FIREBASE SERVICE] Firebase path:', firebasePath);

    const storeRef = db.ref(firebasePath);

    // Check if store exists before removing
    console.log('🔄 [FIREBASE SERVICE] Checking if store exists...');
    const snapshot = await storeRef.once("value");
    if (!snapshot.exists()) {
      console.warn('⚠️ [FIREBASE SERVICE] Store does not exist:', storeId);
      const error = new Error("Store not found");
      error.statusCode = 404;
      throw error;
    }

    console.log('🔄 [FIREBASE SERVICE] Removing store from Firebase...');
    await storeRef.remove();
    console.log('✅ [FIREBASE SERVICE] Store removed successfully:', storeId);
  } catch (error) {
    console.error('❌ [FIREBASE SERVICE] Error in removeStore');
    console.error('❌ [FIREBASE SERVICE] Error message:', error.message);
    console.error('❌ [FIREBASE SERVICE] Error code:', error.code);
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to remove store";
    }
    throw error;
  }
}

/**
 * Set personal information for a user
 * @param {string} userId - Firebase user ID
 * @param {object} personalInfo - Personal information data
 * @returns {Promise<void>}
 */
async function setPersonalInformation(userId, personalInfo) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId) {
      const error = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    const personalInfoRef = db.ref(`users/${userId}/personalInformation`);
    await personalInfoRef.set(personalInfo);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to set personal information";
    }
    throw error;
  }
}

module.exports = {
  getUserProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSku,
  getUserSkus,
  batchUpdateSkus,
  getUserStores,
  addStore,
  removeStore,
  setPersonalInformation,
  updateStoreToken,
};

/**
 * Update store token in Firebase
 * @param {string} userId - Firebase user ID
 * @param {string} storeId - Store ID
 * @param {object} tokenData - New token data
 * @returns {Promise<void>}
 */
async function updateStoreToken(userId, storeId, tokenData) {
  try {
    if (!isFirebaseInitialized()) {
      const error = new Error("Firebase Admin not initialized");
      error.statusCode = 500;
      throw error;
    }

    if (!userId || !storeId) {
      const error = new Error("User ID and Store ID are required");
      error.statusCode = 400;
      throw error;
    }

    const admin = getFirebaseAdmin();
    const db = admin.database();
    // Path to the specific store's token data
    // Assuming structure: users/{userId}/stores/{storeId}/user/token
    const tokenRef = db.ref(`users/${userId}/stores/${storeId}/user/token`);

    await tokenRef.update(tokenData);
    console.log(`✅ [FIREBASE SERVICE] Token updated for store ${storeId}`);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to update store token";
    }
    throw error;
  }
}

