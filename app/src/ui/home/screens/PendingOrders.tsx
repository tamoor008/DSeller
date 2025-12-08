import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import { setTodayPendingOrders } from '../../../redux/AppReducer';
import { getBaseUrl } from '../../../utils/api/baseUrl';
import { packAndRtsOrders, prepareOrderData } from '../../../utils/api/packAndRtsOrders';

interface NavigationProps {
    navigation: any;
}

interface RouteParams {
    firebaseSkus?: any[];
    pendingOrders?: any[];
}

const PendingOrders: React.FC<NavigationProps> = ({ navigation }) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const route = useRoute();
    const selector = useSelector((state: any) => state.AppReducer);
    const [totalCost, setTotalCost] = useState(0);
    const [amountReceived, setAmountReceived] = useState(0);

    const [darazPendingOrders, setDarazPendingOrders] = useState<any[]>([]);
    const [darazPendingOrdersCount, setDarazPendingOrdersCount] = useState<number>(0);
    const [all_access_tokens, setAll_access_tokens] = useState<any[]>([]);
    const dispatch = useDispatch();

    const [processedItemIds, setProcessedItemIds] = useState<Set<string>>(new Set<string>());

    

    useEffect(() => {
        let newTokens: any[] = [];

        try {
            if (selector.selectedStore?.id) {
                const access_token = selector.selectedStore.user?.token?.access_token;
                const name = selector.selectedStore?.user.seller.data.name;

                if (access_token) {
                    newTokens = [{
                        access_token: access_token,
                        storeName: name || null
                    }];
                }
            } else {
                newTokens = Array.isArray(selector.access_tokens) ? selector.access_tokens : [];
            }

            // Only update state if value has changed
            const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens);
            if (hasChanged) {
                setAll_access_tokens(newTokens);
            }
        } catch (error) {
            console.error('Error processing access tokens:', error);
            setAll_access_tokens([]);
        }

    }, [selector]);

    const { firebaseSkus = [], pendingOrders = [] } = route.params as RouteParams || {};

    const handleCostCalculated = (orderItemId: string, cost: number, amount: number) => {
        if (processedItemIds.has(orderItemId)) return;

        setProcessedItemIds(prevSet => {
            const newSet = new Set(prevSet);
            newSet.add(orderItemId);
            return newSet;
        });

        setTotalCost(prev => prev + cost);
        setAmountReceived(prev => prev + amount);

    };



    const renderOrder = (item: any, onCostCalculated: any) => {
        if (!item || !item.order_id) {
            return null;
        }

        return (
            <View style={styles.card}>
                <TextComp size={14} numberOfLines={1} style={styles.orderId}>Order ID: {item.order_id}</TextComp>
                {item.order_items && Array.isArray(item.order_items) && item.order_items.map((orderItem: any) => {
                    if (!orderItem || !orderItem.order_item_id) {
                        return null;
                    }
                    
                    return (
                        <OrderItem
                            failed={false}
                            pending={true}
                            key={orderItem.order_item_id}
                            item={orderItem}
                            firebaseSkus={firebaseSkus}
                            selector={selector}
                            onProfitCalculated={(cost: number, amount: number) => handleCostCalculated(orderItem.order_item_id, cost, amount)}
                            onMakeReadyToShip={handleSingleOrderReadyToShip}
                        />
                    );
                })}
                
                {/* Ready to Ship button for the entire order */}
                <TouchableOpacity 
                    onPress={() =>handleSingleOrderReadyToShip(item.order_id)} 
                    style={{
                        padding: 8, 
                        backgroundColor: AppColors.primaryOrange, 
                        borderRadius: 8, 
                        marginTop: 12,
                        alignItems: 'center'
                    }}
                >
                    <TextComp size={16} numberOfLines={1} style={{ color: '#fff', textAlign: 'center', fontFamily: FontFamilty.bold }}>
                        Make Ready to Ship
                    </TextComp>
                </TouchableOpacity>
            </View>
        );
    };



    const onChange = () => {

    }





    useEffect(() => {
        // Use passed pendingOrders data if available, otherwise use Redux state
        if (pendingOrders && pendingOrders.length > 0) {
            setDarazPendingOrders(pendingOrders);
            setDarazPendingOrdersCount(pendingOrders.length);
        } else {
            setDarazPendingOrders(selector.todayPendingOrders || []);
            setDarazPendingOrdersCount(selector.todayPendingOrders?.length || 0);
        }
    }, [selector.todayPendingOrders, pendingOrders]);

    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const getDarazPendingOrdersLocal = async (access_token: string) => {
        if (!access_token) {
            return;
        }

        try {
            // Calculate date 30 days before today
            const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            
            // Use the same API endpoint as HomeScreen with created_after parameter
            const response = await fetch(
                `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfter)}&status=pending`
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data?.orderItems?.length) {
                return;
            }

            setDarazPendingOrders(prev => [...prev, ...data.orderItems]);
            setDarazPendingOrdersCount(prev => prev + (data.countTotal || data.orderItems.length));

        } catch (error: any) {
            console.error("Error fetching Daraz pending orders:", error.message);
        }
    };

    


    useEffect(() => {
        if (
            !all_access_tokens ||
            (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) {
            return;
        }

        const fetchOrders = async () => {
            try {
                setDarazPendingOrders([]);
                setDarazPendingOrdersCount(0);
                setTotalCost(0);
                setAmountReceived(0);
                setProcessedItemIds(new Set());
                setDarazOrdersLoader(true);

                let requests: Promise<void>[] = [];

                if (Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                    requests = all_access_tokens.flatMap((item: any) => {
                        if (item && item.access_token) {
                            return [getDarazPendingOrdersLocal(item.access_token)];
                        }
                        return [];
                    });
                } else if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                    if (all_access_tokens[0] && all_access_tokens[0].access_token) {
                        requests = [
                            getDarazPendingOrdersLocal(all_access_tokens[0].access_token),
                        ];
                    }
                }

                if (requests.length > 0) {
                    await Promise.all(requests);
                }
            } catch (error) {
                console.error('Error while fetching orders:', error);
            } finally {
                setDarazOrdersLoader(false);
            }
        };

        fetchOrders();
    }, [all_access_tokens]);



    // Get all pending orders
    const getOrdersBySelectedRange = () => {
        return darazPendingOrders;
    };

    const getOrdersCountBySelectedRange = () => {
        return darazPendingOrdersCount;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Reset states
            setDarazPendingOrders([]);
            setDarazPendingOrdersCount(0);
            setTotalCost(0);
            setAmountReceived(0);
            setProcessedItemIds(new Set());
            
            // Fetch fresh data
            if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                const requests = all_access_tokens.flatMap((item: any) => {
                    if (item && item.access_token) {
                        return [getDarazPendingOrdersLocal(item.access_token)];
                    }
                    return [];
                });
                
                if (requests.length > 0) {
                    await Promise.all(requests);
                }
            }
        } catch (error) {
            console.error('Error refreshing orders:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSingleOrderReadyToShip = async (orderId: string) => {
        Alert.alert(
            'Ready to Ship',
            `Make order ${orderId} ready to ship?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            // Find the specific order
                            const order = darazPendingOrders.find(o => o.order_id === orderId);
                            if (!order) {
                                Alert.alert('Error', 'Order not found');
                                return;
                            }

                            // Get the access token from the order's first item
                            const order_access_token = order?.order_items[0]?.access_token || '';
                            if (!order_access_token) {
                                Alert.alert('Error', 'No access token found for this order');
                                return;
                            }

                            // Prepare single order data with the correct access token
                            const orderItems = order.order_items.map((item: any) => ({
                                ...item,
                                order_id: orderId,
                                access_token: order_access_token
                            }));

                            // Prepare order data for API
                            const orderData = prepareOrderData(orderItems, order_access_token);

                            console.log('Single Order Data:', orderData);
                            console.log('Access Token:', order_access_token);
                            
                            // Call the API with the correct access token
                            const result = await packAndRtsOrders(orderData, order_access_token);

                            if (result.success) {
                                Alert.alert(
                                    'Success',
                                    `Order ${orderId} has been marked as Ready to Ship!`
                                );
                                // You might want to refresh the orders list here
                            } else {
                                Alert.alert('Error', result.message || 'Failed to process order');
                            }

                        } catch (error: any) {
                            console.error('Error in single order ready to ship:', error);
                            Alert.alert('Error', error.message || 'Failed to process order');
                        }
                    }
                }
            ]
        );
    };

    const handleBulkReadyToShip = async () => {
        if (!darazPendingOrders || darazPendingOrders.length === 0) {
            Alert.alert('No Orders', 'No pending orders to process');
            return;
        }

        Alert.alert(
            'Bulk Ready to Ship',
            `Are you sure you want to mark ${darazPendingOrders.length} orders as Ready to Ship?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            // Group orders by access token
                            const ordersByAccessToken: { [accessToken: string]: any[] } = {};
                            
                            darazPendingOrders.forEach(order => {
                                if (order.order_items && Array.isArray(order.order_items)) {
                                    // Get access token from the first item of this order
                                    const accessToken = order.order_items[0]?.access_token || '';
                                    if (!accessToken) {
                                        console.warn(`No access token found for order ${order.order_id}`);
                                        return;
                                    }
                                    
                                    if (!ordersByAccessToken[accessToken]) {
                                        ordersByAccessToken[accessToken] = [];
                                    }
                                    
                                    // Add all items from this order to the group
                                    order.order_items.forEach((item: any) => {
                                        if (item && item.order_item_id) {
                                            ordersByAccessToken[accessToken].push({
                                                ...item,
                                                order_id: order.order_id,
                                                access_token: accessToken
                                            });
                                        }
                                    });
                                }
                            });

                            if (Object.keys(ordersByAccessToken).length === 0) {
                                Alert.alert('Error', 'No valid orders with access tokens found');
                                return;
                            }

                            console.log('Orders grouped by access token:', ordersByAccessToken);

                            // Process each group separately
                            const results = [];
                            let totalProcessed = 0;
                            let totalFailed = 0;

                            for (const [accessToken, orderItems] of Object.entries(ordersByAccessToken)) {
                                try {
                                    console.log(`Processing ${orderItems.length} items for access token: ${accessToken.substring(0, 10)}...`);
                                    
                                    // Prepare order data for this group
                                    const orderData = prepareOrderData(orderItems, accessToken);
                                    
                                    // Call the API for this group
                                    const result = await packAndRtsOrders(orderData, accessToken);
                                    
                                    results.push({
                                        accessToken: accessToken.substring(0, 10) + '...',
                                        success: result.success,
                                        processed: result.processed_orders || 0,
                                        failed: result.failed_orders || 0,
                                        message: result.message
                                    });
                                    
                                    totalProcessed += result.processed_orders || 0;
                                    totalFailed += result.failed_orders || 0;
                                    
                                } catch (error: any) {
                                    console.error(`Error processing group for access token ${accessToken.substring(0, 10)}...:`, error);
                                    results.push({
                                        accessToken: accessToken.substring(0, 10) + '...',
                                        success: false,
                                        processed: 0,
                                        failed: orderItems.length,
                                        message: error.message
                                    });
                                    totalFailed += orderItems.length;
                                }
                            }

                            // Show results
                            const successCount = results.filter(r => r.success).length;
                            const totalGroups = results.length;
                            
                            Alert.alert(
                                'Bulk Processing Complete',
                                `Processed ${totalGroups} store groups:\n` +
                                `✅ Successful: ${successCount} groups\n` +
                                `❌ Failed: ${totalGroups - successCount} groups\n` +
                                `📦 Total Orders: ${totalProcessed} processed, ${totalFailed} failed`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // You might want to refresh the orders list here
                                        }
                                    }
                                ]
                            );

                        } catch (error: any) {
                            console.error('Error in bulk ready to ship:', error);
                            Alert.alert('Error', error.message || 'Failed to process orders');
                        }
                    }
                }
            ]
        );
    };




    return (
        <View style={{ flex: 1, backgroundColor: AppColors.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: 'white' }}>

                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.pendingOrders} goBack={goBack} info={true} />
                    <SelectStore />
                    <TouchableOpacity
                        style={{
                            backgroundColor: AppColors.primaryOrange,
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: 'center',
                            marginTop: 8,
                        }}
                        onPress={handleBulkReadyToShip}
                    >
                        <TextComp size={16} numberOfLines={1} style={{ color: '#fff', fontFamily: FontFamilty.bold }}>
                            Bulk Ready to Ship All Orders
                        </TextComp>
                    </TouchableOpacity>
                </View>


                {darazOrdersLoader ?
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size={'large'} color={AppColors.primaryOrange}></ActivityIndicator>
                    </View>
                    :
                    <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[AppColors.primaryOrange]}
                                tintColor={AppColors.primaryOrange}
                            />
                        }
                    >


                        <FlatList
                            scrollEnabled={false}
                            ListHeaderComponent={
                                <TextComp size={16} numberOfLines={1} style={styles.headerComp}>
                                    Total Orders: {getOrdersCountBySelectedRange()}
                                </TextComp>
                            }
                            data={getOrdersBySelectedRange() || []}
                            keyExtractor={(item) => item?.order_id?.toString() || Math.random().toString()}
                            renderItem={({ item }) => renderOrder(item, handleCostCalculated)}
                            contentContainerStyle={styles.container}
                            ListEmptyComponent={
                                <TextComp size={16} numberOfLines={1} style={styles.emptyTextComp}>
                                    No pending orders found.
                                </TextComp>
                            }
                        />

                    </ScrollView>
                }
                <View style={styles.totalProfitContainer}>
                    <TextComp size={16} numberOfLines={1} style={styles.profitText}>
                        Total Cost: Rs. {parseFloat((totalCost || 0).toString()).toFixed(2)}
                    </TextComp>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flexGrow: 1
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
    },
    orderId: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    orderItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 12,
    },
    info: {
        flex: 1,
        rowGap: 8,
    },
    productName: {
        fontWeight: '600',
        fontSize: 14,
        color: '#000',
    },
    amount: {
        color: '#444',
    },
    profitBadge: {
        borderRadius: 100,
        backgroundColor: AppColors.greenbg,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        marginTop: 4,
    },
    profitText: {
        color: AppColors.green,
        fontFamily: FontFamilty.medium,
    },
    totalProfitContainer: {

        position: 'absolute',
        bottom: 16,
        backgroundColor: AppColors.greenbg,
        borderRadius: 100,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    emptyTextComp: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#777',
    },
    headerComp: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
        color: '#777',
    },
});

export default PendingOrders; 