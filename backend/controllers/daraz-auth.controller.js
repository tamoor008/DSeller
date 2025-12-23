const axios = require("axios");
const { APP_KEY, APP_SECRET } = require("../config/constants");
const { generateSign } = require("../utils/signature");

/**
 * Create Daraz access token
 */
async function getDarazToken(req, res, next) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    if (!APP_KEY || !APP_SECRET) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
      });
    }

    const timestamp = Date.now().toString();
    const urlPath = "/auth/token/create";
    const params = {
      app_key: APP_KEY,
      code,
      sign_method: "sha256",
      timestamp,
    };

    const sign = generateSign(urlPath, params, APP_SECRET);
    const requestPayload = { ...params, sign };

    // Step 1: Get access token
    const tokenResponse = await axios.post(
      "https://api.daraz.pk/rest/auth/token/create",
      new URLSearchParams(requestPayload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const tokenData = tokenResponse.data;

    // Check if Daraz returned an error response
    if (tokenData.code && tokenData.code !== "0" && tokenData.code !== 0) {
      return res.status(500).json({
        error: "Daraz API returned an error",
        darazError: {
          code: tokenData.code,
          type: tokenData.type,
          message: tokenData.message,
          request_id: tokenData.request_id,
          _trace_id_: tokenData._trace_id_,
        },
        details: tokenData.message || "The Daraz API returned an error response"
      });
    }

    const { access_token } = tokenData;

    if (!access_token) {
      return res.status(500).json({ 
        error: "Access token not received from Daraz",
        details: {
          responseData: tokenData,
          message: "The Daraz API response did not contain an access_token field"
        }
      });
    }

    // Step 2: Get seller/store info
    const sellerTimestamp = Date.now().toString();
    const sellerParams = {
      app_key: APP_KEY,
      access_token,
      timestamp: sellerTimestamp,
      sign_method: "sha256",
    };

    const sellerSign = generateSign("/seller/get", sellerParams, APP_SECRET);

    const sellerResponse = await axios.get("https://api.daraz.pk/rest/seller/get", {
      params: {
        ...sellerParams,
        sign: sellerSign,
      },
    });

    const sellerData = sellerResponse.data;
    const sellerId = sellerData?.data?.short_code || null;

    return res.status(200).json({
      token: tokenData,
      seller: sellerData,
      seller_id: sellerId
    });

  } catch (error) {
    console.error("Error in get-daraz-token:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to fetch token or seller data";
    error.details = error.response?.data || error.message;
    next(error);
  }
}

/**
 * Refresh Daraz access token
 */
async function refreshDarazToken(req, res, next) {
  try {
    const { refresh_token, region } = req.body;
    const timestamp = Date.now().toString();

    if (!refresh_token) {
      return res.status(400).json({ error: "Missing refresh_token" });
    }

    if (!APP_KEY || !APP_SECRET) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "APP_KEY and APP_SECRET must be configured. Please contact the administrator.",
      });
    }

    const { REGION_ENDPOINTS, DEFAULT_REGION } = require("../config/constants");
    const normalizedRegion = region?.toLowerCase().trim();
    const apiBase = normalizedRegion && REGION_ENDPOINTS[normalizedRegion]
      ? REGION_ENDPOINTS[normalizedRegion]
      : REGION_ENDPOINTS[DEFAULT_REGION];

    if (region && !apiBase) {
      return res.status(400).json({ error: "Unsupported region" });
    }

    const urlPath = "/auth/token/refresh";
    const params = {
      app_key: APP_KEY,
      refresh_token,
      sign_method: "sha256",
      timestamp,
    };

    const sign = generateSign(urlPath, params, APP_SECRET);

    const response = await axios.post(
      `${apiBase}${urlPath}`,
      new URLSearchParams({ ...params, sign }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in refresh-daraz-token:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to refresh token";
    error.details = error.response?.data || error.message;
    next(error);
  }
}

module.exports = {
  getDarazToken,
  refreshDarazToken,
};

