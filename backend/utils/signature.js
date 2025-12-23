const crypto = require("crypto");

/**
 * Generate the sign parameter for Daraz API requests
 * @param {string} url - The API endpoint path
 * @param {object} params - Request parameters
 * @param {string} appSecret - Daraz app secret
 * @returns {string} - HMAC-SHA256 signature in uppercase hex
 */
function generateSign(url, params, appSecret) {
  if (!appSecret) {
    throw new Error("APP_SECRET is required for signing requests. Please set the APP_SECRET environment variable.");
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  // Start with URL path
  let stringToSign = url;

  // Append key-value pairs in order without separators
  for (const key of sortedKeys) {
    stringToSign += key + params[key];
  }

  // Generate HMAC-SHA256 hash, then uppercase hex digest
  return crypto
    .createHmac("sha256", appSecret)
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();
}

module.exports = {
  generateSign,
};

