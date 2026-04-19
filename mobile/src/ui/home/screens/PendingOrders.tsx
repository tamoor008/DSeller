import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import SelectStore from '../../components/SelectStore'
import { useSelector } from 'react-redux'
import { AppStrings } from '../../../constants/AppStrings'
import { useTheme } from '../../../context/ThemeContext'
import TextComp from '../../components/TextComp'
import OrderItem from '../components/OrderItem'
import { packAndRtsOrders, prepareOrderData } from '../../../utils/api/packAndRtsOrders'
import { useNavigation } from '@react-navigation/native'
import { getBaseUrl } from '../../../utils/api/baseUrl'
import { checkResponseForTokenExpiration, refreshStoreTokenWithRefreshToken } from '../../../utils/api/tokenRefresh'
import FontFamilty from '../../../constants/FontFamilty'

const PendingOrders = ({ route }: any) => {
    const { theme } = useTheme()
    const navigation = useNavigation<any>()
    const BASE_URL = getBaseUrl()
    const { firebaseSkus = [] } = route.params || {}
    const goBack = () => {
        navigation.goBack()
    }

    const [darazPendingOrders, setDarazPendingOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const selector = useSelector((state: any) => state.AppReducer);
    const store = selector?.selectedStore;
    const [all_access_tokens, setAll_access_tokens] = useState(selector?.access_tokens || [])
    const visibleOrdersCount = darazPendingOrders.length;

    // Handle initial params
    useEffect(() => {
        if (route.params?.pendingOrders) {
            setDarazPendingOrders(route.params.pendingOrders)
        }
    }, [route.params])

    // Update access tokens when selector changes
    useEffect(() => {
        try {
            if (selector?.access_tokens && Array.isArray(selector.access_tokens)) {
                const newTokens = JSON.parse(JSON.stringify(selector.access_tokens));
                setAll_access_tokens(newTokens);
            }
        } catch (error) {
            setAll_access_tokens([]);
        }
    }, [selector?.access_tokens]);

    // Local function to fetch orders and update state
    const fetchDarazPendingOrdersLocal = async (access_token: string, createdAfterISO: string, status: string) => {
        try {
            if (!access_token) return null;

            let requestUrl = `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
            let response = await fetch(requestUrl);

            const isExpired = await checkResponseForTokenExpiration(response);
            if (isExpired && store?.seller_id) {
                const newToken = await refreshStoreTokenWithRefreshToken(store);
                if (newToken) {
                    requestUrl = requestUrl.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                    response = await fetch(requestUrl);
                }
            }

            if (!response.ok) return null;

            const data = await response.json();
            if (data.error || !data.orderItems || !Array.isArray(data.orderItems)) return null;

            // Important: Attach the access_token to each order and its items
            const enrichedOrders = data.orderItems.map((order: any) => ({
                ...order,
                access_token: access_token,
                order_items: (order.order_items || []).map((item: any) => ({
                    ...item,
                    access_token: access_token
                }))
            }));

            setDarazPendingOrders(prev => [...prev, ...enrichedOrders]);

        } catch (error) {
            // console.error("Error fetching Daraz pending orders:", error);
        }
    };

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!all_access_tokens || all_access_tokens.length === 0) return;

        const fetchOrders = async () => {
            setLoading(true)
            setDarazPendingOrders([])

            const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const requests = all_access_tokens.map((item: any) => {
                if (item.access_token) {
                    return fetchDarazPendingOrdersLocal(item.access_token, createdAfter, 'pending');
                }
                return Promise.resolve();
            });

            try {
                await Promise.all(requests);
            } finally {
                setLoading(false);
            }
        };

        if (!route.params?.pendingOrders && all_access_tokens.length > 0) {
            fetchOrders();
        }
    }, [all_access_tokens]);

    const onRefresh = async () => {
        setRefreshing(true);
        setDarazPendingOrders([]);

        try {
            if (all_access_tokens && all_access_tokens.length > 0) {
                const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const requests = all_access_tokens.map((item: any) => {
                    if (item.access_token) {
                        return fetchDarazPendingOrdersLocal(item.access_token, createdAfter, 'pending');
                    }
                    return Promise.resolve();
                });
                await Promise.all(requests);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const handleSingleOrderReadyToShip = async (order: any) => {
        const orderItems = order?.order_items || [];
        if (orderItems.length === 0) {
            Alert.alert('Error', 'Order items are missing for this order.');
            return;
        }

        Alert.alert(
            'Confirm Ready to Ship',
            `Are you sure you want to mark order ${orderItems[0].order_id} as Ready to Ship?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const accessToken = order.access_token || orderItems[0]?.access_token;

                            if (!accessToken) {
                                Alert.alert('Error', 'Could not identify store for this order.');
                                return;
                            }

                            const orderData = prepareOrderData(orderItems, accessToken);
                            const result = await packAndRtsOrders(orderData, accessToken);

                            if (result.success) {
                                Alert.alert('Success', `Order ${order.order_id} marked as Ready to Ship`);
                                setDarazPendingOrders(prev => prev.filter(p => p.order_id !== order.order_id));
                            } else {
                                Alert.alert('Failed', result.message || 'Failed to process order');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to process order');
                        }
                    }
                }
            ]
        );
    };

    const handleBulkReadyToShip = async () => {
        if (darazPendingOrders.length === 0) return;

        Alert.alert(
            'Confirm Bulk Ready to Ship',
            `Process all ${visibleOrdersCount} orders?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const ordersByAccessToken: { [key: string]: any[] } = {};
                            darazPendingOrders.forEach(order => {
                                const token = order.access_token;
                                if (token) {
                                    if (!ordersByAccessToken[token]) ordersByAccessToken[token] = [];
                                    ordersByAccessToken[token].push(...(order.order_items || []));
                                }
                            });

                            for (const [token, items] of Object.entries(ordersByAccessToken)) {
                                const orderData = prepareOrderData(items, token);
                                await packAndRtsOrders(orderData, token);
                            }

                            Alert.alert('Complete', 'Bulk processing finished.', [{ text: 'OK', onPress: onRefresh }]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to process orders');
                        }
                    }
                }
            ]
        );
    };

    const styles = getStyles(theme);

    const renderOrder = (item: any) => (
        <View style={styles.card}>
            <TextComp size={16} style={styles.orderId} numberOfLines={1}>Order ID: {item.order_id}</TextComp>
            {(item.order_items || []).map((orderItem: any) => (
                <OrderItem
                    pending={true}
                    key={orderItem.order_item_id}
                    item={orderItem}
                    firebaseSkus={firebaseSkus}
                    selector={selector}
                    onMakeReadyToShip={() => handleSingleOrderReadyToShip(item)}
                    onProfitCalculated={() => { }}
                />
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: theme.white }}>
                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.pendingOrders} goBack={goBack} info={true} />
                    <SelectStore />
                    {loading ? (
                        <View style={[styles.readyToShipBtn, { opacity: darazPendingOrders.length > 0 ? 1 : 0.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                            <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.medium, color: theme.white }}>Ready To Ship ({visibleOrdersCount}) </TextComp>
                            <ActivityIndicator size={'small'} color={theme.primaryOrange} style={{ marginLeft: 10 }} />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.readyToShipBtn, { opacity: darazPendingOrders.length > 0 ? 1 : 0.5 }]}
                            activeOpacity={0.7}
                            onPress={handleBulkReadyToShip}
                            disabled={darazPendingOrders.length === 0}
                        >
                            <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.medium, color: theme.white }}>Ready To Ship ({visibleOrdersCount}) </TextComp>
                        </TouchableOpacity>
                    )}
                </View>

                {loading && darazPendingOrders.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primaryOrange} />
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primaryOrange]} />
                        }
                    >
                        {darazPendingOrders.map((item, index) => (
                            <View key={index}>
                                {renderOrder(item)}
                            </View>
                        ))}

                        {darazPendingOrders.length === 0 && !loading && (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <TextComp size={16} style={{ color: theme.textSecondary }} numberOfLines={1}>No pending orders found</TextComp>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    readyToShipBtn: {
        backgroundColor: theme.primaryOrange,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        elevation: 3,
    },
    orderId: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.textPrimary,
    },
})

export default PendingOrders
