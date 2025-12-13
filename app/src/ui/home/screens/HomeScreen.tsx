import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import HomeHeader from '../components/HomeHeader';
import SelectStore from '../../components/SelectStore';
import TotalBusinessComp from '../../components/TotalBusinessComp';
import IndividualValueComp from '../../components/IndividualValueComp';
import { AppStrings } from '../../../constants/AppStrings';
import { AppScreens } from '../../../constants/AppScreens';
import { getAuth } from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { getDatabase, ref } from '@react-native-firebase/database';
import IndividualDataComp from '../../components/IndividualDataComp';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import { getDarazDeliveredOrders, getDarazFailedOrders } from '../../../utils/api/getDarazDeliveredOrders';
import { setTodayDeliveredOrders } from '../../../redux/AppReducer';
import { getBaseUrl } from '../../../utils/api/baseUrl';


const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl();
    console.log(BASE_URL,'BASE_URL');
    

    const navigateDaraz = () => {
        navigation.navigate(AppScreens.DarazScreen)
    }
    const navigateCash = () => {
        navigation.navigate(AppScreens.CashScreen)
    }
    const navigateStock = () => {
        navigation.navigate(AppScreens.StockScreen)
    }
    const navigatePackaging = () => {
        navigation.navigate(AppScreens.PackagingScreen)
    }
    const navigateSettings = () => {
        navigation.navigate(AppScreens.Settings)
    }

    const dispatch=useDispatch()
    const [reloadScreen, setReloadScreen] = useState(false)
    const auth = getAuth()
    const currentUser = auth.currentUser
    const selector = useSelector(state => state.AppReducer);
    const [shippedOrder, setShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])
    const skuRef = ref(getDatabase(), `users/${currentUser.uid}/skusList`);
    const productRef = ref(getDatabase(), `users/${currentUser.uid}/products`);
    const [failedDeliveries, setFailedDeliveries] = useState([])
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [firebaseSkus, setFirebaseSkus] = useState([])
    const [darazLoader, setDarazLoader] = useState(false)
    const [allOrdersTotal, setAllOrdersTotal] = useState(0)
    const [firebaseDataLoaded, setfirebaseDataLoaded] = useState(false)
    const [screenloader, setScreenloader] = useState(false)

    const [failedOrders,setFailedOrders]=useState([])


    useEffect(() => {
        const listener = skuRef.on('value', snapshot => {
            const data = snapshot.val();

            if (data) {
                const array = Object.entries(data).map(([id, value]) => ({
                    id,
                    ...value,
                }));

                setFirebaseSkus(array);
                setfirebaseDataLoaded(true)
            } else {
                setFirebaseSkus([]);
            }
        }, error => {
            console.error('Error fetching data:', error);
            setDarazLoader(false);
            setScreenloader(false)

        });

        // 🔴 IMPORTANT: detach listener on unmount to prevent memory leaks
        return () => skuRef.off('value', listener);
    }, [reloadScreen]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const snapshot = await productRef.once('value');
                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));
                } else {
                    Alert.alert('There are no products added kindly add products as well');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setDarazLoader(false);

            }
        };

        fetchData();

        // No need to return cleanup for `.once()`
    }, [reloadScreen]);

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
                console.log('🔄 [HOME SCREEN] Fetching for', all_access_tokens.length, 'stores');
                requests = all_access_tokens.flatMap(item => [
                    getDarazOrders(item.access_token, createdAfter, 'shipped'),
                    getFailedOrders(item.access_token, todayISO, 'shipped_back_success'), // Today only - uses update_after
                ]);
            } else if (all_access_tokens) {
                console.log('🔄 [HOME SCREEN] Fetching for single store');
                requests = [
                    getDarazOrders(all_access_tokens[0].access_token, createdAfter, 'shipped'),
                    getFailedOrders(all_access_tokens[0].access_token, todayISO, 'shipped_back_success'), // Today only - uses update_after
                ];
            } else {
                console.log('⚠️ [HOME SCREEN] No access tokens available');
            }

            try {
                await Promise.all(requests); // Wait for all async tasks to complete
                console.log('✅ [HOME SCREEN] All order fetches completed');
            } catch (error) {
                console.error('❌ [HOME SCREEN] Error while fetching orders:', error);
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
        const merged = mergeSkuCounts(shippedOrder, failedDeliveries);

        const enriched = merged.map(item => {
            const price = getPriceBySku(firebaseSkus, item.sku)
            return {
                ...item,
                price: price,
                status: price > 0 ? true : false
            };
        });
        setAllOrdersTotal(enriched.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0));
    }, [shippedOrder, failedDeliveries, firebaseSkus])

    //This function gets the price of any sku
    const getPriceBySku = (skuList, targetSku) => {
        const found = firebaseSkus.find(item => item.sku === targetSku);
        return found ? found.price : 0; // returns null if not found
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
    const getDarazOrders = async (access_token, createdAfterISO, status) => {
        try {
            // Validate access token before making request
            if (!access_token) {
                console.warn("Missing access token for Daraz orders fetch");
                return null;
            }

            const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Server error ${response.status}:`, errorData.error || errorData.message || 'Unknown error');
                return null;
            }

            const data = await response.json();

            // Check if response contains an error
            if (data.error) {
                console.warn("API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                console.warn("Invalid response format: orderItems missing or not an array");
                return null;
            }

            if (status == 'shipped') {
                setShippedOrder(prev => [...prev, ...countSkusFromOrders(data.orderItems)]);
            }

            return data;
        } catch (error) {
            // Silently handle errors without showing notifications
            console.warn("Error fetching Daraz orders:", error.message);
            return null;
        }
    };

    // Separate function for failed orders using update_after and update_before
    const getFailedOrders = async (access_token, updateAfterISO, status) => {
        try {
            // Calculate update_before as end of today (23:59:59.999)
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            const updateBeforeISO = endOfToday.toISOString();

            const data = await getDarazFailedOrders(access_token, updateAfterISO, updateBeforeISO, status);
            
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
        } catch (error) {
            console.error('❌ [FAILED ORDERS] Error processing failed orders:', error);
            console.error('❌ [FAILED ORDERS] Error message:', error.message);
            console.error('❌ [FAILED ORDERS] Status:', status);
        }
    };








    /////////STOCK PART/////////
    const [totalPrice, setTotalPrice] = useState(0)
    const [products, setProducts] = useState([]);
    const [stockLoader, setStockLoader] = useState(false)


    useEffect(() => {
        setStockLoader(true)
        productRef
            .once('value')
            .then(snapshot => {

                const data = snapshot.val();

                if (data) {
                    const array = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));
                    setProducts(array);
                } else {
                    setProducts([]); // Optional: clear products if nothing is found
                }

                setStockLoader(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setStockLoader(false); // ensure darazLoader stops even on error
            });
    }, [reloadScreen])

    const calculateTotalPrice = (products) => {
        return products?.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    };

    useEffect(() => {
        setTotalPrice(calculateTotalPrice(products));
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
                console.warn("Missing access token for Daraz pending orders fetch");
                return null;
            }

            const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Server error ${response.status}:`, errorData.error || errorData.message || 'Unknown error');
                return null;
            }

            const data = await response.json();

            // Check if response contains an error
            if (data.error) {
                console.warn("API returned error:", data.error, data.details || '');
                return null;
            }

            // Ensure orderItems exists and is an array
            if (!data.orderItems || !Array.isArray(data.orderItems)) {
                console.warn("Invalid response format: orderItems missing or not an array");
                return null;
            }

            if (status == 'pending') {
                setPendingOrdersCount(prev => prev + (data.countTotal || 0))
                setPendingOrders(prev => [...prev, ...(data.orderItems || [])])
            } else if (status == 'ready_to_ship') {
                setReadyToShipOrdersCount(prev => prev + (data.countTotal || 0))
                setReadyToShipOrders(prev => [...prev, ...(data.orderItems || [])])
            } else {
                if(status=='delivered'){                    
                    setDarazDeliveredOrders(prev => [...prev, ...countSkusFromOrders(data.orderItems || [])])
                    setDarazDeliveredOrdersCount(prev=>prev+(data?.orderItems?.length || 0))
                }
            }

            return data;
        } catch (error) {
            // Silently handle errors without showing notifications
            console.warn("Error fetching Daraz pending orders:", error.message);
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
                requests = all_access_tokens.flatMap(item => [
                    getDarazPendingOrders(item.access_token, createdAfter, 'pending'),
                    getDarazPendingOrders(item.access_token, createdAfter, 'ready_to_ship'),
                    getDarazDeliveredOrders(item.access_token, startOfToday.toISOString(), 'delivered',dispatch),
                ]);
            } else if (all_access_tokens) {

                requests = [
                    getDarazPendingOrders(all_access_tokens[0].access_token, createdAfter, 'pending'),
                    getDarazPendingOrders(all_access_tokens[0].access_token, createdAfter, 'ready_to_ship'),
                    getDarazDeliveredOrders(all_access_tokens[0].access_token, startOfToday.toISOString(), 'delivered',dispatch),
                ];
            } else {
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
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp loader={false} onPress={navigateCash} amount={25000} label={AppStrings.cash} info={AppStrings.cashInfo} />
                    <IndividualValueComp loader={false} onPress={navigatePackaging} amount={25000} label={AppStrings.packaging} info={AppStrings.packagingInfo} />
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
