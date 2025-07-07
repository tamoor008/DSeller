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
import { BASE_URL } from '../../../utils/api/baseUrl';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderDurationHeader from '../components/OrderDurationHeader';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import { setTodayDeliveredOrders } from '../../../redux/AppReducer';
import { getDarazDeliveredOrders } from '../../../utils/api/getDarazDeliveredOrders';



const DeliveredOrders = ({ navigation }) => {
    const route = useRoute();
    const selector = useSelector((state) => state.AppReducer);
    const [totalProfit, setTotalProfit] = useState(0);
    const [darazDeliveredOrders, setDarazDeliveredOrders] = useState([])
    const [darazDeliveredOrdersCount, setDarazDeliveredOrdersCount] = useState(0)
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const dispatch = useDispatch()

    // Delivered Orders
    const [darazDeliveredOrdersYesterday, setDarazDeliveredOrdersYesterday] = useState([]);
    const [darazDeliveredOrdersSevenDays, setDarazDeliveredOrdersSevenDays] = useState([]);
    const [darazDeliveredOrdersThirtyDays, setDarazDeliveredOrdersThirtyDays] = useState([]);
    const [darazDeliveredOrdersCustom, setDarazDeliveredOrdersCustom] = useState([]);

    // Delivered Orders Count
    const [darazDeliveredOrdersYesterdayCount, setDarazDeliveredOrdersYesterdayCount] = useState(0);
    const [darazDeliveredOrdersSevenDaysCount, setDarazDeliveredOrdersSevenDaysCount] = useState(0);
    const [darazDeliveredOrdersThirtyDaysCount, setDarazDeliveredOrdersThirtyDaysCount] = useState(0);
    const [darazDeliveredOrdersCustomCount, setDarazDeliveredOrdersCustomCount] = useState(0);


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

    const handleProfitCalculated = (profit) => {
        setTotalProfit((prev) => prev + profit);
    };

    const renderOrder = (item, onProfitCalculated) => (
        <View style={styles.card}>
            <TextComp style={styles.orderId}>Order ID: {item.order_id}</TextComp>
            {item.order_items.map((orderItem) => (
                <OrderItem
                    key={orderItem.order_item_id}
                    item={orderItem}
                    firebaseSkus={firebaseSkus}
                    selector={selector}
                    onProfitCalculated={onProfitCalculated}
                />
            ))}
        </View>
    );

    const extractAllOrderItemIds = (orders) => {
        if (!Array.isArray(orders)) return [];
        return orders.flatMap((order) => order.order_items.map((item) => item.order_item_id));
    };

    useEffect(() => {
        setTotalProfit(0); // Reset when orders change
        extractAllOrderItemIds(darazDeliveredOrders);
    }, [darazDeliveredOrders]);

    const onChange = () => {

    }

    const [selectedRange, setSelectedRange] = useState('today');
    const [customDate, setCustomDate] = useState(null);
    const handleRangeChange = (rangeKey, date = null) => {
        setSelectedRange(rangeKey);
        if (rangeKey === 'custom') {
            setCustomDate(date);
        }
        setTotalProfit(0); // Reset profit
        // You can refetch orders based on selected range + date here
    };


    useEffect(() => {
        setDarazDeliveredOrders(selector.todayDeliveredOrders || []);
        setDarazDeliveredOrdersCount(selector.todayDeliveredOrders?.length || 0);
    }, [selector.todayDeliveredOrders]);

    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(true)

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
                console.log('Today Orders:', data.orderItems);
                setDarazDeliveredOrders(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === 'yesterday') {
                console.log('Yesterday Orders:', data.orderItems);
                setDarazDeliveredOrdersYesterday(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersYesterdayCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === '7days') {
                console.log('Last 7 Days Orders:', data.orderItems);
                setDarazDeliveredOrdersSevenDays(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersSevenDaysCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === '30days') {
                console.log('Last 30 Days Orders:', data.orderItems);
                setDarazDeliveredOrdersThirtyDays(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersThirtyDaysCount(prev => prev + data.orderItems.length);
            }
            else if (selectedRange === 'custom') {
                console.log('Custom Date Orders:', data.orderItems);
                setDarazDeliveredOrdersCustom(prev => [...prev, ...data.orderItems]);
                setDarazDeliveredOrdersCustomCount(prev => prev + data.orderItems.length);
            }

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
        }
    };


    useEffect(() => {
        if (!all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

        console.log('function');

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
                case 'custom':
                    if (customDate) {
                        updateAfter.setTime(new Date(customDate).setHours(0, 0, 0, 0));
                        updateBefore.setTime(new Date(customDate).setHours(23, 59, 59, 999));
                    }
                    break;
            }


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
    }, [selectedRange]);



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
            case 'custom':
                return darazDeliveredOrdersCustomCount;
            default:
                return 0;
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: AppColors.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: 'white' }}>

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

                        setTotalProfit(0);
                    }}
                />

                {darazOrdersLoader ?
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size={'large'} color={AppColors.primaryOrange}></ActivityIndicator>
                    </View>
                    :
                    <ScrollView>


                        <FlatList
                            scrollEnabled={false}
                            ListHeaderComponent={
                                <TextComp style={styles.headerComp}>
                                    Total Orders: {getOrdersCountBySelectedRange()}
                                </TextComp>
                            }
                            data={getOrdersBySelectedRange()}
                            keyExtractor={(item) => item.order_id.toString()}
                            renderItem={({ item }) => renderOrder(item, handleProfitCalculated)}
                            contentContainerStyle={styles.container}
                            ListEmptyComponent={
                                <TextComp style={styles.emptyTextComp}>
                                    No delivered orders found.
                                </TextComp>
                            }
                        />
                        <View style={styles.totalProfitContainer}>
                            <TextComp size={16} style={styles.profitText}>
                                Total Profit: Rs. {parseFloat(totalProfit).toFixed(2)}
                            </TextComp>
                        </View>
                    </ScrollView>
                }

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

        backgroundColor: AppColors.greenbg,
        borderRadius: 100,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
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

export default DeliveredOrders;
