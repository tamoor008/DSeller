import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../../constants/AppImages';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import InfoModal from '../../components/InfoModal';
import TextComp from '../../components/TextComp';
import { AppColors } from '../../../constants/AppColors';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../../../utils/api/baseUrl';



const OrderTabs = ({ }) => {
    const [isVisible, setIsvisible] = useState(false)
    const selector = useSelector(state => state.AppReducer);
    const [allOrder, setAllOrder] = useState([])
    const [shippedOrder, setShippedOrder] = useState([])
    const [failedOrder, setFailedOrder] = useState([])
    const [ITRSOrder, setITRSOrder] = useState([])

    const [returnOrder, setReturnOrder] = useState([])
    const [allOrderCount, setOrderCount] = useState(0)
    const [shippedOrderCount, setShippedOrderCount] = useState(0)
    const [failedOrderCount, setFailedOrderCount] = useState(0)
    const [returnOrderCount, setReturnOrderCount] = useState(0)

    const [allQuantityCount, setQuantityCountCount] = useState(0)
    const [shippedQuantityCount, setShippedQuantityCount] = useState(0)
    const [failedQuantityCount, setFailedQuantityCount] = useState(0)
    const [returnQuantityCount, setReturnQuantityCount] = useState(0)

    const [failedDeliveries, setFailedDeliveries] = useState([])

    const [all_access_tokens,setAll_access_tokens]=useState(selector.access_tokens)

    
    
    const access_token = selector.accessToken
    const onInfoPress = () => {
        setIsvisible(true)
    }

    const [orders, setOrders] = useState({
        all: {
            totalPrice: 0,
            totalOrders: allOrderCount,
            orders: [
                { id: 0, sku: 'swaat-chia-500', quantity: 2, price: 1600 },
                { id: 0, sku: 'swaat-chia-10', quantity: 1, price: 1600 },
                { id: 0, sku: 'cx-07', quantity: 2, price: 1600 },
                { id: 0, sku: 'cx-08', quantity: 2, price: 1600 },
            ],
        },
        shipped: {
            totalPrice: 0,
            totalOrders: shippedOrderCount,
            orders: [
                { id: 0, sku: 'cx-07', quantity: 2, price: 1600 },
                { id: 0, sku: 'cx-08', quantity: 2, price: 1600 },
            ],
        },
        failed: {
            totalPrice: 0,
            totalOrders: failedOrderCount,
            orders: [

                { id: 0, sku: 'cx-08', quantity: 2, price: 1600 },
            ],
        },
        returned: {
            totalOrders: returnOrderCount,
            totalPrice: 0,
            orders: [
                { id: 0, sku: 'cx-07', quantity: 1, price: 1600 },

            ],
        },
    });

    const [tabs, setTabs] = useState([]);






    const toggleTabs = (index) => {
        setTabs(prevTabs =>
            prevTabs.map((tab, i) => ({
                ...tab,
                selected: i === index
            }))
        );
    };

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.all,
                selected: tabs.find(t => t.title === AppStrings.all)?.selected || false,
                totalOrders: orders.all.totalOrders
            },
            {
                title: AppStrings.shipped,
                selected: tabs.find(t => t.title === AppStrings.shipped)?.selected || false,
                totalOrders: orders.shipped.totalOrders
            },
            {
                title: AppStrings.failed,
                selected: tabs.find(t => t.title === AppStrings.failed)?.selected || false,
                totalOrders: orders.failed.totalOrders
            },
            {
                title: AppStrings.return,
                selected: tabs.find(t => t.title === AppStrings.return)?.selected || false,
                totalOrders: orders.returned.totalOrders
            },
        ]);
    }, [orders]);

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


    const getDarazOrders = async (access_token, createdAfterISO, status) => {
        try {
            const response = await fetch(`${BASE_URL}/get-daraz-order-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&status=${status}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            // console.log("Daraz Orders Response:", data);
            setOrderCount(prev => prev + data.countTotal);

            if (status == 'shipped') {
                setShippedOrderCount(data.countTotal)
                setShippedOrder(countSkusFromOrders(data.orderItems))

            } else {
                if (status == 'shipped_back') {
                    
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setFailedOrder(newFailedOrders)
                    setFailedOrderCount(prev => prev + data.countTotal);
                }else{
                    const newFailedOrders = countSkusFromOrders(data.orderItems);
                    setITRSOrder(newFailedOrders);                
                    setFailedOrderCount(prev => prev + data.countTotal);
                }
            }


        } catch (error) {
            console.error("Error fetching Daraz orders:", error.message);
            return null;
        }
    };

    useEffect(() => {
        setFailedOrder([])
        setFailedOrderCount(0)
        setOrderCount(0)
        setShippedOrderCount(0)
        const createdAfter = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
        console.log(all_access_tokens,'all_access_tokens');

        all_access_tokens.map((item)=>{
            console.log(item,'iten');
            

            getDarazOrders(item, createdAfter, 'shipped')
            getDarazOrders(item, createdAfter, 'failed_delivery')
            getDarazOrders(item, createdAfter, 'shipped_back')
        })
      

    }, [all_access_tokens])

    useEffect(() => {
        const merged = mergeSkuCounts(failedOrder, ITRSOrder);
        setFailedDeliveries(merged)


    }, [failedOrder,ITRSOrder])

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
            {
                title: AppStrings.return,
                totalOrders: returnOrderCount,
            },
        ]);
    }, [allOrderCount, shippedOrderCount, failedOrderCount, returnOrderCount]);


    return (

        <View style={{ rowGap: 16, flex: 1 }}>

            <View style={styles.container}>
                {tabs.map((item, index) => (
                    <TouchableOpacity onPress={() => { toggleTabs(index) }} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? AppColors.primaryOrange : AppColors.black25, borderRadius: 16, paddingVertical: 4, flexDirection: 'row', columnGap: 4 }} key={index}>
                        <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: item.selected ? AppColors.white : AppColors.black50, textAlign: 'center', }}>{item.title}</TextComp>
                        <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.white, borderRadius: 100, padding: 4 }}>
                            <TextComp size={8} style={{ fontFamily: FontFamilty.semibold, color: item.selected ? AppColors.primaryOrange : AppColors.black, textAlignVertical: 'center' }}>{item.totalOrders}</TextComp>
                        </View>
                    </TouchableOpacity>
                ))}


            </View>
            {tabs[0]?.selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                    </View>

                    <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                        {allOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                            <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.primaryOrange, textDecorationLine: 'underline', flex: 2, }}>{item.sku}</TextComp>
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
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{orders.all.totalPrice}</TextComp>
                        </View>
                    </View>
                </View>
            )}

            {tabs[1]?.selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                    </View>

                    <ScrollView contentContainerStyle={{paddingBottom:24}} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                        {shippedOrder?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                            <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.primaryOrange, textDecorationLine: 'underline', flex: 2, }}>{item.sku}</TextComp>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                            </View>

                        </View>)}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{orders.shipped.totalPrice}</TextComp>
                        </View>
                    </View>
                </View>
            )}


            {tabs[2]?.selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                    </View>

                    <ScrollView contentContainerStyle={{paddingBottom:24}} style={{ paddingVertical: 8, paddingHorizontal: 16, flex: 1 }}>
                        {failedDeliveries?.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                            <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.primaryOrange, textDecorationLine: 'underline', flex: 2, }}>{item.sku}</TextComp>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.price}</TextComp>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black, flex: 1, textAlign: 'center' }}>{item.quantity}</TextComp>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.price * item.quantity}</TextComp>
                            </View>

                        </View>)}
                    </ScrollView>

                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{orders.shipped.totalPrice}</TextComp>
                        </View>
                    </View>
                </View>
            )}

            {tabs[3]?.selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderTopEndRadius: 4, borderTopLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.sku}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.price}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.quantity}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 1, textAlign: 'center' }}>{AppStrings.total}</TextComp>
                    </View>

                    <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                        {orders.returned.orders.map((item, index) => <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                            <TextComp numberOfLines={1} size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.primaryOrange, textDecorationLine: 'underline', flex: 2, }}>{item.sku}</TextComp>
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
