const axios = require("axios");
const { APP_KEY, APP_SECRET, REGION_ENDPOINTS, DEFAULT_REGION } = require("../config/constants");
const { generateSign } = require("../utils/signature");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * Get Daraz order details
 * Fetches orders from Daraz API based on status and date filters
 */
const getOrderDetails = asyncHandler(async (req, res, next) => {
  const timestamp = Date.now().toString();
  const { access_token, update_after, created_after, status } = req.query;

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
  const ordersUrlPath = "/orders/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    status,
  };

  // Add optional date filters
  if (created_after) {
    orderParams.created_after = created_after;
  }
  if (update_after) {
    orderParams.update_after = update_after;
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
    // STEP 1: Get list of orders
    const ordersResponse = await axios.get(`${baseUrl}${ordersUrlPath}`, {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const orders = ordersResponse.data.data?.orders || [];

    if (orders.length === 0) {
      return res.status(200).json({
        countTotal: 0,
        orderItems: [],
      });
    }

    const order_ids_array = orders.map(order => {
      if (!order) return null;
      return order.order_id;
    }).filter(id => id !== null);

    // STEP 2: Break into chunks of 50 and fetch items
    const chunkSize = 50;
    const orderItemsCombined = [];

    for (let i = 0; i < order_ids_array.length; i += chunkSize) {
      const chunk = order_ids_array.slice(i, i + chunkSize);
      const order_ids = `[${chunk.join(',')}]`;

      const itemsUrlPath = "/orders/items/get";
      const itemsTimestamp = Date.now().toString();
      const itemParams = {
        access_token,
        app_key: APP_KEY,
        sign_method: "sha256",
        timestamp: itemsTimestamp,
        order_ids,
      };

      let itemSign;
      try {
        itemSign = generateSign(itemsUrlPath, itemParams, APP_SECRET);
      } catch (error) {
        const signError = new Error(`Failed to generate items request signature: ${error.message}`);
        signError.statusCode = 500;
        throw signError;
      }

      const itemsResponse = await axios.get(`${baseUrl}${itemsUrlPath}`, {
        params: {
          ...itemParams,
          sign: itemSign,
        },
      });

      // Safety check: ensure data.data exists and is an array
      if (!itemsResponse.data?.data || !Array.isArray(itemsResponse.data.data)) {
        continue; // Skip this chunk and continue with next
      }

      const items = itemsResponse.data.data;

      // Safety check: filter out any null/undefined items before pushing
      const validItems = items.filter(item => item !== null && item !== undefined);
      orderItemsCombined.push(...validItems);
    }

    return res.status(200).json({
      countTotal: orders.length,
      orderItems: orderItemsCombined,
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
 * Get Daraz delivered order details
 * Fetches delivered orders with optional status filtering
 */
const getDeliveredOrderDetails = asyncHandler(async (req, res, next) => {
  const timestamp = Date.now().toString();
  const { access_token, update_after, update_before, created_after, status } = req.query;

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
  const ordersUrlPath = "/orders/get";
  const orderParams = {
    app_key: APP_KEY,
    access_token,
    sign_method: "sha256",
    timestamp,
    status,
  };

  // Add optional date filters
  if (created_after) {
    orderParams.created_after = created_after;
  }
  if (update_after) {
    orderParams.update_after = update_after;
  }
  if (update_before) {
    orderParams.update_before = update_before;
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
    // STEP 1: Get list of orders
    const ordersResponse = await axios.get(`${baseUrl}${ordersUrlPath}`, {
      params: {
        ...orderParams,
        sign: orderSign,
      },
    });

    const orders = ordersResponse.data.data?.orders || [];

    if (orders.length === 0) {
      return res.status(200).json({
        countTotal: 0,
        orderItems: [],
      });
    }

    const order_ids_array = orders.map(order => order.order_id);

    // STEP 2: Break into chunks of 50 and fetch items
    const chunkSize = 50;
    const orderItemsCombined = [];

    for (let i = 0; i < order_ids_array.length; i += chunkSize) {
      const chunk = order_ids_array.slice(i, i + chunkSize);
      const order_ids = `[${chunk.join(',')}]`;

      const itemsUrlPath = "/orders/items/get";
      const itemsTimestamp = Date.now().toString();
      const itemParams = {
        access_token,
        app_key: APP_KEY,
        sign_method: "sha256",
        timestamp: itemsTimestamp,
        order_ids,
      };

      let itemSign;
      try {
        itemSign = generateSign(itemsUrlPath, itemParams, APP_SECRET);
      } catch (error) {
        const signError = new Error(`Failed to generate items request signature: ${error.message}`);
        signError.statusCode = 500;
        throw signError;
      }

      const itemsResponse = await axios.get(`${baseUrl}${itemsUrlPath}`, {
        params: {
          ...itemParams,
          sign: itemSign,
        },
      });

      const items = itemsResponse.data?.data || [];

      // Inject access_token into each order_items array with safety checks
      const itemsWithTokenInside = items.map((order) => {
        if (!order) return null;

        // Safety check: ensure order_items exists and is an array
        if (!order.order_items || !Array.isArray(order.order_items)) {
          return {
            ...order,
            order_items: [],
          };
        }

        return {
          ...order,
          order_items: order.order_items.map(item => ({
            ...item,
            access_token,
          })),
        };
      }).filter(order => order !== null); // Remove null entries

      orderItemsCombined.push(...itemsWithTokenInside);
    }

    // Filter orders by status if provided
    const filteredOrderItems = orderItemsCombined
      .map((order) => {
        if (!order) return null;

        // Safety check: ensure order_items exists and is an array before filtering
        if (!order.order_items || !Array.isArray(order.order_items)) {
          return {
            ...order,
            order_items: [],
          };
        }

        const filteredItems = order.order_items.filter(item => {
          if (!item) return false;
          return item.status === status;
        });

        return {
          ...order,
          order_items: filteredItems,
        };
      })
      .filter(order => {
        if (!order) return false;
        // Safety check: ensure order_items exists and has length
        const hasItems = order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0;
        return hasItems;
      }); // remove empty orders

    return res.status(200).json({
      countTotal: orders.length,
      orderItems: filteredOrderItems,
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
 * Pack orders and mark as Ready to Ship (RTS)
 * First packs the orders, then automatically marks the resulting packages as RTS
 */
const packAndRtsOrders = asyncHandler(async (req, res, next) => {
  const timestamp = Date.now().toString();
  const packReq = req.body || {};
  const { access_token } = req.query;

  // Validation
  if (!access_token) {
    const error = new Error("Missing access_token");
    error.statusCode = 400;
    throw error;
  }

  if (!packReq || !Array.isArray(packReq.pack_order_list)) {
    const error = new Error("Missing or invalid pack_order_list");
    error.statusCode = 400;
    throw error;
  }

  if (!APP_KEY || !APP_SECRET) {
    const error = new Error("Server configuration error: APP_KEY and APP_SECRET must be configured");
    error.statusCode = 500;
    throw error;
  }

  const baseUrl = REGION_ENDPOINTS[DEFAULT_REGION];

  try {
    // STEP 1: Pack the orders
    const packApiPath = "/order/fulfill/pack";
    const packParams = {
      app_key: APP_KEY,
      access_token,
      sign_method: "sha256",
      timestamp,
    };

    const packParamsWithBody = {
      ...packParams,
      packReq: JSON.stringify(packReq)
    };

    let packSign;
    try {
      packSign = generateSign(packApiPath, packParamsWithBody, APP_SECRET);
    } catch (error) {
      const signError = new Error(`Failed to generate pack request signature: ${error.message}`);
      signError.statusCode = 500;
      throw signError;
    }

    const packResponse = await axios.post(
      `${baseUrl}${packApiPath}`,
      new URLSearchParams({ packReq: JSON.stringify(packReq) }),
      {
        params: { ...packParams, sign: packSign },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // STEP 2: Extract package IDs from pack response and mark as RTS
    const packageIds = [];
    if (packResponse.data && packResponse.data.result && packResponse.data.result.data) {
      const packData = packResponse.data.result.data;
      
      // Check for pack_order_list structure
      if (packData.pack_order_list && Array.isArray(packData.pack_order_list)) {
        packData.pack_order_list.forEach(order => {
          if (order.order_item_list && Array.isArray(order.order_item_list)) {
            order.order_item_list.forEach(item => {
              if (item.package_id) {
                packageIds.push(item.package_id);
              }
            });
          }
        });
      }
      
      // Also check for direct packages structure
      if (packData.packages && Array.isArray(packData.packages)) {
        packData.packages.forEach(pkg => {
          if (pkg.package_id) {
            packageIds.push(pkg.package_id);
          }
        });
      }
      
      // Also check for direct package_id in response
      if (packData.package_id) {
        packageIds.push(packData.package_id);
      }
    }

    if (packageIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Orders packed successfully, but no package IDs found for RTS",
        packResult: packResponse.data,
        rtsResult: null,
        processed_orders: 0,
        failed_orders: 0
      });
    }

    // Create RTS request
    const readyToShipReq = {
      packages: packageIds.map(packageId => ({
        package_id: packageId
      }))
    };

    // STEP 3: Mark packages as RTS
    const rtsTimestamp = Date.now().toString();
    const rtsApiPath = "/order/package/rts";
    const rtsParams = {
      app_key: APP_KEY,
      access_token,
      sign_method: "sha256",
      timestamp: rtsTimestamp,
    };

    const rtsParamsWithBody = {
      ...rtsParams,
      readyToShipReq: JSON.stringify(readyToShipReq)
    };

    let rtsSign;
    try {
      rtsSign = generateSign(rtsApiPath, rtsParamsWithBody, APP_SECRET);
    } catch (error) {
      const signError = new Error(`Failed to generate RTS request signature: ${error.message}`);
      signError.statusCode = 500;
      throw signError;
    }

    const rtsResponse = await axios.post(
      `${baseUrl}${rtsApiPath}`,
      new URLSearchParams({ readyToShipReq: JSON.stringify(readyToShipReq) }),
      {
        params: { ...rtsParams, sign: rtsSign },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Return combined result
    return res.status(200).json({
      success: true,
      message: "Orders packed and marked as RTS successfully",
      packResult: packResponse.data,
      rtsResult: rtsResponse.data,
      processed_orders: packageIds.length,
      failed_orders: 0
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
  getOrderDetails,
  getDeliveredOrderDetails,
  packAndRtsOrders,
};

