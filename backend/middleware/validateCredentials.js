const { APP_KEY, APP_SECRET } = require("../config/constants");

/**
 * Middleware to validate API credentials
 */
function validateCredentials(req, res, next) {
  if (!APP_KEY || !APP_SECRET) {
    return res.status(500).json({
      error: "Server configuration error",
      message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
    });
  }
  next();
}

module.exports = {
  validateCredentials,
};

