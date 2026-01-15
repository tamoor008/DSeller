import React, { useEffect, useState, useRef } from 'react';
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
    

    const navigateDaraz = () => {
        navigation.navigate(AppScreens.DarazScreen)
    }
    const navigateStock = () => {
        navigation.navigate(AppScreens.StockScreen)
    }
    const navigateSettings = () => {
        navigation.navigate(AppScreens.Settings)
    }

    const dispatch=useDispatch()
    const [reloadScreen, setReloadScreen] = useState(false)
    const currentUser = auth.currentUser
    const selector = useSelector(state => state.AppReducer);
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

    const [failedOrders,setFailedOrders]=useState([])

    // Use refs to prevent unnecessary API calls
    const isProcessingRef = useRef(false);
    const lastProcessedDataRef = useRef<string>('');

    // Fetch SKUs from backend API (all SKU operations go through backend)
    useEffect(() => {
        if (!currentUser) return;
        
        const BASE_URL = getBaseUrl();
        console.log('🌐 [HomeScreen] Base URL:', BASE_URL);
        
        const fetchSkus = async () => {
            try {
                const fetchUrl = `${BASE_URL}/api/skus/${currentUser.uid}`;
                console.log('📤 [HomeScreen] Fetching SKUs from URL:', fetchUrl);
                
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
                    
                    console.warn('⚠️ [HomeScreen] Error fetching SKUs:', errorMessage);
                    console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                    console.warn('⚠️ [HomeScreen] Full URL was:', fetchUrl);
                    console.warn('⚠️ [HomeScreen] Response status:', response.status, response.statusText);
                    console.warn('⚠️ [HomeScreen] Content-Type:', contentType);
                    setFirebaseSkus([]);
                    setfirebaseDataLoaded(true);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    setFirebaseSkus([]);
                    setfirebaseDataLoaded(true);
                    return;
                }

                const skus = result.data || [];
                setFirebaseSkus(skus);
                setfirebaseDataLoaded(true);
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [HomeScreen] Error fetching SKU data:', errorMessage);
                console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                console.warn('⚠️ [HomeScreen] Full URL was:', `${BASE_URL}/api/skus/${currentUser.uid}`);
                if (error?.stack) {
                    console.warn('⚠️ [HomeScreen] Error stack:', error.stack);
                }
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
                console.log('📤 [HomeScreen] Fetching products from URL:', fetchUrl);
                
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
                    
                    console.warn('⚠️ [HomeScreen] Error fetching products:', errorMessage);
                    console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                    console.warn('⚠️ [HomeScreen] Full URL was:', fetchUrl);
                    console.warn('⚠️ [HomeScreen] Response status:', response.status, response.statusText);
                    console.warn('⚠️ [HomeScreen] Content-Type:', contentType);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    return;
                }

                const products = result.data || [];
                if (products.length === 0) {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [HomeScreen] Error fetching product data:', errorMessage);
                console.warn('⚠️ [HomeScreen] Base URL was:', BASE_URL);
                console.warn('⚠️ [HomeScreen] Full URL was:', `${BASE_URL}/api/products/${currentUser.uid}`);
                if (error?.stack) {
                    console.warn('⚠️ [HomeScreen] Error stack:', error.stack);
                }
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
                    store: selector.selectedStore
                }];
            }
        } else {
            // Filter out stores without valid access tokens
            newTokens = Array.isArray(selector.access_tokens) 
                ? selector.access_tokens.filter((token: any) => 
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

        const fetchOrders = async () => {
            console.log('🏠 [HOME SCREEN] Starting to fetch orders...');
            console.log('📊 [HOME SCREEN] Firebase data loaded:', firebaseDataLoaded);
            console.log('🔑 [HOME SCREEN] Access tokens count:', Array.isArray(all_access_tokens) ? all_access_tokens.length : all_access_tokens ? 1 : 0);

            setFailedOrder([])
            setShippedOrder([])
            setITRSOrder([])
            setFailedOrders([])
            setDarazLoader(true)

            const createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago for shipped orders
            
            // For today's failed and delivered orders, use start of today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayISO = startOfToday.toISOString();
            
            console.log('📅 [HOME SCREEN] Date filters:');
            console.log('  - Shipped orders (7 days):', createdAfter);
            console.log('  - Failed orders (today):', todayISO);
            console.log('  - Today start:', startOfToday.toLocaleString());

            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                // Filter out invalid access tokens before making requests
                const validTokens = all_access_tokens.filter(item => 
                    item && item.access_token && item.access_token.trim() !== ''
                );
                console.log('🔄 [HOME SCREEN] Fetching for', validTokens.length, 'stores (filtered from', all_access_tokens.length, 'total)');
                requests = validTokens.flatMap(item => [
                    getDarazOrders(item.access_token, createdAfter, 'shipped', item),
                    getFailedOrders(item.access_token, todayISO, 'shipped_back_success', item), // Today only - uses update_after
                ]);
            } else if (all_access_tokens && all_access_tokens.access_token && all_access_tokens.access_token.trim() !== '') {
                console.log('🔄 [HOME SCREEN] Fetching for single store');
                requests = [
                    getDarazOrders(all_access_tokens.access_token, createdAfter, 'shipped', all_access_tokens),
                    getFailedOrders(all_access_tokens.access_token, todayISO, 'shipped_back_success', all_access_tokens), // Today only - uses update_after
                ];
            } else {
                console.log('⚠️ [HOME SCREEN] No valid access tokens available');
            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
                console.log('✅ [HOME SCREEN] All order fetches completed');
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [HomeScreen] Error while fetching orders:', errorMessage);
                Alert.alert('Error', 'Failed to fetch some orders. Please check your connection and try again.', [{ text: 'OK' }]);
            } finally {
                setDarazLoader(false)
                setScreenloader(false)
            }
        };

        fetchOrders();
    }, [all_access_tokens, firebaseDataLoaded, reloadScreen]);

    // Log failed orders state whenever it changes
    useEffect(() => {
        console.log('📋 [FAILED ORDERS STATE] Current failed orders count:', failedOrders.length);
        if (failedOrders.length > 0) {
            console.log('📦 [FAILED ORDERS STATE] Failed orders details:');
            failedOrders.forEach((order, index) => {
                console.log(`  Failed Order ${index + 1}:`, {
                    orderId: order.order_id || order.orderId || 'N/A',
                    orderNumber: order.order_number || order.orderNumber || 'N/A',
                    status: order.status || 'N/A',
                    createdAt: order.created_at || order.createdAt || 'N/A',
                    updatedAt: order.updated_at || order.updatedAt || 'N/A',
                    orderItemsCount: order.order_items?.length || 0,
                    skus: order.order_items?.map(item => ({
                        sku: item.sku,
                        name: item.name || item.product_name,
                        quantity: item.quantity
                    })) || []
                });
            });
            console.log('📊 [FAILED ORDERS STATE] Full failed orders array:', JSON.stringify(failedOrders, null, 2));
        } else {
            console.log('ℹ️ [FAILED ORDERS STATE] No failed orders found');
        }
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



        setFailedDeliveries(enriched)


    }, [failedOrder, ITRSOrder])


    useEffect(() => {
        // Prevent concurrent processing
        if (isProcessingRef.current) {
            console.log('⏸️ [HomeScreen] Skipping - already processing');
            return;
        }

        // Check if we have the minimum required data
        if (!firebaseDataLoaded || !shippedOrder || !failedDeliveries) {
            console.log('⏸️ [HomeScreen] Skipping - data not ready:', {
                firebaseDataLoaded,
                hasShippedOrder: !!shippedOrder,
                hasFailedDeliveries: !!failedDeliveries
            });
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
            console.log('⏸️ [HomeScreen] Skipping - data unchanged');
            return;
        }

        console.log('🔄 [HomeScreen] Processing orders for total calculation:', {
            shippedOrderCount: shippedOrder.length,
            failedDeliveriesCount: failedDeliveries.length,
            firebaseSkusCount: firebaseSkus.length,
            selectorProductsCount: Object.keys(selector.firebaseProducts || {}).length
        });
        
        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);
        console.log('🔀 [HomeScreen] Merged SKUs:', {
            mergedCount: merged.length,
            sample: merged.slice(0, 5).map(m => ({ sku: m.sku, quantity: m.quantity }))
        });

        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku);
            
            // If no price found in firebaseSkus, try to get from firebaseProducts
            let finalPrice = price;
            if (price === 0 && selector.firebaseProducts) {
                // Try to find product by SKU
                const productEntry = Object.entries(selector.firebaseProducts).find(([key, product]: [string, any]) => 
                    product?.sku === item.sku
                );
                if (productEntry) {
                    const [, product] = productEntry;
                    const productPrice = parseFloat(product.price || 0);
                    if (!isNaN(productPrice) && productPrice > 0) {
                        finalPrice = productPrice;
                        console.log(`✅ [HomeScreen] Found product price for ${item.sku}: ${finalPrice}`);
                    }
                }
            }
            
            return {
                ...item,
                price: finalPrice,
                status: finalPrice > 0 ? true : false
            };
        });
        
        console.log('💰 [HomeScreen] Enriched items:', {
            total: enriched.length,
            itemsWithPrice: enriched.filter(e => e.price > 0).length,
            itemsWithZeroPrice: enriched.filter(e => e.price === 0).length,
            zeroPriceSkus: enriched.filter(e => e.price === 0).map(e => e.sku).slice(0, 10),
            sample: enriched.slice(0, 5).map(e => ({ sku: e.sku, price: e.price, quantity: e.quantity }))
        });
        
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
                
                console.log('📊 [HOME SCREEN - ORDERS TOTAL] Starting calculation...');
                console.log('📤 [HOME SCREEN - ORDERS TOTAL] Request URL:', `${BASE_URL}/api/orders/calculate-totals`);
                console.log('📤 [HOME SCREEN - ORDERS TOTAL] Request body:', JSON.stringify(requestBody, null, 2));
                console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items count:', requestBody.items.length);
                console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items with price > 0:', requestBody.items.filter(i => i.price > 0).length);
                console.log('📤 [HOME SCREEN - ORDERS TOTAL] Items with price = 0:', requestBody.items.filter(i => i.price === 0).length);
                
                const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                console.log('📥 [HOME SCREEN - ORDERS TOTAL] Response status:', response.status, response.statusText);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [HOME SCREEN - ORDERS TOTAL] Response data:', JSON.stringify(result, null, 2));
                    
                    if (!result.error && result.data?.summary) {
                        console.log('💰 [HOME SCREEN - ORDERS TOTAL] Grand total:', result.data.summary.grandTotal);
                        console.log('📈 [HOME SCREEN - ORDERS TOTAL] Total items:', result.data.summary.totalItems);
                        console.log('💵 [HOME SCREEN - ORDERS TOTAL] Formatted total:', result.data.summary.formattedGrandTotal);
                        console.log('✅ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to:', result.data.summary.grandTotal);
                        setAllOrdersTotal(result.data.summary.grandTotal);
                    } else {
                        console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Response contains error:', result.error);
                        console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Full result:', JSON.stringify(result, null, 2));
                        console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0');
                        setAllOrdersTotal(0);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || errorData.message || 'Unknown error';
                    console.warn('⚠️ [HomeScreen] HTTP Error fetching orders total:', response.status, errorMessage);
                    console.warn('⚠️ [HomeScreen] Error response data:', JSON.stringify(errorData, null, 2));
                    console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0');
                    setAllOrdersTotal(0);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [HomeScreen] Error calculating orders total:', errorMessage);
                if (error?.stack) {
                    console.warn('⚠️ [HomeScreen] Stack:', error.stack);
                }
                console.warn('⚠️ [HOME SCREEN - ORDERS TOTAL] Setting allOrdersTotal to 0 due to error');
                // Don't show alert for calculation errors, just use default value
                setAllOrdersTotal(0);
            } finally {
                isProcessingRef.current = false;
                // Update the hash after processing
                lastProcessedDataRef.current = currentDataHash;
            }
        };

        calculateAllOrdersTotal();
    }, [shippedOrder, failedDeliveries, firebaseSkus, selector.firebaseProducts, firebaseDataLoaded])

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        const price = found ? found.price : 0;
        
        console.log(`[HomeScreen] getPriceBySku for ${targetSku}:`, {
            found: !!found,
            price: price,
            priceType: typeof price,
            firebaseSkusLength: firebaseSkus.length,
            sampleSkus: firebaseSkus.slice(0, 3).map(s => ({ sku: s.sku, price: s.price }))
        });
        
        return price; // returns 0 if not found
    }

    //This function get the orders from daraz and then merge it in sku's and show us sku and quantity
    function countSkusFromOrders(data) {
        const skuCount = {};

        data.forEach(order => {
            order.order_items.forEach(item => {
                const sku = item.sku;
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
            combined[item.sku] = (combined[item.sku] || 0) + item.quantity;
        });

        // Merge in the new incoming items
        incoming.forEach(item => {
            combined[item.sku] = (combined[item.sku] || 0) + item.quantity;
        });

        // Convert back to array format
        return Object.entries(combined).map(([sku, quantity]) => ({
            sku,
            quantity,
        }));
    }

    // this function get the orders from daraz api, orders with different statuses
    const getDarazOrders = async (access_token, createdAfterISO, status, store?: any) => {
        try {
            // Validate access token before making request
            if (!access_token) {
                console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] Missing access token for status:", status);
                return null;
            }

            const requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
            console.log('📤 [HOME SCREEN - DARAZ ORDERS] Fetching orders...');
            console.log('📤 [HOME SCREEN - DARAZ ORDERS] Status:', status);
            console.log('📤 [HOME SCREEN - DARAZ ORDERS] Created after:', createdAfterISO);
            console.log('📤 [HOME SCREEN - DARAZ ORDERS] Request URL:', requestUrl.replace(access_token, 'ACCESS_TOKEN_HIDDEN'));

            let response = await fetch(requestUrl);

            console.log('📥 [HOME SCREEN - DARAZ ORDERS] Response status:', response.status, response.statusText);

            // Check if token expired and refresh if needed
            const isExpired = await checkResponseForTokenExpiration(response);
            if (isExpired && store?.seller_id) {
                console.log('🔄 [HOME SCREEN - DARAZ ORDERS] Token expired, attempting refresh...');
                const newToken = await refreshStoreTokenWithRefreshToken(store);
                
                if (newToken) {
                    console.log('✅ [HOME SCREEN - DARAZ ORDERS] Token refreshed, retrying...');
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
                console.warn(`⚠️ [HomeScreen] Server error ${response.status} fetching Daraz orders:`, errorMessage);
                // Don't show alert for individual order fetch failures
                return null;
            }

            const data = await response.json();
            console.log('✅ [HOME SCREEN - DARAZ ORDERS] Response received');
            console.log('📊 [HOME SCREEN - DARAZ ORDERS] Response data:', JSON.stringify(data, null, 2));

            // Check if response contains an error
            if (data.error) {
                console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                console.warn("⚠️ [HOME SCREEN - DARAZ ORDERS] Invalid response format: orderItems missing or not an array");
                return null;
            }

            console.log('📦 [HOME SCREEN - DARAZ ORDERS] Order items count:', data.orderItems.length);
            console.log('📈 [HOME SCREEN - DARAZ ORDERS] Count total:', data.countTotal || 0);

            if (status == 'shipped') {
                const skuCounts = countSkusFromOrders(data.orderItems);
                console.log('🔄 [HOME SCREEN - DARAZ ORDERS] SKU counts calculated:', skuCounts);
                console.log('🔄 [HOME SCREEN - DARAZ ORDERS] Adding', skuCounts.length, 'SKU entries to shipped orders');
                setShippedOrder(prev => {
                    const updated = [...prev, ...skuCounts];
                    console.log('✅ [HOME SCREEN - DARAZ ORDERS] Total shipped order SKUs:', updated.length);
                    return updated;
                });
            }

            return data;
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            console.warn('⚠️ [HomeScreen] Error fetching Daraz orders:', errorMessage);
            if (error?.stack) {
                console.warn('⚠️ [HomeScreen] Stack:', error.stack);
            }
            // Don't show alert for individual order fetch failures
            return null;
        }
    };

    // Separate function for failed orders using update_after and update_before
    const getFailedOrders = async (access_token, updateAfterISO, status, store?: any) => {
        try {
            // Calculate update_before as end of today (23:59:59.999)
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            const updateBeforeISO = endOfToday.toISOString();

            const data = await getDarazFailedOrders(access_token, updateAfterISO, updateBeforeISO, status, store);
            
            if (!data || !data.orderItems || !data.orderItems.length) {
                console.log('⚠️ [FAILED ORDERS] No data returned from API');
                return;
            }

            if (status == 'shipped_back') {
                console.log('🔄 [FAILED ORDERS - SHIPPED_BACK] Processing shipped_back orders...');
                console.log('📦 [FAILED ORDERS - SHIPPED_BACK] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    console.log('✅ [FAILED ORDERS - SHIPPED_BACK] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                console.log('📊 [FAILED ORDERS - SHIPPED_BACK] SKU counts:', newFailedOrders);
                setFailedOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    console.log('✅ [FAILED ORDERS - SHIPPED_BACK] Total failed order SKUs:', updated.length);
                    return updated;
                });
            } else if (status == 'failed_delivery') {
                console.log('🔄 [FAILED ORDERS - FAILED_DELIVERY] Processing failed_delivery orders...');
                console.log('📦 [FAILED ORDERS - FAILED_DELIVERY] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    console.log('✅ [FAILED ORDERS - FAILED_DELIVERY] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                console.log('📊 [FAILED ORDERS - FAILED_DELIVERY] SKU counts:', newFailedOrders);
                setITRSOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    console.log('✅ [FAILED ORDERS - FAILED_DELIVERY] Total ITRS order SKUs:', updated.length);
                    return updated;
                });
            } else if (status == 'shipped_back_success') {
                console.log('🔄 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Processing shipped_back_success orders...');
                console.log('📦 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Adding', data.orderItems?.length || 0, 'orders to failedOrders state');
                setFailedOrders(prev => {
                    const updated = [...prev, ...data.orderItems];
                    console.log('✅ [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Total failed orders in state:', updated.length);
                    return updated;
                });
                const newFailedOrders = countSkusFromOrders(data.orderItems);
                console.log('📊 [FAILED ORDERS - SHIPPED_BACK_SUCCESS] SKU counts:', newFailedOrders);
                setFailedOrder(prev => {
                    const updated = [...prev, ...newFailedOrders];
                    console.log('✅ [FAILED ORDERS - SHIPPED_BACK_SUCCESS] Total failed order SKUs:', updated.length);
                    return updated;
                });
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            console.warn('⚠️ [HomeScreen] Error processing failed orders:', errorMessage);
            console.warn('⚠️ [HomeScreen] Status:', status);
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
                    console.warn('⚠️ [HomeScreen] Error fetching products:', errorMessage);
                    setProducts([]);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    console.warn('⚠️ [HomeScreen] API returned error:', errorMessage);
                    setProducts([]);
                    return;
                }

                const products = result.data || [];
                // Convert to array format with id field
                const array = products.map((product: any, index: number) => ({
                    id: product.id || index.toString(),
                    ...product,
                }));
                setProducts(array);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setStockLoader(false); // ensure loader stops even on error
            }
        };

        fetchProducts();
    }, [reloadScreen, currentUser])

    // Calculate stock total using backend API
    const calculateTotalPrice = async (productsList: any[]) => {
        if (!productsList || productsList.length === 0) {
            console.log('📦 [HOME SCREEN - STOCK TOTAL] No products to calculate');
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
            
            console.log('📦 [HOME SCREEN - STOCK TOTAL] Starting calculation...');
            console.log('📤 [HOME SCREEN - STOCK TOTAL] Request URL:', `${BASE_URL}/api/stock/calculate-total`);
            console.log('📤 [HOME SCREEN - STOCK TOTAL] Products count:', requestBody.products.length);
            console.log('📤 [HOME SCREEN - STOCK TOTAL] Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${BASE_URL}/api/stock/calculate-total`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📥 [HOME SCREEN - STOCK TOTAL] Response status:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ [HOME SCREEN - STOCK TOTAL] Response data:', JSON.stringify(result, null, 2));
                
                if (!result.error && result.data?.summary) {
                    console.log('💰 [HOME SCREEN - STOCK TOTAL] Total stock value:', result.data.summary.totalStockValue);
                    console.log('📈 [HOME SCREEN - STOCK TOTAL] Total products:', result.data.summary.totalProducts);
                    console.log('💵 [HOME SCREEN - STOCK TOTAL] Formatted total:', result.data.summary.formattedTotalValue);
                    setTotalPrice(result.data.summary.totalStockValue);
                    return;
                } else {
                    console.warn('⚠️ [HOME SCREEN - STOCK TOTAL] Response contains error:', result.error);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ [HOME SCREEN - STOCK TOTAL] HTTP Error:', response.status, errorData);
            }
        } catch (error: any) {
            console.error('❌ [HOME SCREEN - STOCK TOTAL] Exception:', error.message);
            console.error('❌ [HOME SCREEN - STOCK TOTAL] Stack:', error.stack);
        }

        // Fallback to client-side calculation if API fails
        console.log('🔄 [HOME SCREEN - STOCK TOTAL] Falling back to client-side calculation');
        const total = productsList?.reduce((total, item) => {
            return total + (item.price || 0) * (item.quantity || 0);
        }, 0) || 0;
        console.log('💰 [HOME SCREEN - STOCK TOTAL] Client-side calculated total:', total);
        setTotalPrice(total);
    };

    useEffect(() => {
        calculateTotalPrice(products);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, reloadScreen]);

    useEffect(() => {

    }, [reloadScreen])


    // Data functions

    const [pendingOrders, setPendingOrders] = useState([])
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
    const [readyToShipOrders, setReadyToShipOrders] = useState([])
    const [readyToShipOrdersCount, setReadyToShipOrdersCount] = useState(0)
    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)

    const [darazDeliveredOrders, setDarazDeliveredOrders] = useState([])
    const [darazDeliveredOrdersCount, setDarazDeliveredOrdersCount] = useState(0)


    // this function get the orders from daraz api, orders with different statuses
    const getDarazPendingOrders = async (access_token, createdAfterISO, status) => {
        try {
            // Validate access token before making request
            if (!access_token) {
                console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] Missing access token for status:", status);
                return null;
            }

            let requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
            console.log('📤 [HOME SCREEN - PENDING ORDERS] Fetching orders...');
            console.log('📤 [HOME SCREEN - PENDING ORDERS] Status:', status);
            console.log('📤 [HOME SCREEN - PENDING ORDERS] Created after:', createdAfterISO);
            console.log('📤 [HOME SCREEN - PENDING ORDERS] Request URL:', requestUrl.replace(access_token, 'ACCESS_TOKEN_HIDDEN'));

            let response = await fetch(requestUrl);
            
            // Check if token expired and refresh if needed
            const isExpired = await checkResponseForTokenExpiration(response);
            if (isExpired && store?.seller_id) {
                console.log('🔄 [HOME SCREEN - PENDING ORDERS] Token expired, attempting refresh...');
                const newToken = await refreshStoreTokenWithRefreshToken(store);
                
                if (newToken) {
                    console.log('✅ [HOME SCREEN - PENDING ORDERS] Token refreshed, retrying...');
                    requestUrl = requestUrl.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                    response = await fetch(requestUrl);
                    
                    // Update the token in the store object for future use
                    if (store.store?.user?.token) {
                        store.store.user.token.access_token = newToken;
                    }
                }
            }

            console.log('📥 [HOME SCREEN - PENDING ORDERS] Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ [HOME SCREEN - PENDING ORDERS] Server error ${response.status}:`, errorData);
                return null;
            }

            const data = await response.json();
            console.log('✅ [HOME SCREEN - PENDING ORDERS] Response received for status:', status);
            console.log('📊 [HOME SCREEN - PENDING ORDERS] Response data:', JSON.stringify(data, null, 2));

            // Check if response contains an error
            if (data.error) {
                console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                console.warn("⚠️ [HOME SCREEN - PENDING ORDERS] Invalid response format: orderItems missing or not an array");
                return null;
            }

            console.log('📦 [HOME SCREEN - PENDING ORDERS] Order items count:', data.orderItems.length);
            console.log('📈 [HOME SCREEN - PENDING ORDERS] Count total:', data.countTotal || 0);

            if (status == 'pending') {
                console.log('🔄 [HOME SCREEN - PENDING ORDERS] Updating pending orders state');
                setPendingOrdersCount(prev => {
                    const newCount = prev + (data.countTotal || 0);
                    console.log('✅ [HOME SCREEN - PENDING ORDERS] Pending count:', newCount);
                    return newCount;
                });
                setPendingOrders(prev => {
                    const updated = [...prev, ...(data.orderItems || [])];
                    console.log('✅ [HOME SCREEN - PENDING ORDERS] Total pending orders:', updated.length);
                    return updated;
                });
            } else if (status == 'ready_to_ship') {
                console.log('🔄 [HOME SCREEN - PENDING ORDERS] Updating ready to ship orders state');
                setReadyToShipOrdersCount(prev => {
                    const newCount = prev + (data.countTotal || 0);
                    console.log('✅ [HOME SCREEN - PENDING ORDERS] Ready to ship count:', newCount);
                    return newCount;
                });
                setReadyToShipOrders(prev => {
                    const updated = [...prev, ...(data.orderItems || [])];
                    console.log('✅ [HOME SCREEN - PENDING ORDERS] Total ready to ship orders:', updated.length);
                    return updated;
                });
            } else {
                if(status=='delivered'){                    
                    console.log('🔄 [HOME SCREEN - PENDING ORDERS] Updating delivered orders state');
                    const skuCounts = countSkusFromOrders(data.orderItems || []);
                    console.log('📊 [HOME SCREEN - PENDING ORDERS] Delivered SKU counts:', skuCounts);
                    setDarazDeliveredOrders(prev => {
                        const updated = [...prev, ...skuCounts];
                        console.log('✅ [HOME SCREEN - PENDING ORDERS] Total delivered order SKUs:', updated.length);
                        return updated;
                    });
                    setDarazDeliveredOrdersCount(prev => {
                        const newCount = prev + (data?.orderItems?.length || 0);
                        console.log('✅ [HOME SCREEN - PENDING ORDERS] Delivered orders count:', newCount);
                        return newCount;
                    });
                }
            }

            return data;
        } catch (error: any) {
            console.error("❌ [HOME SCREEN - PENDING ORDERS] Exception:", error.message);
            console.error("❌ [HOME SCREEN - PENDING ORDERS] Stack:", error.stack);
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
                console.log('⚠️ [HOME SCREEN - PENDING ORDERS] No valid access tokens available');
            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
            } catch (error) {
                console.error('Error while fetching orders:', error);
            } finally {
                setDarazOrdersLoader(false)
            }
        };

        fetchOrders();
    }, [all_access_tokens,reloadScreen]);

    const navigatedeliveredOrders=()=>{
        
        navigation.navigate('DeliveredOrders',{darazDeliveredOrders:darazDeliveredOrders,firebaseSkus:firebaseSkus})
    }

    const navigateFailedOrders=()=>{
        
        navigation.navigate('FailedDeliveryOrders',{failedOrderss:failedOrders,firebaseSkus:firebaseSkus})
    }
    const navigatePendingOrders=()=>{
        navigation.navigate('PendingOrders',{pendingOrders:pendingOrders,firebaseSkus:firebaseSkus})
    }

    const navigateReadyToShipOrders=()=>{
        navigation.navigate('ReadyToShipOrders',{readyToShipOrders:readyToShipOrders,firebaseSkus:firebaseSkus})
    }

    return (
        <ScrollView
            style={{ flex: 1}}
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
                    <IndividualDataComp onPress={navigatePendingOrders} loader={darazOrdersLoader}  data={pendingOrdersCount} label={AppStrings.pendingOrders} info={AppStrings.darazInfo} />
                    <IndividualDataComp onPress={navigateReadyToShipOrders} loader={darazOrdersLoader} data={readyToShipOrdersCount} label={AppStrings.readyToShipOrders} info={AppStrings.stockInfo} />
                </View>

                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualDataComp loader={false} onPress={navigatedeliveredOrders} data={darazDeliveredOrdersCount} label={AppStrings.deliveredOrdersToday} info={AppStrings.cashInfo} />
                    <IndividualDataComp loader={false} onPress={navigateFailedOrders} data={failedOrders.length} label={AppStrings.failedOrdersToday} info={AppStrings.cashInfo} />
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
