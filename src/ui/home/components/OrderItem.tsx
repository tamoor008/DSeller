import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Text,
    Alert,
    Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppColors } from '../../../constants/AppColors';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import LogisticsModal from './LogisticsModal';
import { getBaseUrl } from '../../../utils/api/baseUrl';


const OrderItem = ({ item, firebaseSkus, selector, onProfitCalculated, failed }) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const [darazAmount, setDarazAmount] = useState(0);
    const [productPrice, setProductPrice] = useState(0);
    const [profit, setProfit] = useState(0);

    const getCostPrice = (shop_sku) => {
        const sku = firebaseSkus.find((skuItem) => skuItem.sku === shop_sku);
        if (!sku) return 0;

        const product = selector.firebaseProducts[sku.productId];
        if (!product) return 0;

        const quantity = parseFloat(sku.productQuantity || '1');
        const pricePerUnit = parseFloat(product.price || '0');

        return quantity * pricePerUnit;
    };

    useEffect(() => {
        const start_time = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(); // 24 days ago
        const end_time = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString();   // 24 days ahead

        const fetchData = async () => {
            try {
                const response = await fetch(
                    `${BASE_URL}/get-daraz-query-income-details?access_token=${item.access_token}&start_time=${encodeURIComponent(
                        start_time
                    )}&end_time=${encodeURIComponent(
                        end_time
                    )}&trade_order_line_id=${item.order_item_id}`
                );

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const data = await response.json();
                const received = parseFloat(data?.total[0]?.total_amount || 0);
                const cost = getCostPrice(item.sku);
                const localProfit = received - cost;

                setDarazAmount(received);
                setProductPrice(cost);
                setProfit(localProfit);

                // ✅ Inform parent of calculated profit
                onProfitCalculated(localProfit,received);
            } catch (error) {
                console.error('Error fetching Daraz orders:', error.message);
            }
        };

        fetchData();
    }, []);

    const [modalVisible, setModalVisible] = useState(false);

    const logisticsSampleData={
        "data": {
            "notSuccess": false,
            "success": true,
            "module": [
                {
                    "packageDetailInfoList": [
                        {
                            "logisticDetailInfoList": [
                                {
                                    "detailType": "ready_to",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "1200",
                                    "eventTime": 1751188073355,
                                    "description": "Your parcel has been packed and ready to be handed over to our shipping provider.",
                                    "title": "Packed by seller / warehouse",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100013",
                                    "eventTime": 1751265418149,
                                    "description": "Your parcel has arrived to the main logistics facility",
                                    "title": "Arrived at Main Logistics Facility",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo",
                                    "packageLocationName": "Lahore - Shahbagh China Scheme"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100013",
                                    "eventTime": 1751286862878,
                                    "description": "Your parcel has arrived to the main logistics facility",
                                    "title": "Arrived at Main Logistics Facility",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo",
                                    "packageLocationName": "Lahore - Kot Lakh Pat"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100102",
                                    "eventTime": 1751288940000,
                                    "description": "Your parcel has departed from the main logistics facility",
                                    "title": "Departed from Main Logistics Facility",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100103",
                                    "eventTime": 1751400070000,
                                    "description": "Your parcel has arrived at the last mile hub before delivery",
                                    "title": "Arrived at Last Mile Hub",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100014",
                                    "eventTime": 1751870958000,
                                    "description": "Your parcel has departed from the last mile hub before delivery",
                                    "title": "Departed from Last Mile Hub",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100018",
                                    "eventTime": 1751870959000,
                                    "description": "Your parcel is currently out for delivery with PK-TCS",
                                    "title": "Out for Delivery",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100019",
                                    "eventTime": 1751892857000,
                                    "description": "Failed buyer delivery attempt by our 3PL due to Reason: Customer is not at delivery location .",
                                    "title": "Attempt to deliver",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                },
                                {
                                    "detailType": "ship_info",
                                    "receiveTime": 0,
                                    "proofImages": [],
                                    "code": "100030",
                                    "eventTime": 1751953151000,
                                    "description": "Our shipping provider was not able to deliver the parcel to buyer due to Reason: Customer is not at delivery location . The parcel will be returned to you.",
                                    "title": "Buyer Delivery Failed ",
                                    "class": "com.lazada.ld.api.result.LogisticDetailInfo"
                                }
                            ],
                            "class": "com.lazada.ld.api.result.LogisticPackageDetail",
                            "ofcPackageId": "FP090911226747756",
                            "trackingNumber": "779258784021"
                        }
                    ],
                    "class": "com.lazada.ld.api.result.LogisticOrderDetail"
                }
            ],
            "class": "com.alibaba.ecommerce.module.Response",
            "repeated": false,
            "retry": false
        },
        "code": "0",
        "request_id": "210158b817519852283424325",
        "_trace_id_": "2140e7c317519852283408182e7af5"
    }


    return (
        <View key={item.order_item_id} style={styles.orderItem}>
            <Image source={{ uri: item.product_main_image }} style={styles.image} />
            <View style={styles.info}>
                <TouchableOpacity onPress={() => Alert.alert('Product Name', item.access_token)}>
                    <TextComp numberOfLines={2} ellipsizeMode="tail" style={styles.productName}>
                        {item.name}
                    </TextComp>
                </TouchableOpacity>
                {failed ?
                <TouchableOpacity onPress={()=>setModalVisible(true)} style={{padding:4}}>
                    <TextComp size={16} style={{...styles.amount,color:AppColors.primaryOrange}}>
                       check logistic details
                    </TextComp>
                    </TouchableOpacity>
                    :
                    <View>
                        <TextComp style={styles.amount}>
                            Received: Rs. {parseFloat(darazAmount).toFixed(2)}
                        </TextComp>
                        <TextComp style={styles.amount}>
                            Spent: Rs. {parseFloat(productPrice).toFixed(2)}
                        </TextComp>
                    </View>}
                {failed == false && (
                    <View style={styles.profitBadge}>
                        <TextComp size={16} style={styles.profitText}>
                            Profit: Rs. {parseFloat(profit).toFixed(2)}
                        </TextComp>
                    </View>
                )}

            </View>
            <LogisticsModal
            item={item}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 60,
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
        bottom: 10,
        left: 16,
        right: 16,
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
});

export default OrderItem;
