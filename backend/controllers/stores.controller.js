const { getUserStores, addStore, removeStore } = require("../services/firebase.service");
const { isFirebaseInitialized } = require("../config/firebase");

/**
 * Get all stores for a user
 */
async function getStores(req, res, next) {
  const startTime = Date.now();
  const { userId } = req.params;

  // console.log('📥 [BACKEND - GET STORES] Request received');
  // console.log('📥 [BACKEND - GET STORES] User ID:', userId);
  // console.log('📥 [BACKEND - GET STORES] Request params:', req.params);
  // console.log('📥 [BACKEND - GET STORES] Request query:', req.query);

  try {
    if (!userId) {
      console.warn('⚠️ [BACKEND - GET STORES] Missing userId');
      return res.status(400).json({
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      console.error('❌ [BACKEND - GET STORES] Firebase Admin not initialized');
      return res.status(500).json({
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    // console.log('🔄 [BACKEND - GET STORES] Fetching stores from Firebase...');

    try {
      const stores = await getUserStores(userId);

      const duration = Date.now() - startTime;
      // console.log('✅ [BACKEND - GET STORES] Stores fetched successfully');
      // console.log('📊 [BACKEND - GET STORES] Stores count:', stores.length);
      // console.log('⏱️ [BACKEND - GET STORES] Duration:', duration, 'ms');

      if (stores.length > 0) {
        // console.log('📦 [BACKEND - GET STORES] Sample store:', {
        //   id: stores[0].id,
        //   hasUser: !!stores[0].user,
        //   hasToken: !!stores[0].user?.token,
        //   sellerName: stores[0].user?.seller?.data?.name || 'N/A'
        // });
      }

      return res.status(200).json({
        message: "Stores retrieved successfully",
        data: stores,
        count: stores.length,
        error: null,
        statusCode: 200,
      });
    } catch (firebaseError) {
      const duration = Date.now() - startTime;
      console.error('❌ [BACKEND - GET STORES] Firebase error:', firebaseError.message);
      console.error('❌ [BACKEND - GET STORES] Duration before error:', duration, 'ms');
      throw firebaseError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - GET STORES] Error fetching stores');
    console.error('❌ [BACKEND - GET STORES] Error message:', error.message);
    console.error('❌ [BACKEND - GET STORES] Error stack:', error.stack);
    console.error('❌ [BACKEND - GET STORES] Error code:', error.code);
    console.error('❌ [BACKEND - GET STORES] Error statusCode:', error.statusCode);
    console.error('❌ [BACKEND - GET STORES] Duration before error:', duration, 'ms');
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch stores";
    next(error);
  }
}

/**
 * Add a store for a user
 */
async function addStoreHandler(req, res, next) {
  const startTime = Date.now();
  const { userId } = req.params;
  const { storeId, storeData } = req.body;

  // console.log('📥 [BACKEND - ADD STORE] Request received');
  // console.log('📥 [BACKEND - ADD STORE] User ID:', userId);
  // console.log('📥 [BACKEND - ADD STORE] Store ID:', storeId);
  // console.log('📥 [BACKEND - ADD STORE] Store data keys:', storeData ? Object.keys(storeData) : 'N/A');

  try {
    if (!userId) {
      console.warn('⚠️ [BACKEND - ADD STORE] Missing userId');
      return res.status(400).json({
        error: "Missing userId",
        message: "User ID is required",
        statusCode: 400
      });
    }

    if (!storeId) {
      console.warn('⚠️ [BACKEND - ADD STORE] Missing storeId');
      return res.status(400).json({
        error: "Missing storeId",
        message: "Store ID is required",
        statusCode: 400
      });
    }

    if (!storeData) {
      console.warn('⚠️ [BACKEND - ADD STORE] Missing storeData');
      return res.status(400).json({
        error: "Missing storeData",
        message: "Store data is required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      console.error('❌ [BACKEND - ADD STORE] Firebase Admin not initialized');
      return res.status(500).json({
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    // console.log('🔄 [BACKEND - ADD STORE] Adding store to Firebase...');
    const result = await addStore(userId, storeId, storeData);

    const duration = Date.now() - startTime;
    // console.log('✅ [BACKEND - ADD STORE] Store operation completed');
    // console.log('📊 [BACKEND - ADD STORE] Result:', JSON.stringify(result, null, 2));
    // console.log('⏱️ [BACKEND - ADD STORE] Duration:', duration, 'ms');

    return res.status(result.added ? 201 : 200).json({
      message: result.added ? "Store added successfully" : "Store already exists",
      data: result,
      error: null,
      statusCode: result.added ? 201 : 200,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - ADD STORE] Error adding store');
    console.error('❌ [BACKEND - ADD STORE] Error message:', error.message);
    console.error('❌ [BACKEND - ADD STORE] Error stack:', error.stack);
    console.error('❌ [BACKEND - ADD STORE] Error code:', error.code);
    console.error('❌ [BACKEND - ADD STORE] Duration before error:', duration, 'ms');
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to add store";
    next(error);
  }
}

/**
 * Remove a store for a user
 */
async function removeStoreHandler(req, res, next) {
  const startTime = Date.now();
  const { userId, storeId } = req.params;

  // console.log('📥 [BACKEND - REMOVE STORE] Request received');
  // console.log('📥 [BACKEND - REMOVE STORE] User ID:', userId);
  // console.log('📥 [BACKEND - REMOVE STORE] Store ID:', storeId);
  // console.log('📥 [BACKEND - REMOVE STORE] Request params:', req.params);

  try {
    if (!userId || !storeId) {
      console.warn('⚠️ [BACKEND - REMOVE STORE] Missing userId or storeId');
      return res.status(400).json({
        error: "Missing userId or storeId",
        message: "User ID and Store ID are required",
        statusCode: 400
      });
    }

    if (!isFirebaseInitialized()) {
      console.error('❌ [BACKEND - REMOVE STORE] Firebase Admin not initialized');
      return res.status(500).json({
        error: "Firebase Admin not initialized",
        message: "Please configure Firebase Admin credentials",
        statusCode: 500
      });
    }

    // console.log('🔄 [BACKEND - REMOVE STORE] Removing store from Firebase...');
    await removeStore(userId, storeId);

    const duration = Date.now() - startTime;
    // console.log('✅ [BACKEND - REMOVE STORE] Store removed successfully');
    // console.log('⏱️ [BACKEND - REMOVE STORE] Duration:', duration, 'ms');

    return res.status(200).json({
      message: "Store removed successfully",
      data: null,
      error: null,
      statusCode: 200,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [BACKEND - REMOVE STORE] Error removing store');
    console.error('❌ [BACKEND - REMOVE STORE] Error message:', error.message);
    console.error('❌ [BACKEND - REMOVE STORE] Error stack:', error.stack);
    console.error('❌ [BACKEND - REMOVE STORE] Error code:', error.code);
    console.error('❌ [BACKEND - REMOVE STORE] Duration before error:', duration, 'ms');
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to remove store";
    next(error);
  }
}

module.exports = {
  getStores,
  addStoreHandler,
  removeStoreHandler,
};

