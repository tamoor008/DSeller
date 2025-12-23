const axios = require("axios");
const { APP_KEY, REGION_ENDPOINTS, DEFAULT_REGION } = require("../config/constants");
const { generateSign } = require("../utils/signature");

/**
 * Make a request to Daraz API
 * @param {string} method - HTTP method (GET, POST)
 * @param {string} path - API path (e.g., "/orders/get")
 * @param {object} params - Request parameters
 * @param {string} region - Region for API endpoint
 * @returns {Promise} - Axios response
 */
async function makeDarazRequest(method, path, params = {}, region = null) {
  const timestamp = Date.now().toString();
  const normalizedRegion = region?.toLowerCase().trim();
  const apiBase = normalizedRegion && REGION_ENDPOINTS[normalizedRegion]
    ? REGION_ENDPOINTS[normalizedRegion]
    : REGION_ENDPOINTS[DEFAULT_REGION];

  const requestParams = {
    app_key: APP_KEY,
    sign_method: "sha256",
    timestamp,
    ...params,
  };

  // Remove undefined/null values
  Object.keys(requestParams).forEach(key => {
    if (requestParams[key] === undefined || requestParams[key] === null) {
      delete requestParams[key];
    }
  });

  // Generate signature
  const sign = generateSign(path, requestParams, process.env.APP_SECRET || require("../config/constants").APP_SECRET);

  const url = `${apiBase}${path}`;
  const config = {
    params: { ...requestParams, sign },
    headers: method === 'POST' ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
  };

  if (method === 'POST') {
    return axios.post(url, new URLSearchParams(requestParams), config);
  } else {
    return axios.get(url, config);
  }
}

/**
 * Calculate order balances from transaction details
 * @param {Array} apiResponse - Array of transaction items
 * @returns {Array} - Array of order balances with total amounts
 */
function calculateOrderBalances(apiResponse) {
  const orderMap = {};

  apiResponse?.forEach(item => {
    const orderNo = item.order_no;
    if (!orderNo || !item.amount) return;

    // Clean the amount: remove commas and parse to float
    const cleanedAmount = parseFloat(item.amount.toString().replace(/,/g, ''));

    if (isNaN(cleanedAmount)) return; // skip invalid numbers

    if (!orderMap[orderNo]) {
      orderMap[orderNo] = {
        order_no: orderNo,
        total_amount: 0
      };
    }

    orderMap[orderNo].total_amount += cleanedAmount;
  });

  return Object.values(orderMap);
}

module.exports = {
  makeDarazRequest,
  calculateOrderBalances,
};

