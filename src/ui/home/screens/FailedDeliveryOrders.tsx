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
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderDurationHeader from '../components/OrderDurationHeader';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import { setTodayDeliveredOrders } from '../../../redux/AppReducer';
import StatusTabs from '../components/StatusTabs';
import { getBaseUrl } from '../../../utils/api/baseUrl';



const FailedDeliveryOrders = ({ navigation }) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const route = useRoute();
    const selector = useSelector((state) => state.AppReducer);
    const [totalProfit, setTotalProfit] = useState(0);
    const [failedOrders, setfailedOrders] = useState([])
    const [failedOrdersCount, setfailedOrdersCount] = useState(0)
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const dispatch = useDispatch()

    const [failedOrdersYesterday, setfailedOrdersYesterday] = useState([]);
    const [failedOrdersSevenDays, setfailedOrdersSevenDays] = useState([]);
    const [failedOrdersThirtyDays, setfailedOrdersThirtyDays] = useState([]);
    const [failedOrdersCustom, setfailedOrdersCustom] = useState([]);

    const [failedOrdersYesterdayCount, setfailedOrdersYesterdayCount] = useState(0);
    const [failedOrdersSevenDaysCount, setfailedOrdersSevenDaysCount] = useState(0);
    const [failedOrdersThirtyDaysCount, setfailedOrdersThirtyDaysCount] = useState(0);
    const [failedOrdersCustomCount, setfailedOrdersCustomCount] = useState(0);

    const [returnedOrders, setReturnedOrders] = useState([]);

    const [returnedOrdersYesterday, setReturnedOrdersYesterday] = useState([]);
    const [returnedOrdersSevenDays, setReturnedOrdersSevenDays] = useState([]);
    const [returnedOrdersThirtyDays, setReturnedOrdersThirtyDays] = useState([]);
    const [returnedOrdersCustom, setReturnedOrdersCustom] = useState([]);

    const [returnedOrdersYesterdayCount, setReturnedOrdersYesterdayCount] = useState(0);
    const [returnedOrdersCount, setReturnedOrdersCount] = useState(0);
    const [returnedOrdersSevenDaysCount, setReturnedOrdersSevenDaysCount] = useState(0);
    const [returnedOrdersThirtyDaysCount, setReturnedOrdersThirtyDaysCount] = useState(0);
    const [returnedOrdersCustomCount, setReturnedOrdersCustomCount] = useState(0);

    const [returningOrders, setReturningOrders] = useState([]);
    const [returningOrdersYesterday, setReturningOrdersYesterday] = useState([]);
const [returningOrdersSevenDays, setReturningOrdersSevenDays] = useState([]);
const [returningOrdersThirtyDays, setReturningOrdersThirtyDays] = useState([]);
const [returningOrdersCustom, setReturningOrdersCustom] = useState([]);



const [returningOrdersCount, setReturningOrdersCount] = useState(0);

const [returningOrdersYesterdayCount, setReturningOrdersYesterdayCount] = useState(0);
const [returningOrdersSevenDaysCount, setReturningOrdersSevenDaysCount] = useState(0);
const [returningOrdersThirtyDaysCount, setReturningOrdersThirtyDaysCount] = useState(0);
const [returningOrdersCustomCount, setReturningOrdersCustomCount] = useState(0);


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

    const { firebaseSkus = [], failedOrderss = [] } = route.params || {};

    const handleProfitCalculated = (orderItemId, profit) => {
        if (processedItemIds.has(orderItemId)) return;

        setProcessedItemIds(prevSet => {
            const newSet = new Set(prevSet);
            newSet.add(orderItemId);
            return newSet;
        });

        setTotalProfit(prev => prev + profit);
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
                    failed={true}
                    onProfitCalculated={(profit) => handleProfitCalculated(orderItem.order_item_id, profit)}
                />
            ))}
        </View>
    );



    const onChange = () => {

    }

    const [selectedRange, setSelectedRange] = useState('today');
    const [customDate, setCustomDate] = useState(null);



    // useEffect(() => {
    //     setfailedOrders();
    //     setfailedOrdersCount(selector.todayDeliveredOrders?.length || 0);
    // }, [selector.todayDeliveredOrders]);

    const goBack = () => {
        navigation.goBack()
    }

    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)

    const getfailedOrdersLocal = async (access_token, update_after, update_before, status, date) => {
        try {
            const response = await fetch(
                `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            // console.log(data.orderItems,'data');


            if (!data?.orderItems?.length) return;


            if (selectedRange === 'today') {
                if (status === 'failed_delivery') {
                    setfailedOrders(prev => [...prev, ...data.orderItems]);
                    setfailedOrdersCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back') {
                    setReturningOrders(prev => [...prev, ...data.orderItems]);
                    setReturningOrdersCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back_success') {
                    console.log(data,'Returned orders');
                    
                    setReturnedOrders(prev => [...prev, ...data.orderItems]);
                    setReturnedOrdersCount(prev => prev + data.orderItems.length);
                }
            } else if (selectedRange === 'yesterday') {
                if (status === 'failed_delivery') {
                    setfailedOrdersYesterday(prev => [...prev, ...data.orderItems]);
                    setfailedOrdersYesterdayCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back') {
                    setReturningOrdersYesterday(prev => [...prev, ...data.orderItems]);
                    setReturningOrdersYesterdayCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back_success') {
                    setReturnedOrdersYesterday(prev => [...prev, ...data.orderItems]);
                    setReturnedOrdersYesterdayCount(prev => prev + data.orderItems.length);
                }
            } else if (selectedRange === '7days') {
                if (status === 'failed_delivery') {
                    setfailedOrdersSevenDays(prev => [...prev, ...data.orderItems]);
                    setfailedOrdersSevenDaysCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back') {
                    setReturningOrdersSevenDays(prev => [...prev, ...data.orderItems]);
                    setReturningOrdersSevenDaysCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back_success') {
                    setReturnedOrdersSevenDays(prev => [...prev, ...data.orderItems]);
                    setReturnedOrdersSevenDaysCount(prev => prev + data.orderItems.length);
                }
            } else if (selectedRange === '30days') {
                if (status === 'failed_delivery') {
                    setfailedOrdersThirtyDays(prev => [...prev, ...data.orderItems]);
                    setfailedOrdersThirtyDaysCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back') {
                    setReturningOrdersThirtyDays(prev => [...prev, ...data.orderItems]);
                    setReturningOrdersThirtyDaysCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back_success') {
                    setReturnedOrdersThirtyDays(prev => [...prev, ...data.orderItems]);
                    setReturnedOrdersThirtyDaysCount(prev => prev + data.orderItems.length);
                }
            } else if (selectedRange === 'custom') {
                if (status === 'failed_delivery') {
                    setfailedOrdersCustom(prev => [...prev, ...data.orderItems]);
                    setfailedOrdersCustomCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back') {
                    setReturningOrdersCustom(prev => [...prev, ...data.orderItems]);
                    setReturningOrdersCustomCount(prev => prev + data.orderItems.length);
                } else if (status === 'shipped_back_success') {
                    setReturnedOrdersCustom(prev => [...prev, ...data.orderItems]);
                    setReturnedOrdersCustomCount(prev => prev + data.orderItems.length);
                }
            }
            

        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
        }
    };




    useEffect(() => {
        if (!all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;


        const fetchOrders = async () => {



            switch (selectedRange) {
                case 'today':
                    setfailedOrders([]);
                    setfailedOrdersCount(0);
                    break;
                case 'yesterday':
                    setfailedOrdersYesterday([]);
                    setfailedOrdersYesterdayCount(0);
                    break;
                case '7days':
                    setfailedOrdersSevenDays([]);
                    setfailedOrdersSevenDaysCount(0);
                    break;
                case '30days':
                    setfailedOrdersThirtyDays([]);
                    setfailedOrdersThirtyDaysCount(0);
                    break;
                case 'custom':
                    setfailedOrdersCustom([]);
                    setfailedOrdersCustomCount(0);
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


            setTotalProfit(0);
            setProcessedItemIds(new Set());
            setDarazOrdersLoader(true)


            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [
                    getfailedOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'failed_delivery', selectedRange),
                    getfailedOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'shipped_back', selectedRange),
                    getfailedOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'shipped_back_success', selectedRange),
                ]);
            } else if (all_access_tokens) {

                requests = [
                    getfailedOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'failed_delivery', selectedRange),
                    getfailedOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'shipped_back', selectedRange),
                    getfailedOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'shipped_back_success', selectedRange),

                    // getfailedOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'shipped_back', selectedRange),
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

    const getOrdersBySelectedRangeAndStatus = () => {
        if (selectedRange === 'today') {
          if (selectedStatus === 'failed') return failedOrders;
          if (selectedStatus === 'returning') return returningOrders;
          if (selectedStatus === 'returned') return returnedOrders;
        } else if (selectedRange === 'yesterday') {
          if (selectedStatus === 'failed') return failedOrdersYesterday;
          if (selectedStatus === 'returning') return returningOrdersYesterday;
          if (selectedStatus === 'returned') return returnedOrdersYesterday;
        } else if (selectedRange === '7days') {
          if (selectedStatus === 'failed') return failedOrdersSevenDays;
          if (selectedStatus === 'returning') return returningOrdersSevenDays;
          if (selectedStatus === 'returned') return returnedOrdersSevenDays;
        } else if (selectedRange === '30days') {
          if (selectedStatus === 'failed') return failedOrdersThirtyDays;
          if (selectedStatus === 'returning') return returningOrdersThirtyDays;
          if (selectedStatus === 'returned') return returnedOrdersThirtyDays;
        } else if (selectedRange === 'custom') {
          if (selectedStatus === 'failed') return failedOrdersCustom;
          if (selectedStatus === 'returning') return returningOrdersCustom;
          if (selectedStatus === 'returned') return returnedOrdersCustom;
        }
      
        return [];
      };
      

    const getOrdersCountBySelectedRange = () => {
        switch (selectedRange) {
            case 'today':
                return failedOrdersCount;
            case 'yesterday':
                return failedOrdersYesterdayCount;
            case '7days':
                return failedOrdersSevenDaysCount;
            case '30days':
                return failedOrdersThirtyDaysCount;
            case 'custom':
                return failedOrdersCustomCount;
            default:
                return 0;
        }
    };
    const [selectedStatus, setSelectedStatus] = useState('failed');

    useEffect(() => {


    }, [failedOrders])

    return (
        <View style={{ flex: 1, backgroundColor: AppColors.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: 'white' }}>

                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.FailedDeliveredOrders} goBack={goBack} />
                    <SelectStore />
                </View>

                <OrderDurationHeader
                    selectedRange={selectedRange}
                    customDate={customDate}
                    onChange={(rangeKey, date) => {
                        setSelectedRange(rangeKey);

                        if (rangeKey === 'custom') {
                            setCustomDate(date);
                        }

                    }}
                />

                <StatusTabs
                    selectedStatus={selectedStatus}
                    onSelectStatus={setSelectedStatus}
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
                            data={getOrdersBySelectedRangeAndStatus()}
                            keyExtractor={(item) => item.order_id.toString()}
                            renderItem={({ item }) => renderOrder(item, handleProfitCalculated)}
                            contentContainerStyle={styles.container}
                            ListEmptyComponent={
                                <TextComp style={styles.emptyTextComp}>
                                    No Failed orders found.
                                </TextComp>
                            }
                        />

                    </ScrollView>
                }
                <View style={styles.totalProfitContainer}>
                    <TextComp size={16} style={styles.profitText}>
                        Total Profit: Rs. {parseFloat(totalProfit).toFixed(2)}
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

export default FailedDeliveryOrders;
