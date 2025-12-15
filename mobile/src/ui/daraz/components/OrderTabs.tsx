import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { ref, onValue, off, get } from 'firebase/database';
import { auth, database } from '../../../../firebase';
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
    const skuRef = ref(database, `users/${currentUser?.uid}/skusList`);
    const productRef = ref(database, `users/${currentUser?.uid}/products`);
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

    // Initialize Firebase products listener
    useEffect(() => {
        if (!currentUser) return;
        
        console.log('[OrderTabs] Starting Firebase products listener');
        startFirebaseListener(dispatch);
        
        return () => {
            // Cleanup if needed
        };
    }, [currentUser, dispatch]);

    useEffect(() => {
        if (!currentUser) return;
        
        const unsubscribe = onValue(skuRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const array = Object.entries(data).map(([id, value]: [string, any]) => ({
                    id,
                    ...value,
                }));

                console.log('[OrderTabs] firebaseSkus loaded:', {
                    count: array.length,
                    sample: array.slice(0, 5).map(sku => ({
                        sku: sku.sku,
                        productId: sku.productId,
                        price: sku.price,
                        productQuantity: sku.productQuantity
                    }))
                });

                setFirebaseSkus(array);
                setfirebaseDataLoaded(true)
                addAdditionalSkus(array, allOrder)
            } else {
                console.log('[OrderTabs] firebaseSkus: No data found');
                saveSkusAsArrayWithPriceZero(allOrder);
                setFirebaseSkus([]);
            }
        }, (error) => {
            console.error('Error fetching data:', error);
            setLoader(false);
        });

        // 🔴 IMPORTANT: detach listener on unmount to prevent memory leaks
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        
        const fetchData = async () => {
            try {
                const snapshot = await get(productRef);
                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]: [string, any]) => ({
                        id,
                        ...value,
                    }));
                    // console.log(array);
                } else {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoader(false);
            }
        };

        fetchData();

        // No need to return cleanup for `.once()`
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

    useEffect(() => {
        console.log('[OrderTabs] firebaseProducts changed:', {
            keysCount: Object.keys(selector.firebaseProducts || {}).length,
            keys: Object.keys(selector.firebaseProducts || {}).slice(0, 10),
            sampleProduct: selector.firebaseProducts ? (() => {
                const firstKey = Object.keys(selector.firebaseProducts)[0];
                const firstProduct = selector.firebaseProducts[firstKey];
                return firstProduct ? {
                    key: firstKey,
                    productName: firstProduct.productName,
                    price: firstProduct.price,
                    hasSku: !!firstProduct.sku,
                    sku: firstProduct.sku
                } : null;
            })() : null
        });
    }, [selector.firebaseProducts]);

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

    useEffect(() => {
        if (!firebaseDataLoaded || !all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        const fetchOrders = async () => {

            setFailedOrder([]);
            setFailedOrderCount(0);
            setOrderCount(0);
            setShippedOrderCount(0);
            setShippedOrder([])
            setLoader(true);
            setAllOrder([])
            setITRSOrder([])

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
            } else {

            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
            } catch (error) {
                console.error('Error while fetching orders:', error);
            } finally {
                setLoader(false);

            }
        };

        fetchOrders();
    }, [all_access_tokens, firebaseDataLoaded]);

    useEffect(() => {
        console.log('[OrderTabs] Processing failed orders:', {
            failedOrderCount: failedOrder.length,
            ITRSOrderCount: ITRSOrder.length,
            firebaseProductsKeys: Object.keys(selector.firebaseProducts || {}).length
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
        
        const enriched = enrichProductsWithPrices(selector.firebaseProducts, merged)

        setfailedOrdersTotal(enriched.reduce((sum, item) => {
            return sum + (item.unitPrice * item.quantity);
        }, 0));

        const total = enriched.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          setfailedOrdersTotal(total)

        setFailedDeliveries(enriched)


    }, [failedOrder, ITRSOrder, firebaseSkus, selector.firebaseProducts])

    useEffect(() => {
        console.log('[OrderTabs] Processing shipped orders:', {
            shippedOrderCount: shippedOrder.length,
            firebaseProductsKeys: Object.keys(selector.firebaseProducts || {}).length
        });
        
        const data = enrichProductsWithPrices(selector.firebaseProducts, shippedOrder)

        const total = data.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          setshippedOrdersTotal(total)
        setFinalShippedOrder(data)
    }, [shippedOrder, firebaseSkus, selector.firebaseProducts])

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
        console.log('[OrderTabs] Processing all orders:', {
            shippedOrderCount: shippedOrder.length,
            failedDeliveriesCount: failedDeliveries.length,
            firebaseProductsKeys: Object.keys(selector.firebaseProducts || {}).length,
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

        const enriched = enrichProductsWithPrices(selector.firebaseProducts, merged)

        setAllOrder(enriched)
        console.log('[OrderTabs] Enriched all orders sample:', enriched[0]);
        
   
        const total = enriched.reduce((sum, item) => {
            const unitTotal = typeof item.price === 'number' && typeof item.quantity === 'number'
              ? item.price * item.quantity
              : 0;
            return sum + unitTotal;
          }, 0);
          
          console.log('Total:', total);
          setAllOrdersTotal(total)
    }, [shippedOrder, failedDeliveries, firebaseSkus, selector.firebaseProducts])

    // This function saves the sku to firebase initially when there is no order
    const saveSkusAsArrayWithPriceZero = async (skuArray) => {
        try {

            if (!currentUser) {
                console.warn('User not authenticated');
                return;
            }


            const cleanedSkus = {};
            skuArray.forEach(item => {
                cleanedSkus[item.sku] = {
                    sku: item.sku,
                    price: 0,
                };
            });

            await ref(getDatabase(), `users/${currentUser.uid}/skusList`)
                .set(cleanedSkus);



        } catch (error) {
            console.error('Error saving SKUs:', error);
        }
    };

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.price : 0; // returns null if not found
    }
    //This function gets the price of any sku
    const getQuantitybySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.productQuantity : 0; // returns null if not found
    }

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

            setOrderCount(prev => prev + data.countTotal);

            if (status == 'shipped') {
                setShippedOrderCount(prev => prev + data.countTotal)
                setShippedOrder(prev => [...prev, ...countSkusFromOrders(data.orderItems)]);
            } else {
                if (status == 'shipped_back') {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setFailedOrder(prev => [...prev, ...newFailedOrders])
                    setFailedOrderCount(prev => prev + data.countTotal);
                } else {
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setITRSOrder(prev => [...prev, ...newFailedOrders])
                    setFailedOrderCount(prev => prev + data.countTotal);
                }
            }

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
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

    //This function checks the skus on firebase and then compare it with all orders coming from daraz apis. Then it adds the missing skus to firebase
    const addAdditionalSkus = (existing, newskus) => {
        // Step 1: Get list of existing SKUs (case-insensitive match)
        const existingSkus = existing.map(item => item?.sku?.trim());

        // Step 2: Filter only those new SKUs that are NOT in existing list
        const missingSkus = newskus.filter(item =>
            !existingSkus.includes(item?.sku?.trim())
        );

        if (missingSkus.length === 0) {
            console.log('no missing skus');
            return;
        }

        // Step 3: Convert to object with custom keys (e.g., using the SKU itself)
        const skusToSave = {};
        missingSkus.forEach(item => {
            skusToSave[item.sku] = {
                sku: item.sku,
                price: 0
            };
        });

        // Step 4: Save them to Firebase under existing list
        const userSkuListRef = ref(getDatabase(), `users/${currentUser.uid}/skusList`);
        userSkuListRef.update(skusToSave)
            .then(() => console.log('Missing SKUs saved to Firebase'))
            .catch(err => console.error('Error saving new SKUs:', err));
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

            // Log detailed info for first few items or items that fail
            if (index < 3 || !product) {
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
                        hasSku: !!product.sku
                    } : null
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

            const price = parseFloat(product.price || '0');
            return {
                ...item,
                productName: product.productName || '',
                unitPrice: price,
                price: price * item.productQuantity,
                status: true
            };
        });

        const foundCount = results.filter(r => r.status).length;
        const notFoundCount = results.filter(r => !r.status).length;
        console.log('[enrichProductsWithPrices] Enrichment complete:', {
            total: results.length,
            found: foundCount,
            notFound: notFoundCount,
            notFoundSkus: results.filter(r => !r.status).map(r => r.sku).slice(0, 10)
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

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
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
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
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

                        <View style={{ backgroundColor: theme.card, elevation: 10, borderRadius: 4, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: theme.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                                {finalShippedOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
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
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
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

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
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
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: theme.textPrimary, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
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

                    {/* {tabs[3]?.selected && (

                        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                            </View>

                            <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                                {orders.returned.orders.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                    <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: item.status ? AppColors.black : AppColors.primaryOrange, textDecorationLine: item.status ? 'normal' : 'underline', flex: 2, }}>{item.sku}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                                    </View>

                                </View>)}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                                <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{orders.returned.totalPrice}</TextComp>
                                </View>
                            </View>
                        </View>
                    )} */}
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


