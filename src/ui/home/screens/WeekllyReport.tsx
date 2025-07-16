import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {useSelector } from 'react-redux';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import OrderItem from '../components/OrderItem';
import SelectStore from '../../components/SelectStore';
import { AppStrings } from '../../../constants/AppStrings';
import Header from '../../components/Header';
import WeekRangePST from '../components/WeekRangePST';
import { getBaseUrl } from '../../../utils/api/baseUrl';


const WeekllyReport = ({ navigation }) => {
    const BASE_URL = getBaseUrl(); // instant access, no async
    const route = useRoute();
    const selector = useSelector((state) => state.AppReducer);
    const [totalProfit, setTotalProfit] = useState(0);
    const [amountReceived, setAmountReceived] = useState(0);
    const [all_access_tokens, setAll_access_tokens] = useState([]);
    const [startWeek, setStartWeek] = useState()
    const [endWeek, setEndWeek] = useState()
    const [darazDeliveredOrdersByWeek, setDarazDeliveredOrdersByWeek] = useState([]);
    const [darazDeliveredOrdersByWeekCount, setDarazDeliveredOrdersByWeekCount] = useState(0);
    const [processedItemIds, setProcessedItemIds] = useState(new Set());
    const [darazOrdersLoader, setDarazOrdersLoader] = useState(false)


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

    const handleProfitCalculated = (orderItemId, profit, amount) => {
        if (processedItemIds.has(orderItemId)) return;

        setProcessedItemIds(prevSet => {
            const newSet = new Set(prevSet);
            newSet.add(orderItemId);
            return newSet;
        });

        setTotalProfit(prev => prev + profit);
        setAmountReceived(prev => prev + amount);

    };

    const renderOrder = (item, onProfitCalculated,) => (
        <View style={styles.card}>
            <TextComp style={styles.orderId}>Order ID: {item.order_id}</TextComp>
            {item.order_items.map((orderItem) => (
                <OrderItem
                    failed={false}
                    key={orderItem.order_item_id}
                    item={orderItem}
                    firebaseSkus={firebaseSkus}
                    selector={selector}
                    onProfitCalculated={(profit, amount) => handleProfitCalculated(orderItem.order_item_id, profit, amount)}

                />
            ))}
        </View>
    );

    const goBack = () => {
        navigation.goBack()
    }

    const getDarazDeliveredOrdersLocal = async (access_token, update_after, update_before, status,) => {
        try {
            const response = await fetch(
                `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (!data?.orderItems?.length) return;


            setDarazDeliveredOrdersByWeek(prev => [...prev, ...data.orderItems]);
            setDarazDeliveredOrdersByWeekCount(prev => prev + data.orderItems.length);



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




            setDarazDeliveredOrdersByWeek([]);
            setDarazDeliveredOrdersByWeekCount(0);

            // Calculate update_after and update_before based on selectedRange
            const now = new Date();
            const updateAfter = new Date();
            const updateBefore = new Date();



            updateAfter.setTime(new Date(startWeek).getTime());     // End of week
            updateBefore.setTime(new Date(endWeek).getTime());  // Start of week
            console.log(updateAfter.toISOString(), 'updateAfter');
            console.log(updateBefore.toISOString(), 'updateBefore');






            setTotalProfit(0);
            setAmountReceived(0)
            setProcessedItemIds(new Set());
            setDarazOrdersLoader(true)


            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            let requests = [];

            if (Array.isArray(all_access_tokens)) {
                requests = all_access_tokens.flatMap(item => [

                    getDarazDeliveredOrdersLocal(item.access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'delivered'),
                ]);
            } else if (all_access_tokens) {

                requests = [

                    getDarazDeliveredOrdersLocal(all_access_tokens[0].access_token, updateAfter.toISOString(), updateBefore.toISOString(), 'delivered'),
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
    }, [startWeek]);

    const onWeekSelected = ({ start, end }) => {
        console.log('Start of week (PST in ISO):', start);
        console.log('End of week (PST in ISO):', end);
        setStartWeek(start)
        setEndWeek(end)
    }

    return (
        <View style={{ flex: 1, backgroundColor: AppColors.bgcolor }}>
            <View style={{ flex: 1, borderBottomWidth: 0, borderColor: 'white' }}>

                <View style={{ rowGap: 16, margin: 16 }}>
                    <Header title={AppStrings.weeklyReport} goBack={goBack} />
                    <SelectStore />
                </View>

                <WeekRangePST onWeekSelected={onWeekSelected} />
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
                                    Total Orders: {darazDeliveredOrdersByWeekCount}
                                </TextComp>
                            }
                            data={darazDeliveredOrdersByWeek}
                            keyExtractor={(item) => item.order_id.toString()}
                            renderItem={({ item }) => renderOrder(item, handleProfitCalculated)}
                            contentContainerStyle={styles.container}
                            ListEmptyComponent={
                                <TextComp style={styles.emptyTextComp}>
                                    No delivered orders found.
                                </TextComp>
                            }
                        />

                    </ScrollView>
                }
                <View style={styles.totalProfitContainer}>
                    <TextComp size={16} style={styles.profitText}>
                        Total Profit: Rs. {parseFloat(totalProfit).toFixed(2)}
                    </TextComp>
                    <TextComp size={16} style={styles.profitText}>
                        Total Amount Received: Rs. {parseFloat(amountReceived).toFixed(2)}
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

export default WeekllyReport;
