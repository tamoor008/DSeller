const { makeDarazRequest } = require("../services/daraz.service");
const { getUserStores } = require("../services/firebase.service");
const { asyncHandler } = require("../middleware/errorHandler");

const DELIVERED_ORDERS_ENDPOINT = "/orders/get";
const ORDER_ITEMS_ENDPOINT = "/orders/items/get";
const REVIEW_HISTORY_ENDPOINT = "/review/seller/history/list";
const REVIEW_DETAIL_ENDPOINT = "/review/seller/list/v2";
const REVIEW_REPLY_ENDPOINT = "/review/seller/reply/add";
const LOG_PREFIX = "[DARAZ-REVIEWS]";
const DAY_MS = 24 * 60 * 60 * 1000;

const toArray = (value) => (Array.isArray(value) ? value : []);
const log = (...args) => console.log(LOG_PREFIX, ...args);

const resolveHistoryItemId = (item) => {
  const candidates = [
    item?.item_id,
    item?.product_id,
    item?.itemId,
    item?.productId,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return null;
};

const parseTimestampMs = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeHistoryWindow = (startTimeQuery, endTimeQuery) => {
  const now = Date.now();
  const maxLookbackStart = now - 90 * DAY_MS;
  const defaultEnd = now;
  const defaultStart = now - 30 * DAY_MS;

  let endTime = parseTimestampMs(endTimeQuery, defaultEnd);
  if (endTime > now) endTime = now;

  let startTime = parseTimestampMs(startTimeQuery, defaultStart);
  if (startTime < maxLookbackStart) startTime = maxLookbackStart;
  if (startTime > endTime) startTime = Math.max(maxLookbackStart, endTime - 7 * DAY_MS);

  if (endTime - startTime > 7 * DAY_MS) {
    startTime = endTime - 7 * DAY_MS;
  }

  return {
    startTime: Math.floor(startTime),
    endTime: Math.floor(endTime),
  };
};

const fetchDeliveredOrderIdsForStore = async ({
  accessToken,
  region,
  status = "delivered",
  createdAfter,
  updateAfter,
  storeName,
  sellerId,
}) => {
  log("fetchDeliveredOrderIds:start", {
    storeName,
    sellerId,
    region,
    status,
    hasCreatedAfter: Boolean(createdAfter),
    hasUpdateAfter: Boolean(updateAfter),
    updateAfter: updateAfter || null,
  });

  const requestParams = {
    access_token: accessToken,
    status,
    update_after: updateAfter,
  };
  if (createdAfter) requestParams.created_after = createdAfter;

  const response = await makeDarazRequest(
    "GET",
    DELIVERED_ORDERS_ENDPOINT,
    requestParams,
    region
  );

  const orderIds = Array.from(
    new Set(
      toArray(response?.data?.data?.orders)
        .map((order) => (order?.order_id ? String(order.order_id) : null))
        .filter(Boolean)
    )
  );
  log("fetchDeliveredOrderIds:done", {
    storeName,
    sellerId,
    count: orderIds.length,
  });
  return orderIds;
};

const fetchOrderItemTargetsForStore = async ({ accessToken, region, orderIds, storeName, sellerId }) => {
  const targets = new Map();
  const orderIdChunks = chunk(orderIds, 50);

  log("fetchOrderItems:start", {
    storeName,
    sellerId,
    orderIds: orderIds.length,
    chunks: orderIdChunks.length,
  });

  for (const ids of orderIdChunks) {
    const response = await makeDarazRequest(
      "GET",
      ORDER_ITEMS_ENDPOINT,
      {
        access_token: accessToken,
        order_ids: `[${ids.join(",")}]`,
      },
      region
    );

    const payload = response?.data?.data;
    const payloadArray = Array.isArray(payload) ? payload : payload ? [payload] : [];
    const sample = payloadArray[0] || null;
    const sampleOrderItems = sample ? toArray(sample.order_items) : [];
    const sampleOrderItem = sampleOrderItems[0] || null;
    log("fetchOrderItems:chunk:shape", {
      storeName,
      sellerId,
      isArray: Array.isArray(payload),
      sampleKeys: sample ? Object.keys(sample).slice(0, 10) : [],
      sampleOrderItemsCount: sampleOrderItems.length,
      sampleOrderItemKeys: sampleOrderItem ? Object.keys(sampleOrderItem).slice(0, 12) : [],
    });

    for (const entry of payloadArray) {
      const entryOrderId = entry?.order_id ? String(entry.order_id) : null;

      // Variant A: grouped response [{ order_id, order_items: [...] }]
      for (const item of toArray(entry?.order_items)) {
        const itemOrderId = item?.order_id ? String(item.order_id) : entryOrderId;
        const itemId = resolveHistoryItemId(item);
        if (!itemOrderId || !itemId) continue;
        const key = `${itemOrderId}::${itemId}`;
        if (!targets.has(key)) targets.set(key, { orderId: itemOrderId, itemId });
      }

      // Variant B: flat response [{ order_id, item_id, ... }]
      const flatItemId = resolveHistoryItemId(entry);
      if (entryOrderId && flatItemId) {
        const itemId = flatItemId;
        const key = `${entryOrderId}::${itemId}`;
        if (!targets.has(key)) targets.set(key, { orderId: entryOrderId, itemId });
      }
    }
  }

  const result = Array.from(targets.values());
  log("fetchOrderItems:done", {
    storeName,
    sellerId,
    targets: result.length,
  });
  return result;
};

const fetchReviewIdsFromHistoryForStore = async ({
  accessToken,
  region,
  storeName,
  sellerId,
  targets,
  startTime,
  endTime,
}) => {
  const ids = new Set();
  const maxCurrent = 50;

  log("fetchReviewHistory:start", {
    storeName,
    sellerId,
    targets: targets.length,
    startTime,
    endTime,
    endpoint: REVIEW_HISTORY_ENDPOINT,
  });

  for (const target of targets) {
    let current = 1;
    let totalPages = 1;

    while (current <= totalPages && current <= maxCurrent) {
      try {
        const historyParams = {
          access_token: accessToken,
          item_id: String(target.itemId),
          order_id: String(target.orderId),
          start_time: String(startTime),
          end_time: String(endTime),
          current: String(current),
        };
        log("api:history:request", {
          storeName,
          sellerId,
          endpoint: REVIEW_HISTORY_ENDPOINT,
          orderId: target.orderId,
          itemId: target.itemId,
          current,
          start_time: historyParams.start_time,
          end_time: historyParams.end_time,
        });

        const response = await makeDarazRequest(
          "GET",
          REVIEW_HISTORY_ENDPOINT,
          historyParams,
          region
        );
        const data = response?.data?.data || {};
        const idList = toArray(data?.id_list);
        const responseSuccess = response?.data?.success;
        const responseErrorCode = response?.data?.error_code;
        const responseErrorMsg = response?.data?.error_msg;

        log("api:history:response", {
          storeName,
          sellerId,
          endpoint: REVIEW_HISTORY_ENDPOINT,
          orderId: target.orderId,
          itemId: target.itemId,
          current,
          success: responseSuccess,
          error_code: responseErrorCode,
          error_msg: responseErrorMsg,
          current_page: data?.current,
          total: data?.total,
          page_size: data?.page_size,
          id_list_count: idList.length,
        });

        const pageSize = Math.max(1, Number(data?.page_size) || 10);
        const total = Math.max(0, Number(data?.total) || 0);
        totalPages = Math.max(1, Math.min(maxCurrent, Math.ceil(total / pageSize)));

        idList.forEach((id) => {
          if (id !== undefined && id !== null) ids.add(String(id));
        });
      } catch (historyError) {
        log("api:history:error", {
          storeName,
          sellerId,
          endpoint: REVIEW_HISTORY_ENDPOINT,
          orderId: target.orderId,
          itemId: target.itemId,
          current,
          message: historyError?.message,
          response: historyError?.response?.data || null,
        });
        break;
      }

      current += 1;
    }
  }

  const reviewIds = Array.from(ids);
  log("fetchReviewHistory:done", {
    storeName,
    sellerId,
    reviewIds: reviewIds.length,
  });
  return reviewIds;
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const fetchReviewDetailsByIds = async (accessToken, idList, region) => {
  const idChunks = chunk(idList, 10);
  const reviews = [];
  const outdated = [];

  log("fetchReviewDetails:start", {
    region,
    idsCount: idList.length,
    chunks: idChunks.length,
    endpoint: REVIEW_DETAIL_ENDPOINT,
  });

  for (const ids of idChunks) {
    const idListParam = `[${ids.map((id) => String(id)).join(",")}]`;
    log("api:review-list-v2:request", {
      endpoint: REVIEW_DETAIL_ENDPOINT,
      ids_count: ids.length,
      ids_preview: ids.slice(0, 3).map(String),
    });

    const response = await makeDarazRequest(
      "GET",
      REVIEW_DETAIL_ENDPOINT,
      {
        access_token: accessToken,
        id_list: idListParam,
      },
      region
    );

    const data = response?.data?.data || {};
    const reviewList = toArray(data.review_list);
    const outdatedList = toArray(data.outdated_reviews);
    log("api:review-list-v2:response", {
      endpoint: REVIEW_DETAIL_ENDPOINT,
      success: response?.data?.success,
      error_code: response?.data?.error_code,
      error_msg: response?.data?.error_msg,
      review_count: reviewList.length,
      outdated_count: outdatedList.length,
    });
    reviews.push(...reviewList);
    outdated.push(...outdatedList);
  }

  log("fetchReviewDetails:done", {
    region,
    reviews: reviews.length,
    outdated: outdated.length,
  });

  return {
    reviews,
    outdatedReviews: Array.from(new Set(outdated.map((id) => String(id)))),
  };
};

const getStoreMeta = (store) => {
  const storeName =
    store.user?.seller?.data?.name || store.name || store.id || "Unknown Store";
  const sellerId =
    store.user?.seller?.data?.short_code ||
    store.user?.seller?.data?.seller_id ||
    store.seller_id ||
    store.id ||
    null;
  const accessToken = store?.user?.token?.access_token || null;
  const region = store.region || "pakistan";

  return { storeName, sellerId: sellerId ? String(sellerId) : null, accessToken, region };
};

const findStoreForSeller = (stores, sellerId) => {
  const normalizedSellerId = sellerId ? String(sellerId) : null;

  if (normalizedSellerId) {
    return stores.find((store) => {
      const meta = getStoreMeta(store);
      return meta.sellerId === normalizedSellerId;
    }) || null;
  }

  if (stores.length === 1) return stores[0];
  return null;
};

const submitReplyForStore = async ({ accessToken, region, reviewId, content }) => {
  const response = await makeDarazRequest(
    "GET",
    REVIEW_REPLY_ENDPOINT,
    {
      access_token: accessToken,
      id: String(reviewId),
      content,
    },
    region
  );

  const payload = response?.data || {};
  const success = payload?.success === true || payload?.success === "true" || payload?.data === true || payload?.data === "true";

  return {
    success,
    raw: payload,
  };
};

const getDarazReviews = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const status = (req.query.status || "delivered").toString().trim();
  const createdAfter = req.query.created_after ? String(req.query.created_after) : undefined;
  const updateAfter = req.query.update_after ? String(req.query.update_after) : undefined;
  const { startTime, endTime } = normalizeHistoryWindow(req.query.start_time, req.query.end_time);
  const effectiveUpdateAfter = updateAfter || new Date(startTime).toISOString();

  if (!userId) {
    const error = new Error("Missing userId");
    error.statusCode = 400;
    throw error;
  }

  try {
    log("getDarazReviews:start", {
      userId,
      status,
      hasCreatedAfter: Boolean(createdAfter),
      hasUpdateAfter: Boolean(updateAfter),
      effectiveUpdateAfter,
      startTime,
      endTime,
    });

    const stores = await getUserStores(userId);
    const validStores = stores.filter(
      (store) => store?.user?.token?.access_token
    );

    log("getDarazReviews:stores", {
      totalStores: stores.length,
      validStores: validStores.length,
    });

    if (validStores.length === 0) {
      return res.status(200).json({
        message: "No connected stores with valid tokens found",
        data: [],
        count: 0,
        stores: [],
        statusCode: 200,
      });
    }

    const allReviews = [];
    const storeSummaries = [];
    const errors = [];

    for (const store of validStores) {
      const { accessToken, region, storeName, sellerId } = getStoreMeta(store);
      log("getDarazReviews:store:start", { storeName, sellerId, region, hasToken: Boolean(accessToken) });

      try {
        const orderIds = await fetchDeliveredOrderIdsForStore({
          accessToken,
          region,
          status,
          createdAfter,
          updateAfter: effectiveUpdateAfter,
          storeName,
          sellerId,
        });

        if (orderIds.length === 0) {
          log("getDarazReviews:store:noOrderIds", { storeName, sellerId });
          storeSummaries.push({
            storeName,
            sellerId,
            reviewCount: 0,
            outdatedReviews: [],
          });
          continue;
        }

        const reviewTargets = await fetchOrderItemTargetsForStore({
          accessToken,
          region,
          orderIds,
          storeName,
          sellerId,
        });

        if (reviewTargets.length === 0) {
          log("getDarazReviews:store:noTargets", { storeName, sellerId });
          storeSummaries.push({
            storeName,
            sellerId,
            reviewCount: 0,
            outdatedReviews: [],
          });
          continue;
        }

        const reviewIds = await fetchReviewIdsFromHistoryForStore({
          accessToken,
          region,
          storeName,
          sellerId,
          targets: reviewTargets,
          startTime,
          endTime,
        });

        if (reviewIds.length === 0) {
          log("getDarazReviews:store:noReviewIds", { storeName, sellerId });
          storeSummaries.push({
            storeName,
            sellerId,
            reviewCount: 0,
            outdatedReviews: [],
          });
          continue;
        }

        const { reviews, outdatedReviews } = await fetchReviewDetailsByIds(accessToken, reviewIds, region);

        const enriched = reviews.map((review) => ({
          ...review,
          storeName,
          sellerId,
        }));

        allReviews.push(...enriched);

        storeSummaries.push({
          storeName,
          sellerId,
          reviewCount: enriched.length,
          outdatedReviews,
        });
        log("getDarazReviews:store:done", {
          storeName,
          sellerId,
          orderIds: orderIds.length,
          reviewTargets: reviewTargets.length,
          reviewIds: reviewIds.length,
          reviews: enriched.length,
          outdatedReviews: outdatedReviews.length,
        });
      } catch (storeError) {
        log("getDarazReviews:store:error", {
          storeName,
          sellerId,
          message: storeError?.message,
          response: storeError?.response?.data || null,
        });
        errors.push({
          storeName,
          sellerId,
          message: storeError?.message || "Failed to fetch reviews for store",
        });
      }
    }

    allReviews.sort((a, b) => Number(b.submit_time || b.create_time || 0) - Number(a.submit_time || a.create_time || 0));
    log("getDarazReviews:done", {
      userId,
      count: allReviews.length,
      stores: storeSummaries.length,
      errors: errors.length,
    });

    return res.status(200).json({
      message: "Daraz reviews retrieved successfully",
      data: allReviews,
      count: allReviews.length,
      stores: storeSummaries,
      errors,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
});

const submitSellerReply = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { id, content, sellerId } = req.body || {};

  if (!userId) {
    const error = new Error("Missing userId");
    error.statusCode = 400;
    throw error;
  }

  if (!id) {
    const error = new Error("Missing review id");
    error.statusCode = 400;
    throw error;
  }

  const safeContent = (content || "").toString().trim();
  if (!safeContent) {
    const error = new Error("Missing reply content");
    error.statusCode = 400;
    throw error;
  }

  if (safeContent.length > 500) {
    const error = new Error("Reply content must be 500 characters or less");
    error.statusCode = 400;
    throw error;
  }

  try {
    log("submitSellerReply:start", { userId, reviewId: String(id), sellerId: sellerId ? String(sellerId) : null });
    const stores = await getUserStores(userId);
    const validStores = stores.filter((store) => store?.user?.token?.access_token);
    const targetStore = findStoreForSeller(validStores, sellerId);

    if (!targetStore) {
      const error = new Error("Could not resolve store for this reply");
      error.statusCode = 400;
      throw error;
    }

    const { accessToken, region, storeName, sellerId: resolvedSellerId } = getStoreMeta(targetStore);
    const result = await submitReplyForStore({
      accessToken,
      region,
      reviewId: id,
      content: safeContent,
    });

    return res.status(200).json({
      message: result.success ? "Reply submitted successfully" : "Reply submission returned unsuccessful status",
      success: result.success,
      data: result.raw,
      reviewId: String(id),
      sellerId: resolvedSellerId,
      storeName,
      statusCode: 200,
    });
  } catch (error) {
    log("submitSellerReply:error", {
      userId,
      reviewId: id ? String(id) : null,
      sellerId: sellerId ? String(sellerId) : null,
      message: error?.message,
      response: error?.response?.data || null,
    });
    next(error);
  }
});

const submitSellerReplyBulk = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { items = [], content } = req.body || {};

  if (!userId) {
    const error = new Error("Missing userId");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Bulk reply items are required");
    error.statusCode = 400;
    throw error;
  }

  const sharedContent = (content || "").toString().trim();

  try {
    log("submitSellerReplyBulk:start", { userId, items: items.length, hasSharedContent: Boolean(sharedContent) });
    const stores = await getUserStores(userId);
    const validStores = stores.filter((store) => store?.user?.token?.access_token);

    const results = [];

    for (const item of items) {
      const reviewId = item?.id;
      const sellerId = item?.sellerId;
      const itemContent = (item?.content || sharedContent || "").toString().trim();

      if (!reviewId || !itemContent) {
        results.push({
          id: reviewId ? String(reviewId) : null,
          sellerId: sellerId ? String(sellerId) : null,
          success: false,
          message: "Missing review id or content",
        });
        continue;
      }

      if (itemContent.length > 500) {
        results.push({
          id: String(reviewId),
          sellerId: sellerId ? String(sellerId) : null,
          success: false,
          message: "Reply content exceeds 500 characters",
        });
        continue;
      }

      const targetStore = findStoreForSeller(validStores, sellerId);
      if (!targetStore) {
        results.push({
          id: String(reviewId),
          sellerId: sellerId ? String(sellerId) : null,
          success: false,
          message: "Store not found for sellerId",
        });
        continue;
      }

      const { accessToken, region, storeName, sellerId: resolvedSellerId } = getStoreMeta(targetStore);

      try {
        const replyResult = await submitReplyForStore({
          accessToken,
          region,
          reviewId,
          content: itemContent,
        });

        results.push({
          id: String(reviewId),
          sellerId: resolvedSellerId,
          storeName,
          success: replyResult.success,
          data: replyResult.raw,
        });
        log("submitSellerReplyBulk:item", {
          reviewId: String(reviewId),
          sellerId: resolvedSellerId,
          success: replyResult.success,
        });
      } catch (error) {
        log("submitSellerReplyBulk:item:error", {
          reviewId: String(reviewId),
          sellerId: resolvedSellerId,
          message: error?.message,
          response: error?.response?.data || null,
        });
        results.push({
          id: String(reviewId),
          sellerId: resolvedSellerId,
          storeName,
          success: false,
          message: error?.message || "Reply failed",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    log("submitSellerReplyBulk:done", {
      userId,
      total: results.length,
      successCount,
      failedCount: results.length - successCount,
    });

    return res.status(200).json({
      message: `Bulk reply completed: ${successCount}/${results.length} successful`,
      success: true,
      total: results.length,
      successCount,
      failedCount: results.length - successCount,
      results,
      statusCode: 200,
    });
  } catch (error) {
    log("submitSellerReplyBulk:error", {
      userId,
      message: error?.message,
      response: error?.response?.data || null,
    });
    next(error);
  }
});

module.exports = {
  getDarazReviews,
  submitSellerReply,
  submitSellerReplyBulk,
};
