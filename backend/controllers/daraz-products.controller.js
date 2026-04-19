const { makeDarazRequest } = require("../services/daraz.service");
const { getUserStores, getUserSkus, getUserProducts } = require("../services/firebase.service");
const { asyncHandler } = require("../middleware/errorHandler");

function normalizeImageList(images) {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === "string") {
        try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function enrichProductWithLocalData(product, store, skusMap, productsMap) {
    const sellerName = store.user?.seller?.data?.name || store.name || store.id || 'Unknown Store';
    const enrichedSkus = (product.skus || []).map(sku => {
        const specialPrice = parseFloat(sku.special_price);
        const regularPrice = parseFloat(sku.price) || 0;
        const isSpecialPrice = specialPrice > 0;
        const sellingPrice = isSpecialPrice ? specialPrice : regularPrice;

        const localSku = skusMap[sku.SellerSku];
        let costPrice = 0;
        let profit = 0;
        let margin = 0;
        let isMapped = false;
        let mappedProductId = '';
        let mappedProductQuantity = '';
        let mappedPackagingPrice = 0;
        let mappedPackagingPriceConfigured = false;
        let mappedUnitPrice = 0;
        let localSkuPrice = 0;
        let localSkuTotalPrice = 0;

        if (localSku && localSku.productId) {
            const localProduct = productsMap[localSku.productId];
            if (localProduct) {
                const pricePerUnit = parseFloat(localProduct.price) || 0;
                const quantityInSku = parseFloat(localSku.productQuantity) || 1;
                const packagingPrice = parseFloat(localSku.packagingPrice) || 0;

                costPrice = (pricePerUnit * quantityInSku) + packagingPrice;
                isMapped = true;
                mappedProductId = localSku.productId;
                mappedProductQuantity = localSku.productQuantity || '';
                mappedPackagingPrice = packagingPrice;
                mappedPackagingPriceConfigured = !!localSku.packagingPriceConfigured;
                mappedUnitPrice =
                    (localSku.unitPrice !== undefined && localSku.unitPrice !== null)
                        ? (parseFloat(localSku.unitPrice) || 0)
                        : pricePerUnit;
                localSkuPrice = parseFloat(localSku.price) || (pricePerUnit * quantityInSku);
                localSkuTotalPrice = (parseFloat(localSku.totalPrice) || (localSkuPrice + packagingPrice));

                // Expected Profit calculation: (Price * 0.85) - Cost
                profit = (sellingPrice * 0.85) - costPrice;
                margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
            }
        }

        return {
            ...sku,
            price: sellingPrice,
            isSpecialPrice,
            costPrice,
            profit,
            margin,
            isMapped,
            productId: mappedProductId,
            productQuantity: mappedProductQuantity,
            packagingPrice: mappedPackagingPrice,
            packagingPriceConfigured: mappedPackagingPriceConfigured,
            unitPrice: mappedUnitPrice,
            localSkuPrice,
            localSkuTotalPrice,
            storeName: sellerName
        };
    });

    return {
        ...product,
        images: normalizeImageList(product.images),
        marketImages: normalizeImageList(product.marketImages),
        skus: enrichedSkus,
        storeName: sellerName
    };
}

/**
 * Get all products from Daraz stores and enrich with profit calculations
 */
const getDarazProducts = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    if (!userId) {
        const error = new Error("Missing userId");
        error.statusCode = 400;
        throw error;
    }

    try {
        // 1. Fetch user's stores from Firebase
        const stores = await getUserStores(userId);
        const validStores = stores.filter(store => store.user && store.user.token && store.user.token.access_token);

        if (validStores.length === 0) {
            return res.status(200).json({
                message: "No connected stores with valid tokens found",
                data: [],
                count: 0,
                statusCode: 200
            });
        }

        // 2. Fetch local inventory data for profit calculation
        const [localSkus, localProducts] = await Promise.all([
            getUserSkus(userId),
            getUserProducts(userId)
        ]);

        // Create lookup maps for performance
        const skusMap = {};
        localSkus.forEach(s => {
            skusMap[s.sku] = s;
        });

        const productsMap = {};
        localProducts.forEach(p => {
            productsMap[p.id] = p;
        });

        // 3. Fetch products from each store
        const allEnrichedProducts = [];

        for (const store of validStores) {
            try {
                const accessToken = store.user.token.access_token;
                const region = store.region || 'pakistan'; // Default to pakistan if not specified

                // Call Daraz API to get products
                const darazResponse = await makeDarazRequest('GET', '/products/get', {
                    access_token: accessToken,
                    filter: 'live',
                    limit: '50' // Adjust limit as needed
                }, region);

                const darazProducts = darazResponse.data?.data?.products || [];

                // 4. Enrich Daraz products with local cost and profit data
                darazProducts.forEach(product => {
                    allEnrichedProducts.push(enrichProductWithLocalData(product, store, skusMap, productsMap));
                });
            } catch (storeError) {
                console.error(`❌ [daraz-products] Error fetching from store ${store.id}:`, storeError.message);
                // Continue to next store
            }
        }

        return res.status(200).json({
            message: "Daraz products retrieved and enriched successfully",
            data: allEnrichedProducts,
            count: allEnrichedProducts.length,
            statusCode: 200
        });

    } catch (error) {
        console.error('❌ [daraz-products] Global error:', error.message);
        next(error);
    }
});

/**
 * Get a single product details from Daraz `/product/item/get` and enrich it.
 */
const getDarazProductItemDetail = asyncHandler(async (req, res, next) => {
    const { userId, itemId } = req.params;
    const { sellerSku, storeName } = req.query;

    if (!userId || !itemId) {
        const error = new Error("Missing userId or itemId");
        error.statusCode = 400;
        throw error;
    }

    const stores = await getUserStores(userId);
    const validStores = stores.filter(store => store.user?.token?.access_token);

    if (validStores.length === 0) {
        return res.status(404).json({
            message: "No connected stores with valid tokens found",
            data: null,
            statusCode: 404
        });
    }

    const targetStoreName = (storeName || '').toString().toLowerCase().trim();
    const storesToTry = targetStoreName
        ? validStores.filter((store) => {
            const name = (store.user?.seller?.data?.name || store.name || '').toLowerCase().trim();
            return name === targetStoreName;
        })
        : validStores;

    const [localSkus, localProducts] = await Promise.all([
        getUserSkus(userId),
        getUserProducts(userId)
    ]);
    const skusMap = {};
    localSkus.forEach(s => { skusMap[s.sku] = s; });
    const productsMap = {};
    localProducts.forEach(p => { productsMap[p.id] = p; });

    let lastError = null;

    for (const store of storesToTry) {
        try {
            const accessToken = store.user.token.access_token;
            const region = store.region || 'pakistan';
            const params = {
                access_token: accessToken,
                item_id: String(itemId),
            };
            if (sellerSku) params.seller_sku = String(sellerSku);

            const response = await makeDarazRequest('GET', '/product/item/get', params, region);
            const product = response.data?.data;
            if (!product || !product.item_id) {
                continue;
            }

            const enriched = enrichProductWithLocalData(product, store, skusMap, productsMap);
            return res.status(200).json({
                message: "Daraz product detail retrieved successfully",
                data: enriched,
                statusCode: 200
            });
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        console.warn("⚠️ [daraz-products] Failed to fetch item detail from candidate stores:", lastError.message);
    }

    return res.status(404).json({
        message: "Product detail not found in connected stores",
        data: null,
        statusCode: 404
    });
});

module.exports = {
    getDarazProducts,
    getDarazProductItemDetail
};
