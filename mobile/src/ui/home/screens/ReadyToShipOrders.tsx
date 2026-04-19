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
import { useTheme } from '../../../context/ThemeContext';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import { setTodayReadyToShipOrders } from '../../../redux/AppReducer';
import { getBaseUrl } from '../../../utils/api/baseUrl';

interface NavigationProps {
    navigation: any;
}

interface RouteParams {
    firebaseSkus?: any[];
    readyToShipOrders?: any[];
}

const ReadyToShipOrders: React.FC<NavigationProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async

    const route = useRoute();
    const selector = useSelector((state: any) => state.AppReducer);
    const [totalCost, setTotalCost] = useState(0);
    const [amountReceived, setAmountReceived] = useState(0);

    const [darazReadyToShipOrders, setDarazReadyToShipOrders] = useState<any[]>([]);
    const [darazReadyToShipOrdersCount, setDarazReadyToShipOrdersCount] = useState<number>(0);
    const [all_access_tokens, setAll_access_tokens] = useState<any[]>([]);

    const [processedItemIds, setProcessedItemIds] = useState<Set<string>>(new Set<string>());

    useEffect(() => {
        let newTokens: any[] = [];

        try {
            if (selector?.selectedStore?.id) {
                const access_token = selector?.selectedStore?.user?.token?.access_token;
                const name = selector?.selectedStore?.user?.seller?.data?.name;

                if (access_token) {
                    newTokens = [{
                        access_token: access_token,
                        storeName: name || null
                    }];
                }
            } else {
                // Filter out stores without valid access tokens
                newTokens = Array.isArray(selector?.access_tokens)
                    ? selector?.access_tokens.filter((token: any) =>
                        token && token.access_token && token.access_token.trim() !== ''
                    )
                    : [];
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

    const { firebaseSkus = [], readyToShipOrders = [] } = route.params as RouteParams || {};

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
                            pending={false}
                            readyToShip={true}
                            key={orderItem.order_item_id}
                            item={orderItem}
                            firebaseSkus={firebaseSkus}
                            selector={selector}
                            onProfitCalculated={(cost: number, amount: number) => handleCostCalculated(orderItem.order_item_id, cost, amount)}
                        />
                    );
                })}
            </View>
        );
    };

    useEffect(() => {
        // Use passed readyToShipOrders data if available, otherwise use Redux state
        if (readyToShipOrders && readyToShipOrders.length > 0) {
            setDarazReadyToShipOrders(readyToShipOrders);
            setDarazReadyToShipOrdersCount(readyToShipOrders.length);
        } else {
            setDarazReadyToShipOrders(selector?.todayReadyToShipOrders || []);
            setDarazReadyToShipOrdersCount(selector?.todayReadyToShipOrders?.length || 0);
        }
    }, [selector?.todayReadyToShipOrders, readyToShipOrders]);

    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const getDarazReadyToShipOrdersLocal = async (access_token: string, storeInfo?: any) => {
        if (!access_token) {
            console.warn('⚠️ [READY TO SHIP] Missing access token');
            return;
        }

        const storeName = storeInfo?.storeName || storeInfo?.name || 'Unknown Store';
        const sellerId = storeInfo?.seller_id || 'Unknown Seller ID';

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🏪 [READY TO SHIP - ${storeName}] Starting fetch for store: ${storeName}`);
        console.log(`🆔 [READY TO SHIP - ${storeName}] Seller ID: ${sellerId}`);
        console.log(`🔑 [READY TO SHIP - ${storeName}] Token preview: ${access_token.substring(0, 15)}...`);

        try {
            // Calculate date 30 days before today
            const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const requestUrl = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfter)}&status=ready_to_ship`;

            console.log(`📤 [READY TO SHIP - ${storeName}] Request URL: ${requestUrl.replace(access_token, 'ACCESS_TOKEN_HIDDEN')}`);
            console.log(`📅 [READY TO SHIP - ${storeName}] Created after: ${createdAfter}`);

            // Use the same API endpoint but with ready_to_ship status
            const response = await fetch(requestUrl);

            console.log(`📥 [READY TO SHIP - ${storeName}] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error(`❌ [READY TO SHIP - ${storeName}] Server error ${response.status}:`, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            console.log(`✅ [READY TO SHIP - ${storeName}] Response received`);
            console.log(`📊 [READY TO SHIP - ${storeName}] Response keys:`, Object.keys(data));

            if (!data?.orderItems?.length) {
                console.log(`ℹ️ [READY TO SHIP - ${storeName}] No orders found for this store`);
                console.log(`📦 [READY TO SHIP - ${storeName}] Order items: 0`);
                console.log(`📈 [READY TO SHIP - ${storeName}] Count total: 0`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return;
            }

            const orderCount = data.orderItems.length;
            const countTotal = data.countTotal || orderCount;

            console.log(`📦 [READY TO SHIP - ${storeName}] Order items count: ${orderCount}`);
            console.log(`📈 [READY TO SHIP - ${storeName}] Count total: ${countTotal}`);

            // Log details of each order for this store
            console.log(`📋 [READY TO SHIP - ${storeName}] Order details:`);
            data.orderItems.forEach((order: any, index: number) => {
                const orderId = order.order_id || order.orderNumber || 'N/A';
                const orderItemsCount = order.order_items?.length || 0;
                const orderStatus = order.status || 'N/A';
                const createdAt = order.created_at || 'N/A';

                console.log(`  Order ${index + 1}:`, {
                    orderId: orderId,
                    orderNumber: order.order_number || 'N/A',
                    status: orderStatus,
                    orderItemsCount: orderItemsCount,
                    createdAt: createdAt,
                    store: storeName
                });

                // Log order items if available
                if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
                    order.order_items.forEach((item: any, itemIndex: number) => {
                        console.log(`    Item ${itemIndex + 1}:`, {
                            sku: item.sku || 'N/A',
                            name: item.name ? item.name.substring(0, 50) + '...' : 'N/A',
                            quantity: item.quantity || 0,
                            paidPrice: item.paid_price || 0,
                            orderItemId: item.order_item_id || 'N/A'
                        });
                    });
                }
            });

            setDarazReadyToShipOrders(prev => {
                // Important: Attach the access_token to each order and its items
                const enrichedOrders = (data.orderItems || []).map((order: any) => ({
                    ...order,
                    access_token: access_token,
                    order_items: (order.order_items || []).map((item: any) => ({
                        ...item,
                        access_token: access_token
                    }))
                }));
                const updated = [...prev, ...enrichedOrders];
                console.log(`✅ [READY TO SHIP - ${storeName}] Added ${orderCount} orders. Total orders now: ${updated.length}`);
                return updated;
            });

            setDarazReadyToShipOrdersCount(prev => {
                const newCount = prev + countTotal;
                console.log(`📊 [READY TO SHIP - ${storeName}] Updated count: ${prev} + ${countTotal} = ${newCount}`);
                return newCount;
            });

            console.log(`✅ [READY TO SHIP - ${storeName}] Successfully processed ${orderCount} orders for ${storeName}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        } catch (error: any) {
            console.error(`❌ [READY TO SHIP - ${storeName}] Error fetching orders:`, error.message);
            console.error(`❌ [READY TO SHIP - ${storeName}] Error type:`, error?.constructor?.name || 'Unknown');
            if (error?.stack) {
                console.error(`❌ [READY TO SHIP - ${storeName}] Stack trace:`, error.stack);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
                setDarazReadyToShipOrders([]);
                setDarazReadyToShipOrdersCount(0);
                setTotalCost(0);
                setAmountReceived(0);
                setProcessedItemIds(new Set());
                setDarazOrdersLoader(true);

                let requests: Promise<void>[] = [];

                if (Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                    // Filter out invalid access tokens before making requests
                    const validTokens = all_access_tokens.filter((item: any) =>
                        item && item.access_token && item.access_token.trim() !== ''
                    );
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('🔄 [READY TO SHIP] Starting fetch for all stores');
                    console.log(`📊 [READY TO SHIP] Total stores: ${all_access_tokens.length}`);
                    console.log(`✅ [READY TO SHIP] Valid stores: ${validTokens.length}`);
                    console.log(`📋 [READY TO SHIP] Store list:`, validTokens.map((t: any) => ({
                        name: t.storeName || t.name || 'Unknown',
                        seller_id: t.seller_id || 'N/A',
                        hasToken: !!t.access_token
                    })));
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                    requests = validTokens.flatMap((item: any) => {
                        return [getDarazReadyToShipOrdersLocal(item.access_token, item)];
                    });
                } else if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                    if (all_access_tokens[0] && all_access_tokens[0].access_token && all_access_tokens[0].access_token.trim() !== '') {
                        console.log('🔄 [READY TO SHIP] Fetching for single store');
                        requests = [
                            getDarazReadyToShipOrdersLocal(all_access_tokens[0].access_token, all_access_tokens[0]),
                        ];
                    }
                }

                if (requests.length > 0) {
                    console.log(`🚀 [READY TO SHIP] Executing ${requests.length} API requests in parallel`);
                    await Promise.all(requests);
                    console.log('✅ [READY TO SHIP] All store requests completed');
                    console.log(`📊 [READY TO SHIP] Final order count: ${darazReadyToShipOrdersCount}`);
                    console.log(`📦 [READY TO SHIP] Final orders array length: ${darazReadyToShipOrders.length}`);
                } else {
                    console.warn('⚠️ [READY TO SHIP] No valid requests to execute');
                }
            } catch (error) {
                console.error('❌ [READY TO SHIP] Error while fetching orders:', error);
                if (error instanceof Error) {
                    console.error('❌ [READY TO SHIP] Error message:', error.message);
                    console.error('❌ [READY TO SHIP] Error stack:', error.stack);
                }
            } finally {
                setDarazOrdersLoader(false);
                console.log('🏁 [READY TO SHIP] Fetch operation completed');
            }
        };

        fetchOrders();
    }, [all_access_tokens]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Reset states
            setDarazReadyToShipOrders([]);
            setDarazReadyToShipOrdersCount(0);
            setTotalCost(0);
            setAmountReceived(0);
            setProcessedItemIds(new Set());

            // Fetch fresh data
            if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                // Filter out invalid access tokens before making requests
                const validTokens = all_access_tokens.filter((item: any) =>
                    item && item.access_token && item.access_token.trim() !== ''
                );
                console.log('🔄 [READY TO SHIP - REFRESH] Refreshing orders for', validTokens.length, 'stores');
                const requests = validTokens.flatMap((item: any) => {
                    return [getDarazReadyToShipOrdersLocal(item.access_token, item)];
                });

                if (requests.length > 0) {
                    console.log('🚀 [READY TO SHIP - REFRESH] Executing refresh requests');
                    await Promise.all(requests);
                    console.log('✅ [READY TO SHIP - REFRESH] Refresh completed');
                }
            }
        } catch (error) {
            console.error('Error refreshing orders:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Get all ready to ship orders
    const getOrdersBySelectedRange = () => {
        return darazReadyToShipOrders;
    };

    const getOrdersCountBySelectedRange = () => {
        return darazReadyToShipOrdersCount;
    };

    const styles = getStyles(theme);
    return (
        <View style={{ flex: 1, backgroundColor: theme.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: theme.white }}>

                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.readyToShipOrders} goBack={goBack} info={true} />
                    <SelectStore />
                </View>

                {darazOrdersLoader ?
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size={'large'} color={theme.primaryOrange}></ActivityIndicator>
                    </View>
                    :
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[theme.primaryOrange]}
                                tintColor={theme.primaryOrange}
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
                                    No {AppStrings.readyToShipOrders.toLowerCase()} found.
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

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        padding: 16,
        flexGrow: 1
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
    },
    orderId: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.textPrimary,
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
        color: theme.textPrimary,
    },
    amount: {
        color: theme.textSecondary,
    },
    profitBadge: {
        borderRadius: 100,
        backgroundColor: theme.greenbg,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        marginTop: 4,
    },
    profitText: {
        color: theme.green,
        fontFamily: FontFamilty.medium,
    },
    totalProfitContainer: {
        position: 'absolute',
        bottom: 16,
        backgroundColor: theme.greenbg,
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
        color: theme.textSecondary,
    },
    headerComp: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
        color: theme.textSecondary,
    },
});

export default ReadyToShipOrders; 