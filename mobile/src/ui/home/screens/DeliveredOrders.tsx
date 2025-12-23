import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../context/ThemeContext';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderDurationHeader from '../components/OrderDurationHeader';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import WeekRangePST from '../components/WeekRangePST';
import { getBaseUrl } from '../../../utils/api/baseUrl';



const DeliveredOrders = ({ navigation }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async

    const route = useRoute();
    const selector = useSelector((state) => state.AppReducer);
    const [totalProfit, setTotalProfit] = useState(0);
    const [amountReceived, setAmountReceived] = useState(0);

    const [darazDeliveredOrders, setDarazDeliveredOrders] = useState([])
    const [darazDeliveredOrdersCount, setDarazDeliveredOrdersCount] = useState(0)
    const [all_access_tokens, setAll_access_tokens] = useState([]);

    const [startWeek, setStartWeek] = useState()
    const [endWeek, setEndWeek] = useState()
    // Delivered Orders
    const [darazDeliveredOrdersYesterday, setDarazDeliveredOrdersYesterday] = useState([]);
    const [darazDeliveredOrdersSevenDays, setDarazDeliveredOrdersSevenDays] = useState([]);
    const [darazDeliveredOrdersThirtyDays, setDarazDeliveredOrdersThirtyDays] = useState([]);
    const [darazDeliveredOrdersByWeek, setDarazDeliveredOrdersByWeek] = useState([]);
    const [darazDeliveredOrdersCustom, setDarazDeliveredOrdersCustom] = useState([]);

    // Delivered Orders Count
    const [darazDeliveredOrdersYesterdayCount, setDarazDeliveredOrdersYesterdayCount] = useState(0);
    const [darazDeliveredOrdersSevenDaysCount, setDarazDeliveredOrdersSevenDaysCount] = useState(0);
    const [darazDeliveredOrdersThirtyDaysCount, setDarazDeliveredOrdersThirtyDaysCount] = useState(0);
    const [darazDeliveredOrdersByWeekCount, setDarazDeliveredOrdersByWeekCount] = useState(0);
    const [darazDeliveredOrdersCustomCount, setDarazDeliveredOrdersCustomCount] = useState(0);

    const [processedItemIds, setProcessedItemIds] = useState(new Set());


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

    const { firebaseSkus = [] } = route.params || {};

    const handleProfitCalculated = (orderItemId, profit,amount) => {
        if (processedItemIds.has(orderItemId)) return;

        setProcessedItemIds(prevSet => {
            const newSet = new Set(prevSet);
            newSet.add(orderItemId);
            return newSet;
        });

        setTotalProfit(prev => prev + profit);
        setAmountReceived(prev => prev + amount);

    };



    const styles = getStyles(theme);

    const renderOrder = (item, onProfitCalculated,) => (
        <View style={styles.card}>
            <TextComp size={16} style={styles.orderId} numberOfLines={1}>Order ID: {item.order_id}</TextComp>
            {item.order_items.map((orderItem) => (
                <OrderItem
                    failed={false}
                    key={orderItem.order_item_id}
                    item={orderItem}
                    firebaseSkus={firebaseSkus}
                    selector={selector}
                    onProfitCalculated={(profit,amount) => handleProfitCalculated(orderItem.order_item_id, profit,amount)}

                />
            ))}
        </View>
    );



    const [selectedRange, setSelectedRange] = useState('today');
    const [customDate, setCustomDate] = useState(null);




    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const getDarazDeliveredOrdersLocal = async (access_token, update_after, update_before, status, date) => {
        try {
            const response = await fetch(
                `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data?.orderItems?.length) return;

            if (selectedRange === 'today') {
                setDarazDeliveredOrders(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === 'yesterday') {
                setDarazDeliveredOrdersYesterday(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersYesterdayCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === '7days') {
                setDarazDeliveredOrdersSevenDays(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersSevenDaysCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === '30days') {
                setDarazDeliveredOrdersThirtyDays(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersThirtyDaysCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === 'By Week') {
                setDarazDeliveredOrdersByWeek(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersByWeekCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === 'custom') {
                setDarazDeliveredOrdersCustom(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersCustomCount(prev => prev + data.orderItems.length);
            }

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
        }
    };

    


    useEffect(() => {

        if (
            !all_access_tokens ||
            (Array.isArray(all_access_tokens) && all_access_tokens.length === 0))
            return;

        const fetchOrders = async () => {



            switch (selectedRange) {
                case 'today':
                    setDarazDeliveredOrders([]);
                    setDarazDeliveredOrdersCount(0);
                    break;
                case 'yesterday':
                    setDarazDeliveredOrdersYesterday([]);
                    setDarazDeliveredOrdersYesterdayCount(0);
                    break;
                case '7days':
                    setDarazDeliveredOrdersSevenDays([]);
                    setDarazDeliveredOrdersSevenDaysCount(0);
                    break;
                case '30days':
                    setDarazDeliveredOrdersThirtyDays([]);
                    setDarazDeliveredOrdersThirtyDaysCount(0);
                    break;
                case 'By Week':
                    setDarazDeliveredOrdersByWeek([]);
                    setDarazDeliveredOrdersByWeekCount(0);
                    break;
                case 'custom':
                    setDarazDeliveredOrdersCustom([]);
                    setDarazDeliveredOrdersCustomCount(0);
                    break;
            }

            // Calculate update_after and update_before based on selectedRange
            const now = new Date();
            const updateAfter = new Date();
            const updateBefore = new Date();

            switch (selectedRange) {
                case 'today':
                    updateAfter.setHours(0, 0, 0, 0); // today 12:00 AM
                    // updateBefore remains as now
                    break;
                case 'yesterday':
                    updateAfter.setDate(updateAfter.getDate() - 1); // yesterday
                    updateAfter.setHours(0, 0, 0, 0);
                    updateBefore.setHours(0, 0, 0, 0); // today 12:00 AM
                    break;
                case '7days':
                    updateAfter.setDate(updateAfter.getDate() - 7);
                    updateAfter.setHours(0, 0, 0, 0);
                    // updateBefore remains as now
                    break;
                case '30days':
                    updateAfter.setDate(updateAfter.getDate() - 30);
                    updateAfter.setHours(0, 0, 0, 0);
                    // updateBefore remains as now
                    break;
                case 'By Week':
                    if (startWeek && endWeek) {
                        updateAfter.setTime(new Date(startWeek).getTime());     // End of week
                        updateBefore.setTime(new Date(endWeek).getTime());  // Start of week
                        console.log(updateAfter.toISOString(), 'updateAfter');
                        console.log(updateBefore.toISOString(), 'updateBefore');

                    }
                    break;
                case 'custom':
                    if (customDate) {
                        updateAfter.setTime(new Date(customDate).setHours(0, 0, 0, 0));
                        updateBefore.setTime(new Date(customDate).setHours(23, 59, 59, 999));
                        console.log(updateBefore.toISOString());

                    }
                    break;
            }


            setTotalProfit(0);
            setAmountReceived(0)
            setProcessedItemIds(new Set());
            setDarazOrdersLoader(true)


            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [

                    getDarazDeliveredOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'delivered', selectedRange),
                ]);
            } else if (all_access_tokens) {

                requests = [

                    getDarazDeliveredOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'delivered', selectedRange),
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
    }, [selectedRange, customDate, startWeek]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // Reset states based on selected range
            switch (selectedRange) {
                case 'today':
                    setDarazDeliveredOrders([]);
                    setDarazDeliveredOrdersCount(0);
                    break;
                case 'yesterday':
                    setDarazDeliveredOrdersYesterday([]);
                    setDarazDeliveredOrdersYesterdayCount(0);
                    break;
                case '7days':
                    setDarazDeliveredOrdersSevenDays([]);
                    setDarazDeliveredOrdersSevenDaysCount(0);
                    break;
                case '30days':
                    setDarazDeliveredOrdersThirtyDays([]);
                    setDarazDeliveredOrdersThirtyDaysCount(0);
                    break;
                case 'By Week':
                    setDarazDeliveredOrdersByWeek([]);
                    setDarazDeliveredOrdersByWeekCount(0);
                    break;
                case 'custom':
                    setDarazDeliveredOrdersCustom([]);
                    setDarazDeliveredOrdersCustomCount(0);
                    break;
            }

            setTotalProfit(0);
            setAmountReceived(0);
            setProcessedItemIds(new Set());

            // Calculate update_after and update_before based on selectedRange
            const now = new Date();
            const updateAfter = new Date();
            const updateBefore = new Date();

            switch (selectedRange) {
                case 'today':
                    updateAfter.setHours(0, 0, 0, 0);
                    break;
                case 'yesterday':
                    updateAfter.setDate(updateAfter.getDate() - 1);
                    updateAfter.setHours(0, 0, 0, 0);
                    updateBefore.setHours(0, 0, 0, 0);
                    break;
                case '7days':
                    updateAfter.setDate(updateAfter.getDate() - 7);
                    updateAfter.setHours(0, 0, 0, 0);
                    break;
                case '30days':
                    updateAfter.setDate(updateAfter.getDate() - 30);
                    updateAfter.setHours(0, 0, 0, 0);
                    break;
                case 'By Week':
                    if (startWeek && endWeek) {
                        updateAfter.setTime(new Date(startWeek).getTime());
                        updateBefore.setTime(new Date(endWeek).getTime());
                    }
                    break;
                case 'custom':
                    if (customDate) {
                        updateAfter.setTime(new Date(customDate).setHours(0, 0, 0, 0));
                        updateBefore.setTime(new Date(customDate).setHours(23, 59, 59, 999));
                    }
                    break;
            }

            // Fetch fresh data
            if (all_access_tokens && Array.isArray(all_access_tokens) && all_access_tokens.length > 0) {
                const requests = all_access_tokens.flatMap((item: any) => {
                    if (item && item.access_token) {
                        return [getDarazDeliveredOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'delivered', selectedRange)];
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

    //This function gets the price of any sku


    const getOrdersBySelectedRange = () => {
        switch (selectedRange) {
            case 'today':
                return darazDeliveredOrders;
            case 'yesterday':
                return darazDeliveredOrdersYesterday;
            case '7days':
                return darazDeliveredOrdersSevenDays;
            case '30days':
                return darazDeliveredOrdersThirtyDays;
            case 'By Week':
                return darazDeliveredOrdersByWeek;
            case 'custom':
                return darazDeliveredOrdersCustom;
            default:
                return [];
        }
    };

    const getOrdersCountBySelectedRange = () => {
        switch (selectedRange) {
            case 'today':
                return darazDeliveredOrdersCount;
            case 'yesterday':
                return darazDeliveredOrdersYesterdayCount;
            case '7days':
                return darazDeliveredOrdersSevenDaysCount;
            case '30days':
                return darazDeliveredOrdersThirtyDaysCount;
            case 'By Week':
                return darazDeliveredOrdersByWeekCount;
            case 'custom':
                return darazDeliveredOrdersCustomCount;
            default:
                return 0;
        }
    };


    const onWeekSelected = ({ start, end }) => {
        console.log('Start of week (PST in ISO):', start);
        console.log('End of week (PST in ISO):', end);
        setStartWeek(start)
        setEndWeek(end)
    }




    return (
        <View style={{ flex: 1, backgroundColor: theme.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: theme.white }}>

                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.DeliveredOrders} goBack={goBack} />
                    <SelectStore />
                </View>

                <OrderDurationHeader
                    selectedRange={selectedRange}
                    customDate={customDate}
                    onChange={(rangeKey, date) => {
                        setSelectedRange(rangeKey);
                        console.log(rangeKey, 'rangeKey');

                        if (rangeKey === 'custom') {
                            console.log(date, 'date');
                            setCustomDate(date);
                        }

                    }}
                />
                {selectedRange == 'By Week' && <WeekRangePST onWeekSelected={onWeekSelected} />}
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
                                <TextComp size={16} style={styles.headerComp} numberOfLines={1}>
                                    Total Orders: {getOrdersCountBySelectedRange()}
                                </TextComp>
                            }
                            data={getOrdersBySelectedRange()}
                            keyExtractor={(item) => item.order_id.toString()}
                            renderItem={({ item }) => renderOrder(item, handleProfitCalculated)}
                            contentContainerStyle={styles.container}
                            ListEmptyComponent={
                                <TextComp size={16} style={styles.emptyTextComp} numberOfLines={1}>
                                    No delivered orders found.
                                </TextComp>
                            }
                        />

                    </ScrollView>
                }
                <View style={styles.totalProfitContainer}>
                    <TextComp size={16} style={styles.profitText} numberOfLines={1}>
                        Total Profit: Rs. {parseFloat(totalProfit).toFixed(2)}
                    </TextComp>
                    <TextComp size={16} style={styles.profitText} numberOfLines={1}>
                        Total Amount Received: Rs. {parseFloat(amountReceived).toFixed(2)}
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

export default DeliveredOrders;
