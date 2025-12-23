/**
 * Test endpoint - Health check
 */
function test(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`✅ [HEALTH CHECK] Test endpoint called at ${timestamp}`);
  console.log(`✅ [HEALTH CHECK] Request from: ${req.ip || req.connection.remoteAddress}`);
  
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

module.exports = {
  test,
};

