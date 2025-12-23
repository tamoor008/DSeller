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
            setDarazReadyToShipOrders(selector.todayReadyToShipOrders || []);
            setDarazReadyToShipOrdersCount(selector.todayReadyToShipOrders?.length || 0);
        }
    }, [selector.todayReadyToShipOrders, readyToShipOrders]);

    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const getDarazReadyToShipOrdersLocal = async (access_token: string) => {
        if (!access_token) {
            return;
        }

        try {
            // Calculate date 30 days before today
            const createdAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            
            // Use the same API endpoint but with ready_to_ship status
            const response = await fetch(
                `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfter)}&status=ready_to_ship`
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data?.orderItems?.length) {
                return;
            }

            setDarazReadyToShipOrders(prev => [...prev, ...data.orderItems]);
            setDarazReadyToShipOrdersCount(prev => prev + (data.countTotal || data.orderItems.length));

        } catch (error: any) {
            console.error("Error fetching Daraz ready to ship orders:", error.message);
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
                    requests = all_access_tokens.flatMap((item: any) => {
                        if (item && item.access_token) {
                            return [getDarazReadyToShipOrdersLocal(item.access_token)];
                        }
                        return [];
                    });
                } else if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                    if (all_access_tokens[0] && all_access_tokens[0].access_token) {
                        requests = [
                            getDarazReadyToShipOrdersLocal(all_access_tokens[0].access_token),
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
                const requests = all_access_tokens.flatMap((item: any) => {
                    if (item && item.access_token) {
                        return [getDarazReadyToShipOrdersLocal(item.access_token)];
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