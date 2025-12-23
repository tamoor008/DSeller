const axios = require("axios");
const { APP_KEY, APP_SECRET, REGION_ENDPOINTS, DEFAULT_REGION } = require("../config/constants");
const { generateSign } = require("../utils/signature");
const { calculateOrderBalances } = require("../services/daraz.service");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * Get Daraz income details (payout status)
 * Fetches unpaid finance statements from Daraz API
 */
const getIncomeDetails = asyncHandler(async (req, res, next) => {
  const timestamp = Date.now().toString();
  const { access_token, storeName, created_after } = req.query;

  // Validation
  if (!access_token) {
    const error = new Error("Missing access_token");
    error.statusCode = 400;
    throw error;
  }

  if (!created_after) {
    const error = new Error("Missing created_after parameter. The created_after parameter is mandatory for this API endpoint");
    error.statusCode = 400;
    throw error;
  }

  if (!APP_KEY || !APP_SECRET) {
    const error = new Error("Server configuration error: APP_KEY and APP_SECRET must be configured");
    error.statusCode = 500;
    throw error;
  }

  // Decode URL-encoded date if needed
  let createdAfter = created_after;
  try {
    createdAfter = decodeURIComponent(createdAfter);
  } catch (e) {
    // Use value as-is if decoding fails
  }

  const baseUrl = REGION_ENDPOINTS[DEFAULT_REGION];
  const ordersUrlPath = "/finance/payout/status/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    created_after: createdAfter,
  };

  // Generate signature
  let orderSign;
  try {
    orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);
  } catch (error) {
    const signError = new Error(`Failed to generate request signature: ${error.message}`);
    signError.statusCode = 500;
    throw signError;
  }

  try {
    const darazApiUrl = `${baseUrl}${ordersUrlPath}`;
    
    const financeResponse = await axios.get(darazApiUrl, {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    // Check if HTTP status indicates an error
    if (financeResponse.status >= 400) {
      const apiError = new Error(`Daraz API returned an HTTP error: ${financeResponse.status}`);
      apiError.statusCode = financeResponse.status;
      apiError.details = financeResponse.data;
      throw apiError;
    }

    // Check if this is a Daraz API error response (even with 200 status)
    const responseCode = financeResponse.data.code;
    const isErrorCode = responseCode && responseCode !== "0" && responseCode !== 0;
    const hasErrorMessage = financeResponse.data.message;
    const hasErrorType = financeResponse.data.type;
    
    if (isErrorCode || hasErrorMessage || hasErrorType) {
      const apiError = new Error("Daraz API returned an error response");
      apiError.statusCode = 500;
      apiError.darazError = {
        code: financeResponse.data.code,
        type: financeResponse.data.type,
        message: financeResponse.data.message,
        request_id: financeResponse.data.request_id,
        _trace_id_: financeResponse.data._trace_id_,
      };
      throw apiError;
    }

    // Safety checks
    if (!financeResponse.data) {
      const apiError = new Error("Invalid response from Daraz API: Response data is missing");
      apiError.statusCode = 500;
      throw apiError;
    }

    if (!financeResponse.data.data) {
      const apiError = new Error("Invalid response from Daraz API: Response data.data is missing");
      apiError.statusCode = 500;
      apiError.availableKeys = Object.keys(financeResponse.data);
      throw apiError;
    }

    if (!Array.isArray(financeResponse.data.data)) {
      const apiError = new Error("Invalid response from Daraz API: Response data.data is not an array");
      apiError.statusCode = 500;
      apiError.expectedType = "array";
      apiError.actualType = typeof financeResponse.data.data;
      throw apiError;
    }

    // Filter for unpaid statements (paid === "0")
    const unpaidStatements = financeResponse.data.data
      .filter(item => item && item.paid === "0")
      .map(item => ({
        ...item,
        storeName: storeName,
      }));

    return res.status(200).json({
      financeRespone: unpaidStatements,
    });

  } catch (error) {
    // Enhance error with status code if available
    if (error.response) {
      const apiError = new Error(`Daraz API error: ${error.response.status} ${error.response.statusText}`);
      apiError.statusCode = error.response.status || 500;
      apiError.details = error.response.data;
      throw apiError;
    }
    throw error;
  }
});

/**
 * Get Daraz query income details (transaction details)
 * Fetches transaction details for specific orders
 */
const getQueryIncomeDetails = asyncHandler(async (req, res, next) => {
  const timestamp = Date.now().toString();
  const { access_token, trade_order_id, end_time, start_time, trans_type, limit, trade_order_line_id } = req.query;

  // Validation
  if (!access_token) {
    const error = new Error("Missing access_token");
    error.statusCode = 400;
    throw error;
  }

  if (!APP_KEY || !APP_SECRET) {
    const error = new Error("Server configuration error: APP_KEY and APP_SECRET must be configured");
    error.statusCode = 500;
    throw error;
  }

  const baseUrl = REGION_ENDPOINTS[DEFAULT_REGION];
  const ordersUrlPath = "/finance/transaction/details/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    start_time,
    end_time,
  };

  // Add optional parameters
  if (trans_type) {
    orderParams.trans_type = trans_type;
  }
  if (trade_order_id) {
    orderParams.trade_order_id = trade_order_id;
  }
  if (limit) {
    orderParams.limit = limit;
  }
  if (trade_order_line_id) {
    orderParams.trade_order_line_id = trade_order_line_id;
  }

  // Generate signature
  let orderSign;
  try {
    orderSign = generateSign(ordersUrlPath, orderParams, APP_SECRET);
  } catch (error) {
    const signError = new Error(`Failed to generate request signature: ${error.message}`);
    signError.statusCode = 500;
    throw signError;
  }

  try {
    const darazApiUrl = `${baseUrl}${ordersUrlPath}`;
    
    const financeResponse = await axios.get(darazApiUrl, {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const transactions = financeResponse?.data?.data || [];
    const total = calculateOrderBalances(transactions);

    return res.status(200).json({
      message: 'Transaction details retrieved successfully',
      data: {
        total: total,
        transactions: transactions,
        summary: {
          totalTransactions: transactions.length,
          totalOrders: total.length,
          totalAmount: total.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        }
      },
      error: null,
      statusCode: 200,
    });

  } catch (error) {
    // Enhance error with status code if available
    if (error.response) {
      const apiError = new Error(`Daraz API error: ${error.response.status} ${error.response.statusText}`);
      apiError.statusCode = error.response.status || 500;
      apiError.details = error.response.data;
      throw apiError;
    }
    throw error;
  }
});

module.exports = {
  getIncomeDetails,
  getQueryIncomeDetails,
};

