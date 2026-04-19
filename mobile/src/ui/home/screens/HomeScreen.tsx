import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import HomeHeader from '../components/HomeHeader';
import SelectStore from '../../components/SelectStore';
import IndividualValueComp from '../../components/IndividualValueComp';
import { AppStrings } from '../../../constants/AppStrings';
import { AppScreens } from '../../../constants/AppScreens';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../../../../firebase';
import IndividualDataComp from '../../components/IndividualDataComp';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import { getDarazDeliveredOrders, getDarazFailedOrders } from '../../../utils/api/getDarazDeliveredOrders';
import { setTodayDeliveredOrders } from '../../../redux/AppReducer';
import { getBaseUrl } from '../../../utils/api/baseUrl';
import { refreshStoreToken, refreshStoreTokenWithRefreshToken, checkResponseForTokenExpiration } from '../../../utils/api/tokenRefresh';
import { fetchWithTimeout } from '../../../utils/api/fetchWithTimeout';


const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl();
    const reviewsDebug = (...args: any[]) => {
        if (__DEV__) {
            console.log('[HOME_REVIEWS]', ...args);
        }
    };


    const navigateDaraz = () => {
        navigation.navigate(AppScreens.DarazScreen)
    }
    const navigateStock = () => {
        navigation.navigate(AppScreens.StockScreen)
    }
    const navigateSettings = () => {
        navigation.navigate(AppScreens.Settings)
    }

    const dispatch = useDispatch()
    const [reloadScreen, setReloadScreen] = useState(false)
    const currentUser = auth.currentUser
    const selector = useSelector((state: any) => state.AppReducer);
    const store = selector?.selectedStore;
    // But 'refreshStoreToken' usually needs 'store' slice (access_tokens). 
    // Let's check where 'store' is used. It's passed to 'getDarazDeliveredOrders'.
    // In PendingOrders, store was state.store. Here selector is state.AppReducer.
    // I suspect 'store' variable used in getDarazDeliveredOrders calls is actually the store OBJECT passed as argument?
    // Wait, line 884: const getDarazDeliveredOrders = async (..., store) => { ... }
    // So 'store' is an ARGUMENT there.
    // BUT lint says "Cannot find name 'store'" at line 902 inside that function.
    // If it's an argument, it should be found.
    // Line 884 in original file might have been: const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, store)
    // My replacement chunk above changes it to 'store_data' to avoid confusion, but I should check usage.

    // Actually, let's look at the lint error locations.
    // Line 902: store.shop_sku
    // If 'store' is argument, it's fine.
    // Lint said: Parameter 'store' implicitly has an 'any' type.
    // AND "Cannot find name 'store'"?
    // Maybe I have a conflicting variable name or scope issue?

    // Be careful.
    // In snippet 870-900:
    // const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, store) => { 
    // is defined inside the component? YES.
    // But I saw "Cannot redeclare block-scoped variable" for states inside it?
    // No, states were defined BEFORE it (lines 877-880).

    // I will remove the states.
    // And for getDarazDeliveredOrders, 'store' is an argument. 
    // The lint "Cannot find name 'store'" might be elsewhere?
    // Line 902.
    // If getDarazDeliveredOrders is defined at 884, then 902 is inside it.
    // So 'store' argument should be visible.

    // Maybe the 'store' argument was missing in the function signature in the file?
    // Snippet 870-900 shows:
    // const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, store) => {
    // So it IS there.

    // Why did lint say "Cannot find name 'store'" at 902?
    // Maybe I misread the line number or the file content shifted?
    // Or maybe 'store' refers to something else?

    // I previously saw:
    // 902: Cannot find name 'store'. Did you mean 'Storage'?

    // Let's assume removing the duplicate states at 877 is the main fix.
    // And I will see if 'store' error persists.

    const [shippedOrder, setShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])
    const [failedDeliveries, setFailedDeliveries] = useState([])
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [firebaseSkus, setFirebaseSkus] = useState([])
    const [darazLoader, setDarazLoader] = useState(false)
    const [allOrdersTotal, setAllOrdersTotal] = useState(0)
    const [firebaseDataLoaded, setfirebaseDataLoaded] = useState(false)
    const [screenloader, setScreenloader] = useState(false)

    const [failedOrders, setFailedOrders] = useState<any[]>([])
    const [status, setStatus] = useState(false)
    const [skuList, setSkuList] = useState<any[]>([])
    const [totalStockValue, setTotalStockValue] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
    const [darazPendingOrders, setDarazPendingOrders] = useState<any[]>([])
    const [darazReadyToShipOrders, setDarazReadyToShipOrders] = useState<any[]>([])
    const [darazShippedOrders, setDarazShippedOrders] = useState<any[]>([])
    const [darazDeliveredOrders, setDarazDeliveredOrders] = useState<any[]>([])
    const [darazFailedOrders, setDarazFailedOrders] = useState<any[]>([])
    const [darazCancelledOrders, setDarazCancelledOrders] = useState<any[]>([])
    const [darazReturnedOrders, setDarazReturnedOrders] = useState<any[]>([])
    const [darazPendingOrdersCount, setDarazPendingOrdersCount] = useState(0)
    const [darazReadyToShipOrdersCount, setDarazReadyToShipOrdersCount] = useState(0)
    const [darazShippedOrdersCount, setDarazShippedOrdersCount] = useState(0)
    const [darazDeliveredOrdersCount, setDarazDeliveredOrdersCount] = useState(0)
    const [darazFailedOrdersCount, setDarazFailedOrdersCount] = useState(0)
    const [darazCancelledOrdersCount, setDarazCancelledOrdersCount] = useState(0)
    const [darazReturnedOrdersCount, setDarazReturnedOrdersCount] = useState(0)
    const [reviewsCount, setReviewsCount] = useState(0)
    const [reviewsLoader, setReviewsLoader] = useState(false)

    const [pendingOrders, setPendingOrders] = useState<any[]>([])
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
    const [readyToShipOrders, setReadyToShipOrders] = useState<any[]>([])
    const [readyToShipOrdersCount, setReadyToShipOrdersCount] = useState(0)

    // Use refs to prevent unnecessary API calls
    const isProcessingRef = useRef(false);
    const pendingRecalcRef = useRef(false);
    const lastProcessedDataRef = useRef<string>('');
    const darazFetchRunRef = useRef(0);
    const darazTotalRunRef = useRef(0);
    const [recalcNonce, setRecalcNonce] = useState(0);
    const normalizeSku = (sku: any) => (sku ?? '').toString().trim().toLowerCase();
    const firebaseSkusByNormalizedSku = useMemo(() => {
        const map: { [key: string]: any } = {};
        (firebaseSkus || []).forEach((item: any) => {
            const normalized = normalizeSku(item?.sku);
            if (normalized) {
                map[normalized] = item;
            }
        });
        return map;
    }, [firebaseSkus]);

    // Fetch SKUs from backend API (all SKU operations go through backend)
    useEffect(() => {
        if (!currentUser) return;

        const BASE_URL = getBaseUrl();
        // console.log('🌐 [HomeScreen] Base URL:', BASE_URL);

        const fetchSkus = async () => {
            try {
                const fetchUrl = `${BASE_URL}/api/skus/${currentUser.uid}`;
                // console.log('📤 [HomeScreen] Fetching SKUs from URL:', fetchUrl);

                const response = await fetchWithTimeout(fetchUrl, {}, 8000);

                if (!response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    let errorMessage = 'Unknown error';

                    if (contentType.includes('application/json')) {
                        const errorData = await response.json().catch(() => ({}));
                        errorMessage = errorData.error || errorData.message || 'Unknown error';
                    } else {
                        // Handle HTML or other non-JSON responses
                        const text = await response.text().catch(() => '');
                        if (text.includes('ERR_NGROK')) {
                            errorMessage = 'Ngrok rate limit reached. Please check your ngrok billing.';
                        } else if (text.includes('ngrok')) {
                            errorMessage = 'Ngrok error - response was HTML instead of JSON';
                        } else {
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        }
                    }

                    // console.warn('⚠️ [HomeScreen] Error fetching SKUs:', errorMessage);
                    // console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                    // console.warn('⚠️ [HomeScreen] Full URL was:', fetchUrl);
                    // console.warn('⚠️ [HomeScreen] Response status:', response.status, response.statusText);
                    // console.warn('⚠️ [HomeScreen] Content-Type:', contentType);
                    setFirebaseSkus([]);
                    setfirebaseDataLoaded(true);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    // console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    setFirebaseSkus([]);
                    setfirebaseDataLoaded(true);
                    return;
                }

                const skus = result.data || [];
                setFirebaseSkus(skus);
                setfirebaseDataLoaded(true);
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                // console.warn('⚠️ [HomeScreen] Error fetching SKU data:', errorMessage);
                // console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                // console.warn('⚠️ [HomeScreen] Full URL was:', `${BASE_URL}/api/skus/${currentUser.uid}`);
                // if (error?.stack) {
                //     console.warn('⚠️ [HomeScreen] Error stack:', error.stack);
                // }
                setFirebaseSkus([]);
                setfirebaseDataLoaded(true);
            }
        };

        fetchSkus();
        // Set up polling to refresh SKUs periodically (every 30 seconds)
        const intervalId = setInterval(fetchSkus, 30000);
        return () => clearInterval(intervalId);
    }, [reloadScreen, currentUser]);

    // Fetch products from backend API (all product operations go through backend)
    useEffect(() => {
        if (!currentUser) return;

        const BASE_URL = getBaseUrl();

        const fetchProducts = async () => {
            try {
                const fetchUrl = `${BASE_URL}/api/products/${currentUser.uid}`;
                // console.log('📤 [HomeScreen] Fetching products from URL:', fetchUrl);

                const response = await fetchWithTimeout(fetchUrl, {}, 8000);

                if (!response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    let errorMessage = 'Unknown error';

                    if (contentType.includes('application/json')) {
                        const errorData = await response.json().catch(() => ({}));
                        errorMessage = errorData.error || errorData.message || 'Unknown error';
                    } else {
                        // Handle HTML or other non-JSON responses
                        const text = await response.text().catch(() => '');
                        if (text.includes('ERR_NGROK')) {
                            errorMessage = 'Ngrok rate limit reached. Please check your ngrok billing.';
                        } else if (text.includes('ngrok')) {
                            errorMessage = 'Ngrok error - response was HTML instead of JSON';
                        } else {
                            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                        }
                    }

                    // console.warn('⚠️ [HomeScreen] Error fetching products:', errorMessage);
                    // console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                    // console.warn('⚠️ [HomeScreen] Full URL was:', fetchUrl);
                    // console.warn('⚠️ [HomeScreen] Response status:', response.status, response.statusText);
                    // console.warn('⚠️ [HomeScreen] Content-Type:', contentType);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    // console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    return;
                }

                const products = result.data || [];
                if (products.length === 0) {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                // console.warn('⚠️ [HomeScreen] Error fetching product data:', errorMessage);
                // console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                // console.warn('⚠️ [HomeScreen] Full URL was:', `${BASE_URL}/api/products/${currentUser.uid}`);
                // if (error?.stack) {
                //     console.warn('⚠️ [HomeScreen] Error stack:', error.stack);
                // }
                Alert.alert('Error', 'Failed to load product data. Please try again.', [{ text: 'OK' }]);
                setDarazLoader(false);
            }
        };

        fetchProducts();
    }, [reloadScreen, currentUser]);

    useEffect(() => {
        let newTokens = [];

        if (selector.selectedStore?.id) {
            // Handle both nested (user.token) and direct (token) structures
            const token = selector.selectedStore.user?.token || selector.selectedStore.token || {};
            const access_token = token.access_token;
            const refresh_token = token.refresh_token;
            const expires_in = token.expires_in;
            const refresh_expires_in = token.refresh_expires_in;
            const name = selector.selectedStore?.user?.seller?.data?.name ||
                selector.selectedStore?.user?.seller?.name;
            const seller_id = selector.selectedStore.user?.seller?.data?.short_code ||
                selector.selectedStore.user?.seller?.data?.seller_id ||
                selector.selectedStore.seller_id ||
                selector.selectedStore.id;

            // Only include if access_token exists and is not empty
            if (access_token && access_token.trim() !== '') {
                newTokens = [{
                    access_token: access_token,
                    refresh_token: refresh_token || null, // Include refresh token if available
                    expires_in: expires_in, // Access token expiration
                    refresh_expires_in: refresh_expires_in, // Refresh token expiration
                    storeName: name || null,
                    seller_id: seller_id,
                    store: selector?.selectedStore
                }];
            }
        } else {
            // Filter out stores without valid access tokens
            newTokens = Array.isArray(selector?.access_tokens)
                ? selector?.access_tokens.filter((token) =>
                    token && token.access_token && token.access_token.trim() !== ''
                )
                : [];
        }

        // Only update state if value has changed
        const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens);
        if (hasChanged) {
            setAll_access_tokens(newTokens);
        }

    }, [selector]);

    useEffect(() => {
        if (!firebaseDataLoaded || !all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchData = async () => {
            const runId = ++darazFetchRunRef.current;
            console.log(`[DARAZ_HOME][fetch:${runId}] started`, {
                firebaseDataLoaded,
                accessTokenCount: Array.isArray(all_access_tokens) ? all_access_tokens.length : (all_access_tokens ? 1 : 0),
            });
            // console.log('🏠 [HOME SCREEN] Starting to fetch orders...');
            // console.log('📊 [HOME SCREEN] Firebase data loaded:', firebaseDataLoaded);
            // console.log('🔑 [HOME SCREEN] Access tokens count:', Array.isArray(all_access_tokens) ? all_access_tokens.length : all_access_tokens ? 1 : 0);

            setFailedOrder([])
            setShippedOrder([])
            setITRSOrder([])
            setFailedOrders([])
            setDarazLoader(true)

            const createdAfter = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString();
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayISO = startOfToday.toISOString();

            // console.log('📅 [HOME SCREEN] Date filters:');
            // console.log('  - Shipped orders (7 days):', createdAfter);
            // console.log('  - Failed orders (today):', todayISO);
            // console.log('  - Today start:', startOfToday.toLocaleString());

            let requests = [];
            let todayFailedRequests: Promise<any>[] = [];

            if (Array.isArray(all_access_tokens)) {
                // Filter out invalid access tokens before making requests
                const validTokens = all_access_tokens.filter(item =>
                    item && item.access_token && item.access_token.trim() !== ''
                );
                // console.log('🔄 [HOME SCREEN] Fetching for', validTokens.length, 'stores (filtered from', all_access_tokens.length, 'total)');
                requests = validTokens.flatMap(item => [
                    getDarazOrders(item.access_token, createdAfter, 'shipped', item),
                    getDarazOrders(item.access_token, createdAfter, 'failed_delivery', item),
                    getDarazOrders(item.access_token, createdAfter, 'shipped_back', item),
                ]);
                // "Failed Orders Today" should be based on orders updated/marked today.
                todayFailedRequests = validTokens.flatMap(item => [
                    getFailedOrders(item.access_token, todayISO, 'failed_delivery', item),
                    getFailedOrders(item.access_token, todayISO, 'shipped_back', item),
                ]);
            } else if (all_access_tokens && all_access_tokens.access_token && all_access_tokens.access_token.trim() !== '') {
                // console.log('🔄 [HOME SCREEN] Fetching for single store');
                requests = [
                    getDarazOrders(all_access_tokens.access_token, createdAfter, 'shipped', all_access_tokens),
                    getDarazOrders(all_access_tokens.access_token, createdAfter, 'failed_delivery', all_access_tokens),
                    getDarazOrders(all_access_tokens.access_token, createdAfter, 'shipped_back', all_access_tokens),
                ];
                todayFailedRequests = [
                    getFailedOrders(all_access_tokens.access_token, todayISO, 'failed_delivery', all_access_tokens),
                    getFailedOrders(all_access_tokens.access_token, todayISO, 'shipped_back', all_access_tokens),
                ];
            } else {
                // console.log('⚠️ [HOME SCREEN] No valid access tokens available');
            }

            try {
                const results = await Promise.all(requests);
                const todayFailedResults = await Promise.all(todayFailedRequests);
                const allShippedSkus: any[] = [];
                const allFailedSkus: any[] = [];
                const allITRSSkus: any[] = [];

                results.forEach((result: any) => {
                    if (!result) return;
                    if (result.status === 'shipped') {
                        allShippedSkus.push(...(result.skus || []));
                    } else if (result.status === 'shipped_back') {
                        allFailedSkus.push(...(result.skus || []));
                    } else if (result.status === 'failed_delivery') {
                        allITRSSkus.push(...(result.skus || []));
                    }
                });

                // Build "failed orders today" from update_after=today calls.
                const failedOrdersTodayMap: { [key: string]: any } = {};
                todayFailedResults.forEach((result: any) => {
                    const orderItems = result?.orderItems || [];
                    orderItems.forEach((order: any) => {
                        const key = String(order?.order_id || order?.order_number || Math.random());
                        failedOrdersTodayMap[key] = order;
                    });
                });
                const failedOrdersToday = Object.values(failedOrdersTodayMap);
                console.log(`[DARAZ_HOME][fetch:${runId}] aggregated`, {
                    shippedSkus: allShippedSkus.length,
                    shippedBackSkus: allFailedSkus.length,
                    failedDeliverySkus: allITRSSkus.length,
                    failedOrdersToday: failedOrdersToday.length,
                });

                setShippedOrder(allShippedSkus);
                setFailedOrder(allFailedSkus);
                setITRSOrder(allITRSSkus);
                setFailedOrders(failedOrdersToday);
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.log(`[DARAZ_HOME][fetch:${runId}] error`, { errorMessage });
                // console.warn('⚠️ [HomeScreen] Error while fetching orders:', errorMessage);
                Alert.alert('Error', 'Failed to fetch some orders. Please check your connection and try again.', [{ text: 'OK' }]);
            } finally {
                console.log(`[DARAZ_HOME][fetch:${runId}] finished`);
                setDarazLoader(false)
                setScreenloader(false)
            }
        };

        fetchData();
    }, [all_access_tokens, firebaseDataLoaded, reloadScreen]);

    // Log failed orders state whenever it changes
    useEffect(() => {
        // console.log('📋 [FAILED ORDERS STATE] Current failed orders count:', failedOrders.length);
        // if (failedOrders.length > 0) {
        //     console.log('📦 [FAILED ORDERS STATE] Failed orders details:');
        //     failedOrders.forEach((order, index) => {
        //         console.log(`  Failed Order ${index + 1}:`, {
        //             orderId: order.order_id || order.orderId || 'N/A',
        //             orderNumber: order.order_number || order.orderNumber || 'N/A',
        //             status: order.status || 'N/A',
        //             createdAt: order.created_at || order.createdAt || 'N/A',
        //             updatedAt: order.updated_at || order.updatedAt || 'N/A',
        //             orderItemsCount: order.order_items?.length || 0,
        //             skus: order.order_items?.map(item => ({
        //                 sku: item.sku,
        //                 name: item.name || item.product_name,
        //                 quantity: item.quantity
        //             })) || []
        //         });
        //     });
        //     console.log('📊 [FAILED ORDERS STATE] Full failed orders array:', JSON.stringify(failedOrders, null, 2));
        // } else {
        //     console.log('ℹ️ [FAILED ORDERS STATE] No failed orders found');
        // }
    }, [failedOrders]);

    useEffect(() => {
        const merged = mergeSkuCounts(failedOrder, ITRSOrder);
        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku)
            return {
                ...item,
                price: price,
                status: price > 0 ? true : false
            };
        });

        console.log('[DARAZ_HOME][failed-merge] updated', {
            failedOrderSkus: failedOrder.length,
            itrsOrderSkus: ITRSOrder.length,
            mergedSkus: merged.length,
            pricedSkus: enriched.filter(i => Number(i.price) > 0).length,
            zeroPriceSkus: enriched.filter(i => Number(i.price) === 0).map(i => i.sku).slice(0, 10),
        });

        setFailedDeliveries(enriched)


    }, [failedOrder, ITRSOrder, firebaseSkus])


    useEffect(() => {
        const runId = ++darazTotalRunRef.current;
        console.log(`[DARAZ_HOME][total:${runId}] triggered`, {
            firebaseDataLoaded,
            shippedOrderCount: shippedOrder?.length || 0,
            failedDeliveriesCount: failedDeliveries?.length || 0,
            firebaseSkusCount: firebaseSkus?.length || 0,
            isProcessing: isProcessingRef.current,
        });
        // Prevent concurrent processing
        if (isProcessingRef.current) {
            pendingRecalcRef.current = true;
            console.log(`[DARAZ_HOME][total:${runId}] queued: already processing`);
            // console.log('⏸️ [HomeScreen] Skipping - already processing');
            return;
        }

        // Check if we have the minimum required data
        if (!firebaseDataLoaded || !shippedOrder || !failedDeliveries) {
            console.log(`[DARAZ_HOME][total:${runId}] skipped: data not ready`);
            // console.log('⏸️ [HomeScreen] Skipping - data not ready:', {
            //     firebaseDataLoaded,
            //     hasShippedOrder: !!shippedOrder,
            //     hasFailedDeliveries: !!failedDeliveries
            // });
            return;
        }

        // Create a hash of the current data to check if it's changed
        const dataHash = JSON.stringify({
            shippedOrder: shippedOrder.map(s => ({ sku: s.sku, quantity: s.quantity })).sort((a, b) => a.sku.localeCompare(b.sku)),
            failedDeliveries: failedDeliveries.map(f => ({ sku: f.sku, quantity: f.quantity })).sort((a, b) => a.sku.localeCompare(b.sku)),
            firebaseSkus: firebaseSkus.map(s => ({ sku: s.sku, price: s.price })).sort((a, b) => a.sku.localeCompare(b.sku)),
            firebaseProductsKeys: Object.keys(selector.firebaseProducts || {}).sort()
        });

        // If data hasn't changed, skip the API call
        if (lastProcessedDataRef.current === dataHash) {
            console.log(`[DARAZ_HOME][total:${runId}] skipped: unchanged hash`);
            // console.log('⏸️ [HomeScreen] Skipping - data unchanged');
            return;
        }

        // console.log('🔄 [HomeScreen] Processing orders for total calculation:', {
        //     shippedOrderCount: shippedOrder.length,
        //     failedDeliveriesCount: failedDeliveries.length,
        //     firebaseSkusCount: firebaseSkus.length,
        //     selectorProductsCount: Object.keys(selector.firebaseProducts || {}).length
        // });

        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);
        // console.log('🔀 [HomeScreen] Merged SKUs:', {
        //     mergedCount: merged.length,
        //     sample: merged.slice(0, 5).map(m => ({ sku: m.sku, quantity: m.quantity }))
        // });

        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku);

            // If no price found in firebaseSkus, try to get from firebaseProducts
            let finalPrice = price;
            if (price === 0 && selector.firebaseProducts) {
                // Try to find product by SKU
                const productEntry = Object.entries(selector.firebaseProducts).find(([key, product]) =>
                    normalizeSku(product?.sku) === normalizeSku(item.sku)
                );
                if (productEntry) {
                    const [, product] = productEntry;
                    const productPrice = parseFloat(product.price || 0);
                    if (!isNaN(productPrice) && productPrice > 0) {
                        finalPrice = productPrice;
                        // console.log(`✅ [HomeScreen] Found product price for ${item.sku}: ${finalPrice}`);
                    }
                }
            }

            return {
                ...item,
                price: finalPrice,
                status: finalPrice > 0 ? true : false
            };
        });
        console.log(`[DARAZ_HOME][total:${runId}] prepared payload`, {
            mergedSkus: merged.length,
            enrichedCount: enriched.length,
            shippedSkuSample: shippedOrder.map((s: any) => s.sku).slice(0, 10),
            failedSkuSample: failedDeliveries.map((f: any) => f.sku).slice(0, 10),
            zeroPriceSkus: enriched.filter(e => Number(e.price) === 0).map(e => e.sku).slice(0, 10),
        });

        // console.log('💰 [HomeScreen] Enriched items:', {
        //     total: enriched.length,
        //     itemsWithPrice: enriched.filter(e => e.price > 0).length,
        //     itemsWithZeroPrice: enriched.filter(e => e.price === 0).length,
        //     zeroPriceSkus: enriched.filter(e => e.price === 0).map(e => e.sku).slice(0, 10),
        //     sample: enriched.slice(0, 5).map(e => ({ sku: e.sku, price: e.price, quantity: e.quantity }))
        // });

        // Store the data hash for use in finally block
        const currentDataHash = dataHash;

        // Calculate totals using backend API
        const calculateAllOrdersTotal = async () => {
            isProcessingRef.current = true;
            try {
                const BASE_URL = getBaseUrl();
                const requestBody = {
                    items: enriched.map(item => ({
                        price: item.price,
                        quantity: item.quantity,
                        ...item,
                    })),
                };
                console.log(`[DARAZ_HOME][total:${runId}] calling /api/orders/calculate-totals`, {
                    itemsCount: requestBody.items.length,
                    positivePriceItems: requestBody.items.filter((i: any) => Number(i.price) > 0).length,
                    zeroPriceItems: requestBody.items.filter((i: any) => Number(i.price) === 0).length,
                    sample: requestBody.items.slice(0, 5).map((i: any) => ({ sku: i.sku, quantity: i.quantity, price: i.price })),
                });

                // console.log('📊 [HOME SCREEN - ORDERS TOTAL] Starting calculation...');
                // console.log('📤 [HOME SCREEN - ORDERS TOTAL] Request URL:', `${BASE_URL}/api/orders/calculate-totals`);
                // console.log('📤 [HOME SCREEN - ORDERS TOTAL] Request body:', JSON.stringify(requestBody, null, 2));
                // console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items count:', requestBody.items.length);
                // console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items with price > 0:', requestBody.items.filter(i => i.price > 0).length);
                // console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items with price = 0:', requestBody.items.filter(i => i.price === 0).length);

                const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                // console.log('📥 [HOME SCREEN - ORDERS TOTAL] Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    // console.log('✅ [HOME SCREEN - ORDERS TOTAL] Response data:', JSON.stringify(result, null, 2));

                    if (!result.error && result.data?.summary) {
                        // console.log('💰 [HOME SCREEN - ORDERS TOTAL] Grand total:', result.data.summary.grandTotal);
                        // console.log('📈 [HOME SCREEN - ORDERS TOTAL] Total items:', result.data.summary.totalItems);
                        // console.log('💵 [HOME SCREEN - ORDERS TOTAL] Formatted total:', result.data.summary.formattedGrandTotal);
                        // console.log('✅ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to:', result.data.summary.grandTotal);
                        console.log(`[DARAZ_HOME][total:${runId}] success`, {
                            grandTotal: result.data.summary.grandTotal,
                            totalItems: result.data.summary.totalItems,
                        });
                        setAllOrdersTotal(result.data.summary.grandTotal);
                    } else {
                        console.log(`[DARAZ_HOME][total:${runId}] invalid response`, {
                            error: result.error,
                            hasSummary: !!result.data?.summary,
                        });
                        // console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Response contains error:', result.error);
                        // console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Full result:', JSON.stringify(result, null, 2));
                        // console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0');
                        setAllOrdersTotal(0);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || errorData.message || 'Unknown error';
                    console.log(`[DARAZ_HOME][total:${runId}] http error`, {
                        status: response.status,
                        errorMessage,
                    });
                    // console.warn('⚠️ [HomeScreen] HTTP Error fetching orders total:', response.status, errorMessage);
                    // console.warn('⚠️ [HomeScreen] Error response data:', JSON.stringify(errorData, null, 2));
                    // console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0');
                    setAllOrdersTotal(0);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.log(`[DARAZ_HOME][total:${runId}] exception`, { errorMessage });
                // console.warn('⚠️ [HomeScreen] Error calculating orders total:', errorMessage);
                // if (error?.stack) {
                //     console.warn('⚠️ [HomeScreen] Stack:', error.stack);
                // }
                // console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0 due to error');
                // Don't show alert for calculation errors, just use default value
                setAllOrdersTotal(0);
            } finally {
                isProcessingRef.current = false;
                // Update the hash after processing
                lastProcessedDataRef.current = currentDataHash;
                if (pendingRecalcRef.current) {
                    pendingRecalcRef.current = false;
                    // Force one fresh run with the latest state snapshot.
                    lastProcessedDataRef.current = '';
                    console.log(`[DARAZ_HOME][total:${runId}] flushing queued recalculation`);
                    setRecalcNonce(prev => prev + 1);
                }
                console.log(`[DARAZ_HOME][total:${runId}] finished`);
            }
        };

        calculateAllOrdersTotal();
    }, [shippedOrder, failedDeliveries, firebaseSkus, selector.firebaseProducts, firebaseDataLoaded, recalcNonce])

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkusByNormalizedSku[normalizeSku(targetSku)];
        const price = found ? found.price : 0;

        // console.log(`[HomeScreen] getPriceBySku for ${targetSku}:`, {
        //     found: !!found,
        //     price: price,
        //     priceType: typeof price,
        //     firebaseSkusLength: firebaseSkus.length,
        //     sampleSkus: firebaseSkus.slice(0, 3).map(s => ({ sku: s.sku, price: s.price }))
        // });

        return price; // returns 0 if not found
    }

    //This function get the orders from daraz and then merge it in sku's and show us sku and quantity
    function countSkusFromOrders(data) {
        const skuCount = {};

        data.forEach(order => {
            order.order_items.forEach(item => {
                const sku = normalizeSku(item.sku);
                if (!sku) return;
                skuCount[sku] = (skuCount[sku] || 0) + 1;
            });
        });


        return Object.entries(skuCount).map(([sku, quantity]) => ({
            sku,
            quantity,
            price: getPriceBySku(firebaseSkus, sku)
        }));
    }

    function mergeSkuCounts(existing, incoming) {
        const combined = {};
        // Add existing items to the map
        existing.forEach(item => {
            const normalizedSku = normalizeSku(item.sku);
            if (!normalizedSku) return;
            combined[normalizedSku] = (combined[normalizedSku] || 0) + item.quantity;
        });

        // Merge in the new incoming items
        incoming.forEach(item => {
            const normalizedSku = normalizeSku(item.sku);
            if (!normalizedSku) return;
            combined[normalizedSku] = (combined[normalizedSku] || 0) + item.quantity;
        });

        // Convert back to array format
        return Object.entries(combined).map(([sku, quantity]) => ({
            sku,
            quantity,
        }));
    }

    // this function get the orders from daraz api, orders with different statuses
    const getDarazOrders = async (access_token, createdAfterISO, status, store) => {
        try {
            // Validate access token before making request
            if (!access_token) {
                // console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] Missing access token for status:", status);
                return null;
            }

            const requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
            // console.log('📤 [HOME SCREEN - DARAZ ORDERS] Fetching orders...');
            // console.log('📤 [HOME SCREEN - DARAZ ORDERS] Status:', status);
            // console.log('📤 [HOME SCREEN - DARAZ ORDERS] Created after:', createdAfterISO);
            // console.log('📤 [HOME SCREEN - DARAZ ORDERS] Request URL:', requestUrl.replace(access_token, 'ACCESS_TOKEN_HIDDEN'));

            let response = await fetch(requestUrl);

            // console.log('📥 [HOME SCREEN - DARAZ ORDERS] Response status:', response.status, response.statusText);

            // Check if token expired and refresh if needed
            const isExpired = await checkResponseForTokenExpiration(response);
            if (isExpired && store?.seller_id) {
                // console.log('🔄 [HOME SCREEN - DARAZ ORDERS] Token expired, attempting refresh...');
                const newToken = await refreshStoreTokenWithRefreshToken(store);

                if (newToken) {
                    // console.log('✅ [HOME SCREEN - DARAZ ORDERS] Token refreshed, retrying...');
                    const newUrl = requestUrl.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                    response = await fetch(newUrl);

                    // Update the token in the store object for future use
                    if (store.store?.user?.token) {
                        store.store.user.token.access_token = newToken;
                    }
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.message || 'Unknown error';
                // console.warn(`⚠️ [HomeScreen] Server error ${response.status} fetching Daraz orders:`, errorMessage);
                // Don't show alert for individual order fetch failures
                return null;
            }

            const data = await response.json();
            // console.log('✅ [HOME SCREEN - DARAZ ORDERS] Response received');
            // console.log('📊 [HOME SCREEN - DARAZ ORDERS] Response data:', JSON.stringify(data, null, 2));

            // Check if response contains an error
            if (data.error) {
                // console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                // console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] Invalid response format: orderItems missing or not an array");
                return null;
            }
            console.log('[DARAZ_HOME][orders] fetched', {
                status,
                ordersCount: data.countTotal || 0,
                orderItemsCount: data.orderItems.length,
            });

            // console.log('📦 [HOME SCREEN - DARAZ ORDERS] Order items count:', data.orderItems.length);
            // console.log('📈 [HOME SCREEN - DARAZ ORDERS] Count total:', data.countTotal || 0);

            return {
                status,
                countTotal: data.countTotal || 0,
                orderItems: data.orderItems || [],
                skus: countSkusFromOrders(data.orderItems || [])
            };
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            // console.warn('⚠️ [HomeScreen] Error fetching Daraz orders:', errorMessage);
            // if (error?.stack) {
            //     console.warn('⚠️ [HomeScreen] Stack:', error.stack);
            // }
            // Don't show alert for individual order fetch failures
            return null;
        }
    };

    // Separate function for failed orders using update_after and update_before
    const getFailedOrders = async (access_token, updateAfterISO, status, store) => {
        try {
            // Calculate update_before as end of today (23:59:59.999)
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            const updateBeforeISO = endOfToday.toISOString();

            const data = await getDarazFailedOrders(access_token, updateAfterISO, updateBeforeISO, status, store);

            if (!data || !data.orderItems || !data.orderItems.length) {
                // console.log('⚠️ [FAILED ORDERS] No data returned from API');
                return;
            }

            if (status == 'shipped_back') {
                // console.log('🔄 [FAILED ORDERS - SHIPPED_BACK] Processing shipped_back orders...');
                // console.log('📦 [FAILED ORDERS - SHIPPED_BACK] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    // console.log('✅ [FAILED ORDERS - SHIPPED_BACK] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                // console.log('📊 [FAILED ORDERS - SHIPPED_BACK] SKU counts:', newFailedOrders);
                setFailedOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    // console.log('✅ [FAILED ORDERS - SHIPPED_BACK] Total failed order SKUs:', updated.length);
                    return updated;
                });
            } else if (status == 'failed_delivery') {
                // console.log('🔄 [FAILED ORDERS - FAILED_DELIVERY] Processing failed_delivery orders...');
                // console.log('📦 [FAILED ORDERS - FAILED_DELIVERY] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    // console.log('✅ [FAILED ORDERS - FAILED_DELIVERY] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                // console.log('📊 [FAILED ORDERS - FAILED_DELIVERY] SKU counts:', newFailedOrders);
                setITRSOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    // console.log('✅ [FAILED ORDERS - FAILED_DELIVERY] Total ITRS order SKUs:', updated.length);
                    return updated;
                });
            } else if (status == 'shipped_back_success') {
                // console.log('🔄 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Processing shipped_back_success orders...');
                // console.log('📦 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    // console.log('✅ [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                // console.log('📊 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] SKU counts:', newFailedOrders);
                setFailedOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    // console.log('✅ [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Total failed order SKUs:', updated.length);
                    return updated;
                });
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            // console.warn('⚠️ [HomeScreen] Error processing failed orders:', errorMessage);
            // console.warn('⚠️ [HomeScreen] Status:', status);
            // Don't show alert for individual order processing errors
        }
    };








    /////////STOCK PART/////////
    const [totalPrice, setTotalPrice] = useState(0)
    const [products, setProducts] = useState([]);
    const [stockLoader, setStockLoader] = useState(false)


    // Fetch products from backend API for stock management
    useEffect(() => {
        if (!currentUser) return;

        const BASE_URL = getBaseUrl();

        const fetchProducts = async () => {
            try {
                setStockLoader(true);
                const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || 'Unknown error';
                    // console.warn('⚠️ [HomeScreen] Error fetching products:', errorMessage);
                    setProducts([]);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    // console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    setProducts([]);
                    return;
                }

                const products = result.data || [];
                // Convert to array format with id field
                const array = products.map((product, index) => ({
                    id: product.id || index.toString(),
                    ...product,
                }));
                setProducts(array);
            } catch (error) {
                // console.error('Error fetching data:', error);
            } finally {
                setStockLoader(false); // ensure loader stops even on error
            }
        };

        fetchProducts();
    }, [reloadScreen, currentUser])

    // Calculate stock total using backend API
    const calculateTotalPrice = async (productsList) => {
        if (!productsList || productsList.length === 0) {
            // console.log('📦 [HOME SCREEN - STOCK TOTAL] No products to calculate');
            setTotalPrice(0);
            return;
        }

        try {
            const BASE_URL = getBaseUrl();
            const requestBody = {
                products: productsList.map(item => ({
                    price: item.price,
                    quantity: item.quantity,
                    ...item,
                })),
            };

            // console.log('📦 [HOME SCREEN - STOCK TOTAL] Starting calculation...');
            // console.log('📤 [HOME SCREEN - STOCK TOTAL] Request URL:', `${BASE_URL}/api/stock/calculate-total`);
            // console.log('📤 [HOME SCREEN - STOCK TOTAL] Products count:', requestBody.products.length);
            // console.log('📤 [HOME SCREEN - STOCK TOTAL] Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${BASE_URL}/api/stock/calculate-total`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            // console.log('📥 [HOME SCREEN - STOCK TOTAL] Response status:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                // console.log('✅ [HOME SCREEN - STOCK TOTAL] Response data:', JSON.stringify(result, null, 2));

                if (!result.error && result.data?.summary) {
                    // console.log('💰 [HOME SCREEN - STOCK TOTAL] Total stock value:', result.data.summary.totalStockValue);
                    // console.log('📈 [HOME SCREEN - STOCK TOTAL] Total products:', result.data.summary.totalProducts);
                    // console.log('💵 [HOME SCREEN - STOCK TOTAL] Formatted total:', result.data.summary.formattedTotalValue);
                    setTotalPrice(result.data.summary.totalStockValue);
                    return;
                } else {
                    // console.warn('⚠️ [HOME SCREEN - STOCK TOTAL] Response contains error:', result.error);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                // console.error('❌ [HOME SCREEN - STOCK TOTAL] HTTP Error:', response.status, errorData);
            }
        } catch (error) {
            // console.error('❌ [HOME SCREEN - STOCK TOTAL] Exception:', error.message);
            // console.error('❌ [HOME SCREEN - STOCK TOTAL] Stack:', error.stack);
        }

        // Fallback to client-side calculation if API fails
        // console.log('🔄 [HOME SCREEN - STOCK TOTAL] Falling back to client-side calculation');
        const total = productsList?.reduce((total, item) => {
            return total + (item.price || 0) * (item.quantity || 0);
        }, 0) || 0;
        // console.log('💰 [HOME SCREEN - STOCK TOTAL] Client-side calculated total:', total);
        setTotalPrice(total);
    };

    useEffect(() => {
        calculateTotalPrice(products);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, reloadScreen]);

    useEffect(() => {

    }, [reloadScreen])


    // Data functions

    // this function get the orders from daraz api, orders with different statuses
    const getDarazPendingOrders = async (access_token, createdAfterISO, status, store_data) => {
        try {
            // Validate access token before making request
            if (!access_token) {
                // console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] Missing access token for status:", status);
                return null;
            }

            let requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
            // console.log('📤 [HOME SCREEN - PENDING ORDERS] Fetching orders...');
            // console.log('📤 [HOME SCREEN - PENDING ORDERS] Status:', status);
            // console.log('📤 [HOME SCREEN - PENDING ORDERS] Created after:', createdAfterISO);
            // console.log('📤 [HOME SCREEN - PENDING ORDERS] Request URL:', requestUrl.replace(access_token, 'ACCESS_TOKEN_HIDDEN'));

            let response = await fetch(requestUrl);

            // Check if token expired and refresh if needed
            const isExpired = await checkResponseForTokenExpiration(response);
            if (isExpired && store_data?.seller_id) {
                // console.log('🔄 [HOME SCREEN - PENDING ORDERS] Token expired, attempting refresh...');
                const newToken = await refreshStoreTokenWithRefreshToken(store_data);

                if (newToken) {
                    // console.log('✅ [HOME SCREEN - PENDING ORDERS] Token refreshed, retrying...');
                    requestUrl = requestUrl.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                    response = await fetch(requestUrl);

                    // Update the token in the store object for future use
                    if (store.store?.user?.token) {
                        store.store.user.token.access_token = newToken;
                    }
                }
            }

            // console.log('📥 [HOME SCREEN - PENDING ORDERS] Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // console.error(`❌ [HOME SCREEN - PENDING ORDERS] Server error ${response.status}:`, errorData);
                return null;
            }

            const data = await response.json();
            // console.log('✅ [HOME SCREEN - PENDING ORDERS] Response received for status:', status);
            // console.log('📊 [HOME SCREEN - PENDING ORDERS] Response data:', JSON.stringify(data, null, 2));

            // Check if response contains an error
            if (data.error) {
                // console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                // console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] Invalid response format: orderItems missing or not an array");
                return null;
            }

            // console.log('📦 [HOME SCREEN - PENDING ORDERS] Order items count:', data.orderItems.length);
            // console.log('📈 [HOME SCREEN - PENDING ORDERS] Count total:', data.countTotal || 0);

            if (status == 'pending') {
                // console.log('🔄 [HOME SCREEN - PENDING ORDERS] Updating pending orders state');
                setPendingOrdersCount(prev => {
                    const newCount = prev + (data.countTotal || 0);
                    // console.log('✅ [HOME SCREEN - PENDING ORDERS] Pending count:', newCount);
                    return newCount;
                });
                setPendingOrders(prev => {
                    // Important: Attach the access_token to each order and its items
                    const enrichedOrders = (data.orderItems || []).map(order => ({
                        ...order,
                        access_token: access_token,
                        order_items: (order.order_items || []).map(item => ({
                            ...item,
                            access_token: access_token
                        }))
                    }));
                    const updated = [...prev, ...enrichedOrders];
                    return updated;
                });
            } else if (status == 'ready_to_ship') {
                setReadyToShipOrdersCount(prev => prev + (data.countTotal || 0));
                setReadyToShipOrders(prev => {
                    // Important: Attach the access_token to each order and its items
                    const enrichedOrders = (data.orderItems || []).map(order => ({
                        ...order,
                        access_token: access_token,
                        order_items: (order.order_items || []).map(item => ({
                            ...item,
                            access_token: access_token
                        }))
                    }));
                    const updated = [...prev, ...enrichedOrders];
                    return updated;
                });
            } else {
                if (status == 'delivered') {
                    // console.log('🔄 [HOME SCREEN - PENDING ORDERS] Updating delivered orders state');
                    const skuCounts = countSkusFromOrders(data.orderItems || []);
                    // console.log('📊 [HOME SCREEN - PENDING ORDERS] Delivered SKU counts:', skuCounts);
                    setDarazDeliveredOrders(prev => {
                        const updated = [...prev, ...skuCounts];
                        // console.log('✅ [HOME SCREEN - PENDING ORDERS] Total delivered order SKUs:', updated.length);
                        return updated;
                    });
                    setDarazDeliveredOrdersCount(prev => {
                        const newCount = prev + (data?.orderItems?.length || 0);
                        // console.log('✅ [HOME SCREEN - PENDING ORDERS] Delivered orders count:', newCount);
                        return newCount;
                    });
                }
            }

            return data;
        } catch (error: any) {
            // console.error("❌ [HOME SCREEN - PENDING ORDERS] Exception:", error.message);
            // console.error("❌ [HOME SCREEN - PENDING ORDERS] Stack:", error.stack);
            return null;
        }
    };

    useEffect(() => {
        setDarazDeliveredOrders(selector.todayDeliveredOrders || []);
        setDarazDeliveredOrdersCount(selector.todayDeliveredOrders?.length || 0);

    }, [selector.todayDeliveredOrders]);

    useEffect(() => {
        if (!all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchOrders = async () => {
            setDarazOrdersLoader(true)

            setPendingOrders([])
            setPendingOrdersCount(0)
            setReadyToShipOrders([])
            setReadyToShipOrdersCount(0)
            setDarazDeliveredOrders([])
            setDarazDeliveredOrdersCount(0)
            dispatch(setTodayDeliveredOrders([]))

            const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                // Filter out invalid access tokens before making requests
                const validTokens = all_access_tokens.filter(item =>
                    item && item.access_token && item.access_token.trim() !== ''
                );
                requests = validTokens.flatMap(item => [
                    getDarazPendingOrders(item.access_token, createdAfter, 'pending', item),
                    getDarazPendingOrders(item.access_token, createdAfter, 'ready_to_ship', item),
                    getDarazDeliveredOrders(item.access_token, startOfToday.toISOString(), 'delivered', dispatch, item),
                ]);
            } else if (all_access_tokens && all_access_tokens.access_token && all_access_tokens.access_token.trim() !== '') {
                requests = [
                    getDarazPendingOrders(all_access_tokens.access_token, createdAfter, 'pending', all_access_tokens),
                    getDarazPendingOrders(all_access_tokens.access_token, createdAfter, 'ready_to_ship', all_access_tokens),
                    getDarazDeliveredOrders(all_access_tokens.access_token, startOfToday.toISOString(), 'delivered', dispatch, all_access_tokens),
                ];
            } else {
                // console.log('⚠️ [HOME SCREEN - PENDING ORDERS] No valid access tokens available');
            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
            } catch (error) {
                // console.error('Error while fetching orders:', error);
            } finally {
                setDarazOrdersLoader(false)
            }
        };

        fetchOrders();
    }, [all_access_tokens, reloadScreen]);

    const navigatedeliveredOrders = () => {

        navigation.navigate('DeliveredOrders', { darazDeliveredOrders: darazDeliveredOrders, firebaseSkus: firebaseSkus })
    }

    const navigateFailedOrders = () => {

        navigation.navigate('FailedDeliveryOrders', { failedOrderss: failedOrders, firebaseSkus: firebaseSkus })
    }
    const navigatePendingOrders = () => {
        navigation.navigate('PendingOrders', { pendingOrders: pendingOrders, firebaseSkus: firebaseSkus })
    }

    const navigateReadyToShipOrders = () => {
        navigation.navigate('ReadyToShipOrders', { readyToShipOrders: readyToShipOrders, firebaseSkus: firebaseSkus })
    }
    const navigateReviews = () => {
        navigation.navigate(AppScreens.ReviewsScreen)
    }

    const selectedStoreNameForReviews = useMemo(() => {
        return (
            selector?.selectedStore?.user?.seller?.data?.name ||
            selector?.selectedStore?.user?.seller?.name ||
            selector?.selectedStore?.name ||
            ''
        );
    }, [selector?.selectedStore]);

    const selectedStoreIdForReviews = useMemo(() => {
        return (
            selector?.selectedStore?.id ||
            selector?.selectedStore?.seller_id ||
            selector?.selectedStore?.user?.seller?.data?.short_code ||
            selector?.selectedStore?.user?.seller?.data?.seller_id ||
            ''
        );
    }, [selector?.selectedStore]);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const fetchReviewsCount = async () => {
            try {
                setReviewsLoader(true);
                reviewsDebug('fetchReviewsCount:start', {
                    userId: currentUser?.uid,
                    selectedStoreIdForReviews,
                    selectedStoreNameForReviews,
                });
                const response = await fetch(`${BASE_URL}/api/daraz-reviews/${currentUser.uid}`);
                const result = await response.json();
                let reviews = result?.data || [];
                reviewsDebug('fetchReviewsCount:response', {
                    status: response.status,
                    ok: response.ok,
                    count: Array.isArray(result?.data) ? result.data.length : 0,
                    stores: Array.isArray(result?.stores) ? result.stores.length : 0,
                    errors: Array.isArray(result?.errors) ? result.errors.length : 0,
                });

                if (selectedStoreIdForReviews && selectedStoreNameForReviews) {
                    const target = selectedStoreNameForReviews.toLowerCase().trim();
                    reviews = reviews.filter((r: any) => (r.storeName || '').toLowerCase().trim() === target);
                    reviewsDebug('fetchReviewsCount:filtered', {
                        targetStoreName: selectedStoreNameForReviews,
                        filteredCount: reviews.length,
                    });
                }

                setReviewsCount(reviews.length);
            } catch (error) {
                reviewsDebug('fetchReviewsCount:error', error);
                setReviewsCount(0);
            } finally {
                setReviewsLoader(false);
            }
        };

        fetchReviewsCount();
    }, [BASE_URL, currentUser?.uid, selectedStoreIdForReviews, selectedStoreNameForReviews, reloadScreen]);

    return (
        <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={screenloader} onRefresh={() => {
                    setScreenloader(true)
                    setReloadScreen(!reloadScreen)
                }} />
            }
            contentContainerStyle={HomeScreenStyles(theme).container}>

            <HomeHeader onOpenSettings={navigateSettings} />
            <SelectStore />
            <View style={{ rowGap: 16 }}>
                <TextComp size={16} style={{ fontFamily: FontFamilty.bold, color: theme.textPrimary }}>{AppStrings.darazDetails}</TextComp>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualDataComp onPress={navigatePendingOrders} loader={darazOrdersLoader} data={pendingOrdersCount} label={AppStrings.pendingOrders} info={AppStrings.darazInfo} />
                    <IndividualDataComp onPress={navigateReadyToShipOrders} loader={darazOrdersLoader} data={readyToShipOrdersCount} label={AppStrings.readyToShipOrders} info={AppStrings.stockInfo} />
                </View>

                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualDataComp loader={false} onPress={navigatedeliveredOrders} data={darazDeliveredOrdersCount} label={AppStrings.deliveredOrdersToday} info={AppStrings.cashInfo} />
                    <IndividualDataComp loader={false} onPress={navigateFailedOrders} data={failedOrders.length} label={AppStrings.failedOrdersToday} info={AppStrings.cashInfo} />
                </View>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualDataComp loader={reviewsLoader} onPress={navigateReviews} data={reviewsCount} label={AppStrings.reviews} info={AppStrings.reviewsInfo} />
                    <View style={{ flex: 1 }} />
                </View>
            </View>
            <View style={{ rowGap: 16 }}>
                <TextComp size={16} style={{ fontFamily: FontFamilty.bold, color: theme.textPrimary }}>{AppStrings.businessDetails}</TextComp>

                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp loader={darazLoader} onPress={navigateDaraz} amount={allOrdersTotal} label={AppStrings.daraz} info={AppStrings.darazInfo} />
                    <IndividualValueComp loader={stockLoader} onPress={navigateStock} amount={totalPrice} label={AppStrings.stock} info={AppStrings.stockInfo} />
                </View>
            </View>



        </ScrollView>
    );
}

const HomeScreenStyles = (theme) => StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: theme.bgcolor,
        rowGap: 16,
        flexGrow: 1,
    },
});

export default HomeScreen;
