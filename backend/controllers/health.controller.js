const { getFirebaseAdmin, isFirebaseInitialized } = require("../config/firebase");
const { withTimeout } = require("../utils/firebaseTimeout");

/**
 * Test endpoint - Health check
 */
function test(req, res, next) {
  const timestamp = new Date().toISOString();
  // console.log(`✅ [HEALTH CHECK] Test endpoint called at ${timestamp}`);
  // console.log(`✅ [HEALTH CHECK] Request from: ${req.ip || req.connection.remoteAddress}`);

  try {
    res.status(200).json({
      message: "API is working fine and sound!",
      timestamp: timestamp,
      status: "healthy",
      statusCode: 200
    });
  } catch (error) {
    console.error('❌ [HEALTH CHECK] Error:', error.message);
    next(error);
  }
}

/**
 * Firebase test endpoint - Verifies Firebase connection by fetching Base_URL
 */
async function testFirebase(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // console.log(`🔍 [FIREBASE TEST] Test endpoint called at ${timestamp}`);
  // console.log(`🔍 [FIREBASE TEST] Request from: ${req.ip || req.connection.remoteAddress}`);

  try {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      return res.status(500).json({
        message: "Firebase Admin not initialized",
        timestamp: timestamp,
        status: "error",
        statusCode: 500,
        error: "Firebase Admin SDK is not properly initialized. Check service account credentials."
      });
    }

    // console.log('🔄 [FIREBASE TEST] Fetching Base_URL from Firebase...');
    const admin = getFirebaseAdmin();
    const db = admin.database();
    const baseUrlRef = db.ref('Base_URL');

    const operationStartTime = Date.now();
    const snapshot = await withTimeout(
      baseUrlRef.once("value"),
      5000,
      "Firebase test - fetch Base_URL"
    );
    const operationDuration = Date.now() - operationStartTime;

    const baseUrl = snapshot.val();
    const totalDuration = Date.now() - startTime;

    // console.log(`✅ [FIREBASE TEST] Firebase operation completed in ${operationDuration}ms`);
    // console.log(`✅ [FIREBASE TEST] Total request duration: ${totalDuration}ms`);
    // console.log(`✅ [FIREBASE TEST] Base_URL value: ${baseUrl}`);

    // Also try fetching CLIENT_ID to verify multiple reads work
    const clientIdRef = db.ref('CLIENT_ID');
    const clientIdSnapshot = await withTimeout(
      clientIdRef.once("value"),
      5000,
      "Firebase test - fetch CLIENT_ID"
    );
    const clientId = clientIdSnapshot.val();

    res.status(200).json({
      message: "Firebase connection verified successfully!",
      timestamp: timestamp,
      status: "healthy",
      statusCode: 200,
      data: {
        baseUrl: baseUrl,
        clientId: clientId,
        firebaseDatabaseUrl: "https://dseller-c21ee-default-rtdb.firebaseio.com"
      },
      performance: {
        firebaseOperationDuration: `${operationDuration}ms`,
        totalRequestDuration: `${totalDuration}ms`
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [FIREBASE TEST] Error:', error.message);
    console.error('❌ [FIREBASE TEST] Duration before error:', duration, 'ms');
    console.error('❌ [FIREBASE TEST] Error stack:', error.stack);

    res.status(500).json({
      message: "Firebase test failed",
      timestamp: timestamp,
      status: "error",
      statusCode: 500,
      error: error.message,
      duration: `${duration}ms`,
      details: "This indicates Firebase credentials or network connectivity issues"
    });
  }
}

module.exports = {
  test,
  testFirebase,
};

