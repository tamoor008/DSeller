import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import { useSelector, useDispatch } from 'react-redux';
import SkuLinking from './SkuLinking';
import { auth } from '../../../../firebase';
import { getBaseUrl } from '../../../utils/api/baseUrl';
import { startFirebaseListener } from '../../../utils/firebase/firebaseListeners';

const OrderTabs = ({ }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async
    const dispatch = useDispatch();

    const currentUser = auth.currentUser
    const selector = useSelector(state => state.AppReducer);
    const [allOrder, setAllOrder] = useState([])
    const [shippedOrder, setShippedOrder] = useState([])
    const [finalShippedOrder, setFinalShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])
    const [modalVisible, setmodalVisible] = useState(false)
    const [allOrderCount, setOrderCount] = useState(0)
    const [shippedOrderCount, setShippedOrderCount] = useState(0)
    const [failedOrderCount, setFailedOrderCount] = useState(0)
    const [failedDeliveries, setFailedDeliveries] = useState([])
    const [shippedOrdersTotal, setshippedOrdersTotal] = useState(0)
    const [failedOrdersTotal, setfailedOrdersTotal] = useState(0)
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [firebaseSkus, setFirebaseSkus] = useState([])
    const [selectedSku, setSelectedSku] = useState({})
    const [loader, setLoader] = useState(true)
    const [tabs, setTabs] = useState([]);
    const [allOrdersTotal, setAllOrdersTotal] = useState(0)
    const [firebaseDataLoaded, setfirebaseDataLoaded] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    
    // Use refs to prevent infinite loops
    const allOrderRef = useRef(allOrder);
    const isProcessingFailedRef = useRef(false);
    const isProcessingShippedRef = useRef(false);
    const isProcessingAllRef = useRef(false);
    const firebaseProductsRef = useRef(selector.firebaseProducts);
    const firebaseProductsKeysRef = useRef<string>('');
    
    // Update ref when firebaseProducts actually changes (by comparing keys)
    const currentKeys = Object.keys(selector.firebaseProducts || {}).sort().join(',');
    if (currentKeys !== firebaseProductsKeysRef.current) {
        firebaseProductsKeysRef.current = currentKeys;
        firebaseProductsRef.current = selector.firebaseProducts;
    }
    
    // Use ref for stable reference
    const memoizedFirebaseProducts = firebaseProductsRef.current;

    // Initialize Firebase products listener
    useEffect(() => {
        if (!currentUser) return;
        
        console.log('[OrderTabs] Starting Firebase products listener');
        startFirebaseListener(dispatch);
    }, [currentUser, dispatch]);

    // Fetch SKUs from backend
    useEffect(() => {
        if (!currentUser) return;
        
        const fetchSkus = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/skus/${currentUser.uid}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || 'Unknown error';
                    console.warn('⚠️ [OrderTabs] Error fetching SKUs:', errorMessage);
                    Alert.alert('Error', 'Failed to load SKU data. Please try again.', [{ text: 'OK' }]);
                    setFirebaseSkus([]);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    console.warn('⚠️ [OrderTabs] API returned error:', errorMessage);
                    Alert.alert('Error', result.message || 'Failed to load SKU data. Please try again.', [{ text: 'OK' }]);
                    setFirebaseSkus([]);
                    return;
                }

                const skus = result.data || [];
                const skusWithPrice = skus.filter(s => s.price && s.price > 0);
                const skusWithZeroPrice = skus.filter(s => !s.price || s.price === 0);
                
                console.log('📦 [OrderTabs] SKUs loaded:', {
                    count: skus.length,
                    skusWithPrice: skusWithPrice.length,
                    skusWithZeroPrice: skusWithZeroPrice.length,
                    sample: skus.slice(0, 5).map(sku => ({
                        sku: sku.sku,
                        productId: sku.productId,
                        price: sku.price,
                        priceType: typeof sku.price,
                        productQuantity: sku.productQuantity
                    })),
                    sampleWithPrice: skusWithPrice.slice(0, 5).map(sku => ({
                        sku: sku.sku,
                        price: sku.price
                    })),
                    sampleZeroPrice: skusWithZeroPrice.slice(0, 5).map(sku => ({
                        sku: sku.sku,
                        price: sku.price
                    }))
                });

                setFirebaseSkus(skus);
                setfirebaseDataLoaded(true);
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error fetching SKUs:', errorMessage);
                Alert.alert('Error', 'Failed to load SKU data. Please check your connection and try again.', [{ text: 'OK' }]);
                setFirebaseSkus([]);
            }
        };

        fetchSkus();
        // Set up polling to refresh SKUs periodically (every 30 seconds)
        // Reduced frequency to minimize API calls while still keeping data fresh
        const intervalId = setInterval(fetchSkus, 30000);
        return () => clearInterval(intervalId);
    }, [currentUser, BASE_URL]); // Removed allOrder to prevent infinite loop

    useEffect(() => {
        if (!currentUser) return;
        
        const fetchData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/products/${currentUser.uid}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || 'Unknown error';
                    console.warn('⚠️ [OrderTabs] Error fetching products:', errorMessage);
                    Alert.alert('Error', 'Failed to fetch products. Please try again.', [{ text: 'OK' }]);
                    setLoader(false);
                    return;
                }

                const result = await response.json();
                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    console.warn('⚠️ [OrderTabs] API returned error:', errorMessage);
                    Alert.alert('Error', result.message || 'Failed to fetch products. Please try again.', [{ text: 'OK' }]);
                    setLoader(false);
                    return;
                }

                const products = result.data || [];
                if (products.length === 0) {
                    Alert.alert('There are no products added kindly add products as well');
                }
                setLoader(false);
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error fetching products:', errorMessage);
                Alert.alert('Error', 'Failed to fetch products. Please check your connection and try again.', [{ text: 'OK' }]);
                setLoader(false);
            }
        };

        fetchData();
    }, [currentUser]);

    useEffect(() => {
        let newTokens = [];

        if (selector.selectedStore?.id) {
            const access_token = selector.selectedStore.user?.token?.access_token;
            const name = selector.selectedStore?.user.seller.data.name;

            newTokens = [{
                access_token: access_token || null,
                storeName: name || null
            }];
        } else {
            newTokens = Array.isArray(selector.access_tokens) ? selector.access_tokens : [];
        }


        // Only update state if value has changed
        const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens);
        if (hasChanged) {
            setAll_access_tokens(newTokens);
        }

    }, [selector]);

    // Update ref when allOrder changes
    useEffect(() => {
        allOrderRef.current = allOrder;
    }, [allOrder]);

    useEffect(() => {
        console.log('[OrderTabs] firebaseProducts changed:', {
            keysCount: Object.keys(memoizedFirebaseProducts || {}).length,
            keys: Object.keys(memoizedFirebaseProducts || {}).slice(0, 10),
            sampleProduct: memoizedFirebaseProducts ? (() => {
                const firstKey = Object.keys(memoizedFirebaseProducts)[0];
                const firstProduct = memoizedFirebaseProducts[firstKey];
                return firstProduct ? {
                    key: firstKey,
                    productName: firstProduct.productName,
                    price: firstProduct.price,
                    hasSku: !!firstProduct.sku,
                    sku: firstProduct.sku
                } : null;
            })() : null
        });
    }, [memoizedFirebaseProducts]);

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.all,
                selected: tabs.find(t => t.title === AppStrings.all)?.selected || false,
            },
            {
                title: AppStrings.shipped,
                selected: tabs.find(t => t.title === AppStrings.shipped)?.selected || false,
            },
            {
                title: AppStrings.failed,
                selected: tabs.find(t => t.title === AppStrings.failed)?.selected || false,
            },

        ]);
    }, []);

    // Refetch orders function - can be called manually or on refresh
    const fetchOrders = async (showLoader = true) => {
        if (!firebaseDataLoaded || !all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) {
            return;
        }

            // Reset all state first
            setFailedOrder([]);
            setFailedOrderCount(0);
            setOrderCount(0);
            setShippedOrderCount(0);
            setShippedOrder([]);
        if (showLoader) {
            setLoader(true);
        }
            setAllOrder([]);
            setITRSOrder([]);

            const createdAfter = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [
                    getDarazOrders(item.access_token, createdAfter, 'shipped'),
                    getDarazOrders(item.access_token, createdAfter, 'failed_delivery'),
                    getDarazOrders(item.access_token, createdAfter, 'shipped_back'),
                ]);
            } else if (all_access_tokens) {
                requests = [
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'shipped'),
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'failed_delivery'),
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'shipped_back'),
                ];
            }

            try {
                // Wait for all requests to complete and collect results
                const results = await Promise.all(requests);
                
                // Aggregate all data before updating state (prevents race conditions)
                let totalOrderCount = 0;
                let totalShippedCount = 0;
                let totalFailedCount = 0;
                const allShippedSkus = [];
                const allFailedSkus = [];
                const allITRSSkus = [];

                results.forEach((result) => {
                    if (!result) return; // Skip failed requests
                    
                    totalOrderCount += result.countTotal || 0;

                    if (result.status === 'shipped') {
                        totalShippedCount += result.countTotal || 0;
                        allShippedSkus.push(...result.skus);
                    } else if (result.status === 'shipped_back') {
                        totalFailedCount += result.countTotal || 0;
                        allFailedSkus.push(...result.skus);
                    } else if (result.status === 'failed_delivery') {
                        totalFailedCount += result.countTotal || 0;
                        allITRSSkus.push(...result.skus);
                    }
                });

                // Update all state at once to prevent race conditions
                setOrderCount(totalOrderCount);
                setShippedOrderCount(totalShippedCount);
                setFailedOrderCount(totalFailedCount);
                
                // Set orders first, then set loader to false
                // This ensures that when loader becomes false, shippedOrder already has data
                setShippedOrder(allShippedSkus);
                setFailedOrder(allFailedSkus);
                setITRSOrder(allITRSSkus);
                
                // Set loader to false AFTER setting orders
                // This ensures the useEffect will run when loader changes from true to false
                if (showLoader) {
                    setLoader(false);
                }

                console.log('✅ [OrderTabs] Orders fetched and state updated:', {
                    totalOrderCount,
                    totalShippedCount,
                    totalFailedCount,
                    shippedSkusCount: allShippedSkus.length,
                    failedSkusCount: allFailedSkus.length,
                    itrsSkusCount: allITRSSkus.length
                });

            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error while fetching orders:', errorMessage);
                Alert.alert('Error', 'Failed to fetch some orders. Please check your connection and try again.', [{ text: 'OK' }]);
                if (showLoader) {
                setLoader(false);
                }
            }
    };

    // Refresh handler for pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        console.log('🔄 [OrderTabs] Refreshing orders...');
        try {
            await fetchOrders(false); // Don't show main loader during refresh
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [all_access_tokens, firebaseDataLoaded]);

    useEffect(() => {
        if (isProcessingFailedRef.current) return; // Prevent concurrent processing
        if (!firebaseDataLoaded || !memoizedFirebaseProducts) return; // Wait for data to be ready
        if (loader) return; // Don't process while fetching
        if ((!failedOrder || failedOrder.length === 0) && (!ITRSOrder || ITRSOrder.length === 0)) return; // Don't process empty data
        
        isProcessingFailedRef.current = true;
        
        console.log('[OrderTabs] Processing failed orders:', {
            failedOrderCount: failedOrder.length,
            ITRSOrderCount: ITRSOrder.length,
            firebaseProductsKeys: Object.keys(memoizedFirebaseProducts || {}).length
        });
        
        const merged = mergeSkuCounts(failedOrder, ITRSOrder);
        console.log('[OrderTabs] Merged failed orders:', {
            mergedCount: merged.length,
            sample: merged.slice(0, 3).map(m => ({
                sku: m.sku,
                productId: m.productId,
                quantity: m.quantity
            }))
        });
        
        const enriched = enrichProductsWithPrices(memoizedFirebaseProducts, merged)

        // Calculate totals using backend API and get enriched items with calculated prices
        const calculateFailedOrdersTotal = async () => {
            try {
                const requestBody = {
                        items: enriched.map(item => ({
                            price: item.unitPrice || item.price,
                            quantity: item.quantity || item.productQuantity,
                            ...item,
                        })),
                };
                
                console.log('📊 [OrderTabs - Failed Orders] Starting calculation...');
                console.log('📤 [OrderTabs - Failed Orders] Request URL:', `${BASE_URL}/api/orders/calculate-totals`);
                console.log('📤 [OrderTabs - Failed Orders] Items count:', requestBody.items.length);
                console.log('📤 [OrderTabs - Failed Orders] Items with price > 0:', requestBody.items.filter(i => (i.unitPrice || i.price) > 0).length);
                console.log('📤 [OrderTabs - Failed Orders] Items with price = 0:', requestBody.items.filter(i => (i.unitPrice || i.price) === 0).length);
                console.log('📤 [OrderTabs - Failed Orders] Sample items:', requestBody.items.slice(0, 3).map(i => ({
                    sku: i.sku,
                    price: i.unitPrice || i.price,
                    quantity: i.quantity || i.productQuantity
                })));
                
                const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                
                console.log('📥 [OrderTabs - Failed Orders] Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [OrderTabs - Failed Orders] Response data:', JSON.stringify(result, null, 2));
                    
                    if (!result.error && result.data) {
                        // Use backend-calculated totals
                        if (result.data.summary) {
                            console.log('💰 [OrderTabs - Failed Orders] Grand total:', result.data.summary.grandTotal);
                            setfailedOrdersTotal(result.data.summary.grandTotal);
                        }
                        // Update enriched items with backend-calculated totalPrice
                        const enrichedWithTotals = enriched.map((item, idx) => {
                            const backendItem = result.data.items?.[idx];
                            return backendItem ? {
                                ...item,
                                totalPrice: backendItem.totalPrice,
                                // Keep unitPrice for display - don't overwrite price with totalPrice
                                price: item.unitPrice || item.price, // Keep unit price for display
                            } : item;
                        });
                        setFailedDeliveries(enrichedWithTotals);
                        return;
                    } else {
                        console.warn('⚠️ [OrderTabs - Failed Orders] Response contains error:', result.error);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.warn('⚠️ [OrderTabs - Failed Orders] HTTP Error:', response.status, errorData);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error calculating failed orders total:', errorMessage);
                if (error?.stack) {
                    console.warn('⚠️ [OrderTabs] Stack:', error.stack);
                }
                // Don't show alert for calculation errors, just log and use default value
            }
            // If API fails, still set items but with 0 total
            console.warn('⚠️ [OrderTabs - Failed Orders] Setting total to 0');
            setfailedOrdersTotal(0);
            setFailedDeliveries(enriched);
        };

        calculateFailedOrdersTotal().finally(() => {
            isProcessingFailedRef.current = false;
        });


    }, [failedOrder, ITRSOrder, firebaseSkus, memoizedFirebaseProducts, firebaseDataLoaded, loader])

    useEffect(() => {
        console.log('[OrderTabs] Shipped orders useEffect triggered:', {
            isProcessing: isProcessingShippedRef.current,
            firebaseDataLoaded,
            hasFirebaseProducts: !!memoizedFirebaseProducts,
            firebaseProductsKeys: Object.keys(memoizedFirebaseProducts || {}).length,
            loader,
            shippedOrderLength: shippedOrder?.length || 0,
            shippedOrderSample: shippedOrder?.slice(0, 3),
            finalShippedOrderLength: finalShippedOrder?.length || 0
        });
        
        if (isProcessingShippedRef.current) {
            console.log('⏸️ [OrderTabs] Skipping shipped orders processing - already processing');
            return; // Prevent concurrent processing
        }
        if (!firebaseDataLoaded || !memoizedFirebaseProducts) {
            console.log('⏸️ [OrderTabs] Skipping shipped orders processing - data not loaded');
            return; // Wait for data to be ready
        }
        if (loader) {
            console.log('⏸️ [OrderTabs] Skipping shipped orders processing - loader is true');
            return; // Don't process while fetching
        }
        if (!shippedOrder || shippedOrder.length === 0) {
            console.log('⏸️ [OrderTabs] Skipping shipped orders processing - no shipped orders');
            // If we have no shipped orders but we previously had data, clear finalShippedOrder
            if (finalShippedOrder && finalShippedOrder.length > 0) {
                console.log('🧹 [OrderTabs] Clearing finalShippedOrder because shippedOrder is now empty');
                setFinalShippedOrder([]);
                setshippedOrdersTotal(0);
            }
            return; // Don't process empty data
        }
        
        console.log('✅ [OrderTabs] Processing shipped orders:', {
            shippedOrderCount: shippedOrder.length,
            firebaseProductsKeys: Object.keys(memoizedFirebaseProducts || {}).length,
            sampleShippedOrder: shippedOrder.slice(0, 3)
        });
        
        const data = enrichProductsWithPrices(memoizedFirebaseProducts, shippedOrder)
        
        console.log('📦 [OrderTabs - Shipped Orders] Enriched data after enrichProductsWithPrices:', {
            dataLength: data.length,
            dataSample: data.slice(0, 3).map(item => ({
                sku: item.sku,
                price: item.price,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                status: item.status,
                productName: item.productName
            }))
        });
        
        if (!data || data.length === 0) {
            console.warn('⚠️ [OrderTabs - Shipped Orders] No enriched data, setting empty array');
            setFinalShippedOrder([]);
            setshippedOrdersTotal(0);
            isProcessingShippedRef.current = false;
            return;
        }

        // Calculate totals using backend API and get enriched items with calculated prices
        const calculateShippedOrdersTotal = async () => {
            try {
                const requestBody = {
                        items: data.map(item => ({
                            price: item.unitPrice || item.price,
                            quantity: item.quantity || item.productQuantity,
                            ...item,
                        })),
                };
                
                console.log('📊 [OrderTabs - Shipped Orders] Starting calculation...');
                console.log('📤 [OrderTabs - Shipped Orders] Items count:', requestBody.items.length);
                console.log('📤 [OrderTabs - Shipped Orders] Items with price > 0:', requestBody.items.filter(i => (i.unitPrice || i.price) > 0).length);
                console.log('📤 [OrderTabs - Shipped Orders] Items with price = 0:', requestBody.items.filter(i => (i.unitPrice || i.price) === 0).length);
                
                const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                
                console.log('📥 [OrderTabs - Shipped Orders] Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [OrderTabs - Shipped Orders] Response data:', JSON.stringify(result, null, 2));
                    
                    if (!result.error && result.data) {
                        // Use backend-calculated totals
                        if (result.data.summary) {
                            console.log('💰 [OrderTabs - Shipped Orders] Grand total:', result.data.summary.grandTotal);
                            setshippedOrdersTotal(result.data.summary.grandTotal);
                        }
                        // Update items with backend-calculated totalPrice
                        const enrichedWithTotals = data.map((item, idx) => {
                            const backendItem = result.data.items?.[idx];
                            return backendItem ? {
                                ...item,
                                totalPrice: backendItem.totalPrice,
                                // Keep unitPrice for display - don't overwrite price with totalPrice
                                price: item.unitPrice || item.price, // Keep unit price for display
                            } : item;
                        });
                        console.log('✅ [OrderTabs - Shipped Orders] Setting finalShippedOrder with', enrichedWithTotals.length, 'items');
                        setFinalShippedOrder(enrichedWithTotals);
                        isProcessingShippedRef.current = false;
                        return;
                    } else {
                        console.warn('⚠️ [OrderTabs - Shipped Orders] Response contains error:', result.error);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.warn('⚠️ [OrderTabs - Shipped Orders] HTTP Error:', response.status, errorData);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error calculating shipped orders total:', errorMessage);
                if (error?.stack) {
                    console.warn('⚠️ [OrderTabs] Stack:', error.stack);
                }
                // Don't show alert for calculation errors, just log and use default value
            }
            // If API fails, still set items but with 0 total
            console.warn('⚠️ [OrderTabs - Shipped Orders] API failed, setting items with 0 total');
            console.log('📦 [OrderTabs - Shipped Orders] Data to set:', {
                dataLength: data.length,
                sample: data.slice(0, 3).map(item => ({
                    sku: item.sku,
                    price: item.price,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    status: item.status
                }))
            });
            setshippedOrdersTotal(0);
            setFinalShippedOrder(data);
            console.log('✅ [OrderTabs - Shipped Orders] finalShippedOrder set with', data.length, 'items');
        };

        isProcessingShippedRef.current = true;
        calculateShippedOrdersTotal().finally(() => {
            isProcessingShippedRef.current = false;
            console.log('✅ [OrderTabs - Shipped Orders] Processing complete');
        });
    }, [shippedOrder, firebaseSkus, memoizedFirebaseProducts, firebaseDataLoaded, loader])

    // Debug: Log when finalShippedOrder changes
    useEffect(() => {
        console.log('🔍 [OrderTabs] finalShippedOrder state changed:', {
            length: finalShippedOrder?.length || 0,
            sample: finalShippedOrder?.slice(0, 3).map(item => ({
                sku: item.sku,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }, [finalShippedOrder]);

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.all,
                totalOrders: allOrderCount,
                selected: true
            },
            {
                title: AppStrings.shipped,
                totalOrders: shippedOrderCount,
            },
            {
                title: AppStrings.failed,
                totalOrders: failedOrderCount,
            },

        ]);
    }, [shippedOrderCount, allOrderCount, failedOrdersTotal]);



    useEffect(() => {
        if (isProcessingAllRef.current) return; // Prevent concurrent processing
        if (!firebaseDataLoaded || !memoizedFirebaseProducts) return; // Wait for data to be ready
        if (loader) return; // Don't process while fetching
        if (!shippedOrder || !failedDeliveries) return; // Guard against missing data
        if ((!shippedOrder || shippedOrder.length === 0) && (!failedDeliveries || failedDeliveries.length === 0)) return; // Don't process empty data
        
        isProcessingAllRef.current = true;
        
        console.log('[OrderTabs] Processing all orders:', {
            shippedOrderCount: shippedOrder.length,
            failedDeliveriesCount: failedDeliveries.length,
            firebaseProductsKeys: Object.keys(memoizedFirebaseProducts || {}).length,
            firebaseSkusCount: firebaseSkus.length
        });

        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);
        console.log('[OrderTabs] Merged all orders:', {
            mergedCount: merged.length,
            sample: merged.slice(0, 3).map(m => ({
                sku: m.sku,
                productId: m.productId,
                quantity: m.quantity
            }))
        });

        const enriched = enrichProductsWithPrices(memoizedFirebaseProducts, merged);
        
        // Calculate totals using backend API and get enriched items with calculated prices
        const calculateAllOrdersTotal = async () => {
            try {
                const requestBody = {
                        items: enriched.map(item => ({
                            price: item.unitPrice || item.price,
                            quantity: item.quantity || item.productQuantity,
                            ...item,
                        })),
                };
                
                console.log('📊 [OrderTabs - All Orders] Starting calculation...');
                console.log('📤 [OrderTabs - All Orders] Items count:', requestBody.items.length);
                console.log('📤 [OrderTabs - All Orders] Items with price > 0:', requestBody.items.filter(i => (i.unitPrice || i.price) > 0).length);
                console.log('📤 [OrderTabs - All Orders] Items with price = 0:', requestBody.items.filter(i => (i.unitPrice || i.price) === 0).length);
                console.log('📤 [OrderTabs - All Orders] Sample items:', requestBody.items.slice(0, 3).map(i => ({
                    sku: i.sku,
                    price: i.unitPrice || i.price,
                    quantity: i.quantity || i.productQuantity
                })));
                
                const response = await fetch(`${BASE_URL}/api/orders/calculate-totals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                
                console.log('📥 [OrderTabs - All Orders] Response status:', response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ [OrderTabs - All Orders] Response data:', JSON.stringify(result, null, 2));
                    
                    if (!result.error && result.data) {
                        // Use backend-calculated totals
                        if (result.data.summary) {
                            console.log('💰 [OrderTabs - All Orders] Grand total:', result.data.summary.grandTotal);
                            console.log('✅ [OrderTabs - All Orders] Setting allOrdersTotal to:', result.data.summary.grandTotal);
                            setAllOrdersTotal(result.data.summary.grandTotal);
                        }
                        // Update enriched items with backend-calculated totalPrice
                        const enrichedWithTotals = enriched.map((item, idx) => {
                            const backendItem = result.data.items?.[idx];
                            return backendItem ? {
                                ...item,
                                totalPrice: backendItem.totalPrice,
                                // Keep unitPrice for display - don't overwrite price with totalPrice
                                price: item.unitPrice || item.price, // Keep unit price for display
                            } : item;
                        });
                        setAllOrder(enrichedWithTotals);
                        allOrderRef.current = enrichedWithTotals; // Update ref
                        isProcessingAllRef.current = false;
                        return;
                    } else {
                        console.warn('⚠️ [OrderTabs - All Orders] Response contains error:', result.error);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.warn('⚠️ [OrderTabs - All Orders] HTTP Error:', response.status, errorData);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderTabs] Error calculating all orders total:', errorMessage);
                if (error?.stack) {
                    console.warn('⚠️ [OrderTabs] Stack:', error.stack);
                }
                // Don't show alert for calculation errors, just log and use default value
            }
            // If API fails, still set items but with 0 total
            console.warn('⚠️ [OrderTabs - All Orders] Setting total to 0');
            setAllOrdersTotal(0);
            setAllOrder(enriched);
            allOrderRef.current = enriched; // Update ref
            isProcessingAllRef.current = false;
        };

        calculateAllOrdersTotal();
    }, [shippedOrder, failedDeliveries, firebaseSkus, memoizedFirebaseProducts, firebaseDataLoaded, loader])

  
    //This function gets the price of any sku
    const getQuantitybySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.productQuantity : 0; // returns null if not found
    };

    //This function gets the price of any sku
    const getIdbySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        const productId = found ? found.productId : 0;
        
        if (!found) {
            console.log(`[getIdbySku] SKU ${targetSku} not found in firebaseSkus`, {
                targetSku,
                firebaseSkusCount: firebaseSkus.length,
                availableSkus: firebaseSkus.slice(0, 5).map(s => s.sku)
            });
        } else if (!productId || productId === 0) {
            console.log(`[getIdbySku] SKU ${targetSku} found but productId is invalid`, {
                targetSku,
                found: {
                    sku: found.sku,
                    productId: found.productId,
                    price: found.price
                }
            });
        }
        
        return productId; // returns 0 if not found
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

        const result = Object.entries(skuCount).map(([sku, quantity]) => {
            const productId = getIdbySku(firebaseSkus, sku);
            const productQuantity = getQuantitybySku(firebaseSkus, sku);
            
            if (!productId || productId === 0) {
                console.log(`[countSkusFromOrders] SKU ${sku} has no productId in firebaseSkus`, {
                    sku,
                    firebaseSkusHasSku: firebaseSkus.some(s => s.sku === sku),
                    firebaseSkusCount: firebaseSkus.length
                });
            }
            
            return {
            sku,
            quantity,
                productQuantity,
                productId,
            };
        });

        console.log('[countSkusFromOrders] Result:', {
            totalSkus: result.length,
            skusWithProductId: result.filter(r => r.productId && r.productId !== 0).length,
            skusWithoutProductId: result.filter(r => !r.productId || r.productId === 0).map(r => r.sku),
            sample: result.slice(0, 5)
        });

        return result;
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
        const result = Object.entries(combined).map(([sku, quantity]) => {
            const productId = getIdbySku(firebaseSkus, sku);
            const productQuantity = getQuantitybySku(firebaseSkus, sku);
            
            return {
            sku,
            quantity,
                productQuantity,
                productId,
            };
        });

        console.log('[mergeSkuCounts] Result:', {
            totalSkus: result.length,
            skusWithProductId: result.filter(r => r.productId && r.productId !== 0).length,
            skusWithoutProductId: result.filter(r => !r.productId || r.productId === 0).map(r => r.sku),
            sample: result.slice(0, 5)
        });

        return result;
    }

    // this function get the orders from daraz api, orders with different statuses
    const getDarazOrders = async (access_token, createdAfterISO, status) => {
        try {
            const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // Return data instead of updating state directly to avoid race conditions
            return {
                status,
                countTotal: data.countTotal,
                orderItems: data.orderItems || [],
                skus: countSkusFromOrders(data.orderItems)
            };

        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            console.warn('⚠️ [OrderTabs] Error fetching Daraz orders:', errorMessage);
            // Return null instead of updating state
            return null;
        }
    };

    //This function toggle tabs between shipped, failed etc
    const toggleTabs = (index) => {
        setTabs(prevTabs =>
            prevTabs.map((tab, i) => ({
                ...tab,
                selected: i === index
            }))
        );
    };


    const enrichProductsWithPrices = (firebaseProducts, items) => {
        if (!firebaseProducts || !items || !Array.isArray(items)) {
            console.log('[enrichProductsWithPrices] Early return:', {
                hasFirebaseProducts: !!firebaseProducts,
                hasItems: !!items,
                isArray: Array.isArray(items)
            });
            return [];
        }

        console.log('[enrichProductsWithPrices] Starting enrichment:', {
            firebaseProductsKeys: Object.keys(firebaseProducts || {}).length,
            itemsCount: items.length,
            firebaseSkusCount: firebaseSkus.length
        });

        // Create a lookup map: productId -> product, and also SKU -> product if products have SKU field
        const productByIdMap = {};
        const productBySkuMap = {};
        
        // Build lookup maps from firebaseProducts
        Object.entries(firebaseProducts).forEach(([key, product]: [string, any]) => {
            productByIdMap[key] = product;
            // If product has a SKU field, also index by SKU
            if (product?.sku) {
                productBySkuMap[product.sku] = product;
            }
        });

        console.log('[enrichProductsWithPrices] Lookup maps created:', {
            productByIdMapKeys: Object.keys(productByIdMap).length,
            productBySkuMapKeys: Object.keys(productBySkuMap).length,
            sampleProductIds: Object.keys(productByIdMap).slice(0, 5),
            sampleSkus: Object.keys(productBySkuMap).slice(0, 5)
        });

        // Log firebaseSkus structure
        console.log('[enrichProductsWithPrices] firebaseSkus sample:', {
            count: firebaseSkus.length,
            sample: firebaseSkus.slice(0, 3).map(sku => ({
                sku: sku.sku,
                productId: sku.productId,
                price: sku.price
            }))
        });

        const results = items.map((item, index) => {
            let product = null;
            const lookupSteps = [];
            
            // First try to find by productId
            if (item.productId && item.productId !== 0) {
                product = productByIdMap[item.productId];
                lookupSteps.push(`productId lookup: ${item.productId} -> ${product ? 'FOUND' : 'NOT FOUND'}`);
            } else {
                lookupSteps.push(`productId lookup: SKIPPED (productId: ${item.productId})`);
            }
            
            // If not found by productId, try to find by SKU
            if (!product && item.sku) {
                // Try direct SKU lookup
                product = productBySkuMap[item.sku];
                lookupSteps.push(`SKU direct lookup: ${item.sku} -> ${product ? 'FOUND' : 'NOT FOUND'}`);
                
                // If still not found, try to find productId from firebaseSkus and then lookup
                if (!product && firebaseSkus.length > 0) {
                    const skuItem = firebaseSkus.find(sku => sku.sku === item.sku);
                    if (skuItem) {
                        lookupSteps.push(`firebaseSkus found: sku=${skuItem.sku}, productId=${skuItem.productId}`);
                        if (skuItem.productId && skuItem.productId !== 0) {
                            product = productByIdMap[skuItem.productId];
                            lookupSteps.push(`productId from firebaseSkus lookup: ${skuItem.productId} -> ${product ? 'FOUND' : 'NOT FOUND'}`);
                        } else {
                            lookupSteps.push(`productId from firebaseSkus: INVALID (${skuItem.productId})`);
                        }
                    } else {
                        lookupSteps.push(`firebaseSkus: SKU ${item.sku} NOT FOUND in firebaseSkus`);
                    }
                } else {
                    lookupSteps.push(`firebaseSkus: EMPTY or already found product`);
                }
            } else if (!item.sku) {
                lookupSteps.push(`SKU lookup: SKIPPED (no SKU in item)`);
            }

            // Log detailed info for first few items, items that fail, or specific SKUs we're debugging
            const shouldLog = index < 3 || !product || item.sku === 'moringa-500gram';
            if (shouldLog) {
                const skuItem = item.sku && firebaseSkus ? firebaseSkus.find(sku => sku.sku === item.sku) : null;
                
                // Calculate final price using same logic as below
                let finalPrice = 0;
                if (skuItem && skuItem.price !== undefined && skuItem.price !== null) {
                    const skuPrice = parseFloat(skuItem.price);
                    if (!isNaN(skuPrice)) {
                        finalPrice = skuPrice;
                    }
                }
                if (finalPrice === 0 && product && product.price !== undefined && product.price !== null) {
                    const productPrice = parseFloat(product.price);
                    if (!isNaN(productPrice)) {
                        finalPrice = productPrice;
                    }
                }
                
                console.log(`[enrichProductsWithPrices] Item ${index} (SKU: ${item.sku}):`, {
                    item: {
                        sku: item.sku,
                        productId: item.productId,
                        quantity: item.quantity,
                        productQuantity: item.productQuantity
                    },
                    lookupSteps,
                    productFound: !!product,
                    product: product ? {
                        productId: Object.keys(firebaseProducts).find(key => firebaseProducts[key] === product),
                        productName: product.productName,
                        price: product.price,
                        priceType: typeof product.price,
                        hasSku: !!product.sku
                    } : null,
                    skuFromFirebaseSkus: skuItem ? {
                        sku: skuItem.sku,
                        price: skuItem.price,
                        priceType: typeof skuItem.price,
                        productId: skuItem.productId
                    } : null,
                    finalPrice: finalPrice,
                    priceSource: skuItem && skuItem.price !== undefined && skuItem.price !== null ? 'firebaseSkus' : (product && product.price !== undefined && product.price !== null ? 'firebaseProducts' : 'none')
                });
            }

            if (!product) {
                return {
                    ...item,
                    productName: null,
                    unitPrice: null,
                    totalPrice: 0,
                    status: false
                };
            }

            // Priority: Use SKU price from firebaseSkus if available, otherwise use product price
            let price = 0;
            
            // First, try to get price from firebaseSkus (SKU-specific price takes priority)
            if (item.sku && firebaseSkus && firebaseSkus.length > 0) {
                const skuItem = firebaseSkus.find(sku => sku.sku === item.sku);
                console.log(`[enrichProductsWithPrices] Price lookup for SKU ${item.sku}:`, {
                    skuItemFound: !!skuItem,
                    skuItemPrice: skuItem?.price,
                    skuItemPriceType: typeof skuItem?.price,
                    firebaseSkusLength: firebaseSkus.length,
                    sampleSkus: firebaseSkus.slice(0, 3).map(s => ({ sku: s.sku, price: s.price }))
                });
                
                if (skuItem && skuItem.price !== undefined && skuItem.price !== null) {
                    const skuPrice = parseFloat(skuItem.price);
                    if (!isNaN(skuPrice)) {
                        price = skuPrice;
                        console.log(`✅ [enrichProductsWithPrices] Using SKU price for ${item.sku}: ${price}`);
                    } else {
                        console.warn(`⚠️ [enrichProductsWithPrices] SKU price is NaN for ${item.sku}:`, skuItem.price);
                    }
                } else {
                    console.log(`ℹ️ [enrichProductsWithPrices] No SKU price found for ${item.sku}`, {
                        skuItemExists: !!skuItem,
                        priceUndefined: skuItem?.price === undefined,
                        priceNull: skuItem?.price === null
                    });
                }
            } else {
                console.log(`ℹ️ [enrichProductsWithPrices] Skipping SKU price lookup for ${item.sku}:`, {
                    hasSku: !!item.sku,
                    hasFirebaseSkus: !!firebaseSkus,
                    firebaseSkusLength: firebaseSkus?.length || 0
                });
            }
            
            // If no SKU price found, fall back to product price
            if (price === 0 && product.price !== undefined && product.price !== null) {
                const productPrice = parseFloat(product.price);
                if (!isNaN(productPrice)) {
                    price = productPrice;
                    console.log(`✅ [enrichProductsWithPrices] Using product price for ${item.sku}: ${price}`);
                } else {
                    console.warn(`⚠️ [enrichProductsWithPrices] Product price is NaN for ${item.sku}:`, product.price);
                }
            } else if (price === 0) {
                console.warn(`⚠️ [enrichProductsWithPrices] No price found for ${item.sku} - price will be 0`, {
                    productPriceUndefined: product.price === undefined,
                    productPriceNull: product.price === null,
                    productPrice: product.price
                });
            }
            
            // Backend will calculate total price, we just pass unit price
            return {
                ...item,
                productName: product.productName || '',
                unitPrice: price,
                price: price, // Unit price only - backend calculates total
                status: true
            };
        });

        const foundCount = results.filter(r => r.status).length;
        const notFoundCount = results.filter(r => !r.status).length;
        const itemsWithPrice = results.filter(r => r.price > 0).length;
        const itemsWithZeroPrice = results.filter(r => r.price === 0).length;
        
        console.log('📊 [enrichProductsWithPrices] Enrichment complete:', {
            total: results.length,
            found: foundCount,
            notFound: notFoundCount,
            itemsWithPrice: itemsWithPrice,
            itemsWithZeroPrice: itemsWithZeroPrice,
            notFoundSkus: results.filter(r => !r.status).map(r => r.sku).slice(0, 10),
            zeroPriceSkus: results.filter(r => r.status && r.price === 0).map(r => r.sku).slice(0, 10),
            sampleResults: results.slice(0, 5).map(r => ({
                sku: r.sku,
                price: r.price,
                unitPrice: r.unitPrice,
                status: r.status,
                productName: r.productName
            }))
        });

        return results;
    };
    return (

        <View style={{ flex: 1 }}>
            {loader ?
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size={'large'} color={theme.primaryOrange}></ActivityIndicator>
                </View>
                :
                <View style={{ rowGap: 16, flex: 1 }}>
                    <View style={styles.container}>
                        {tabs.map((item, index) => (
                            <TouchableOpacity onPress={() => { toggleTabs(index) }} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? theme.primaryOrange : theme.black25, borderRadius: 16, paddingVertical: 4, flexDirection: 'row', columnGap: 4 }} key={index}>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: item.selected ? theme.white : theme.black50, textAlign: 'center', }}>{item.title}</TextComp>
                                <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.white, borderRadius: 100, padding: 4 }}>
                                    <TextComp size={8} style={{ fontFamily: FontFamilty.semibold, color: item.selected ? theme.primaryOrange : theme.black, textAlignVertical: 'center' }}>{item.totalOrders}</TextComp>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {tabs[0]?.selected && (

                        <View style={{ backgroundColor: theme.card, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={{ paddingBottom: 24 }} 
                                style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={theme.primaryOrange}
                                        colors={[theme.primaryOrange]}
                                    />
                                }
                            >
                                {allOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? theme.textPrimary : theme.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.totalPrice || item.price || 0}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'right' }}>  {parseFloat(allOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}

                    {tabs[1]?.selected && (
                        (() => {
                            console.log('🔍 [OrderTabs] Rendering shipped tab:', {
                                finalShippedOrderLength: finalShippedOrder?.length || 0,
                                shippedOrderLength: shippedOrder?.length || 0,
                                loader,
                                firebaseDataLoaded
                            });
                            return null;
                        })(),
                        <View style={{ backgroundColor: theme.card, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={{ paddingBottom: 24 }} 
                                style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={theme.primaryOrange}
                                        colors={[theme.primaryOrange]}
                                    />
                                }
                            >
                                {finalShippedOrder && finalShippedOrder.length > 0 ? (
                                    finalShippedOrder.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {
                                        console.log(item);

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? theme.textPrimary : theme.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.totalPrice || item.price || 0}</TextComp>
                                    </View>

                                    </View>)
                                ) : (
                                    <View style={{ padding: 16, alignItems: 'center' }}>
                                        <TextComp size={14} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary }}>
                                            {loader ? 'Loading shipped orders...' : 'No shipped orders found'}
                                        </TextComp>
                                        {!loader && (
                                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, marginTop: 8 }}>
                                                Debug: finalShippedOrder={finalShippedOrder?.length || 0}, shippedOrder={shippedOrder?.length || 0}
                                            </TextComp>
                                        )}
                                    </View>
                                )}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'right' }}>{parseFloat(shippedOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}


                    {tabs[2]?.selected && (

                        <View style={{ backgroundColor: theme.card, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView 
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={{ paddingBottom: 24 }} 
                                style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={theme.primaryOrange}
                                        colors={[theme.primaryOrange]}
                                    />
                                }
                            >
                                {failedDeliveries?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => {
                                        console.log(item);

                                        setmodalVisible(true)
                                        setSelectedSku(item)
                                    }}>
                                        <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? theme.textPrimary : theme.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline' }}>{item.sku}</TextComp>

                                    </TouchableOpacity>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textPrimary, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.textSecondary, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.totalPrice || item.price || 0}</TextComp>
                                    </View>

                                </View>)}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: theme.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.white, textAlign: 'right' }}>{parseFloat(failedOrdersTotal).toFixed(2)}</TextComp>
                                </View>
                            </View>
                        </View>
                    )}

                   
                </View>}

            {modalVisible && (
                <SkuLinking setIsvisible={setmodalVisible} selectedSku={selectedSku} />
            )}

        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        columnGap: 8
    },

});

export default OrderTabs;


