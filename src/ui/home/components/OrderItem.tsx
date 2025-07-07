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
import { BASE_URL } from '../../../utils/api/baseUrl';


const OrderItem = ({ item, firebaseSkus, selector, onProfitCalculated }) => {
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
                onProfitCalculated(localProfit);
            } catch (error) {
                console.error('Error fetching Daraz orders:', error.message);
            }
        };

        fetchData();
    }, []);

    return (
        <View key={item.order_item_id} style={styles.orderItem}>
            <Image source={{ uri: item.product_main_image }} style={styles.image} />
            <View style={styles.info}>
                <TouchableOpacity onPress={() => Alert.alert('Product Name', item.access_token)}>
                    <TextComp numberOfLines={2} ellipsizeMode="tail" style={styles.productName}>
                        {item.name}
                    </TextComp>
                </TouchableOpacity>
                <View>
                    <TextComp style={styles.amount}>
                        Received: Rs. {parseFloat(darazAmount).toFixed(2)}
                    </TextComp>
                    <TextComp style={styles.amount}>
                        Spent: Rs. {parseFloat(productPrice).toFixed(2)}
                    </TextComp>
                </View>
                <View style={styles.profitBadge}>
                    <TextComp size={16} style={styles.profitText}>
                        Profit: Rs. {parseFloat(profit).toFixed(2)}
                    </TextComp>
                </View>
            </View>
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
