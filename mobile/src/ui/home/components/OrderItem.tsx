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
    ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../context/ThemeContext';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import LogisticsModal from './LogisticsModal';
import { getBaseUrl } from '../../../utils/api/baseUrl';


interface OrderItemProps {
    item: any;
    firebaseSkus: any[];
    selector: any;
    onProfitCalculated: (profit: number, received: number) => void;
    failed?: boolean;
    pending?: boolean;
    onMakeReadyToShip?: (orderId: string) => void;
    readyToShip?: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({ item, firebaseSkus, selector, onProfitCalculated, failed, pending, onMakeReadyToShip, readyToShip }) => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async
    const styles = getStyles(theme);

    const [darazAmount, setDarazAmount] = useState(0);
    const [productPrice, setProductPrice] = useState(0);
    const [profit, setProfit] = useState(0);

    const getCostPrice = (shop_sku: string) => {
        const sku = firebaseSkus.find((skuItem: any) => skuItem.sku === shop_sku);
        if (!sku) return 0;

        // New SKU schema:
        // - price: base SKU cost
        // - totalPrice: base SKU cost + packaging
        const totalPrice = parseFloat(sku.totalPrice ?? '0') || 0;
        if (totalPrice > 0) return totalPrice;

        // Backward compatibility for legacy SKU records.
        const basePrice = parseFloat(sku.price ?? '0') || 0;
        const packagingPrice = parseFloat(sku.packagingPrice ?? '0') || 0;
        if (basePrice > 0 || packagingPrice > 0) {
            return basePrice + packagingPrice;
        }

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
                // Check if required item properties exist
                if (!item?.access_token || !item?.order_item_id) {
                    console.warn(`Missing required properties for order ${item?.order_id || 'unknown'}:`, {
                        access_token: !!item?.access_token,
                        order_item_id: !!item?.order_item_id
                    });
                    return;
                }

                const response = await fetch(
                    `${BASE_URL}/get-daraz-query-income-details?access_token=${item.access_token}&start_time=${encodeURIComponent(
                        start_time
                    )}&end_time=${encodeURIComponent(
                        end_time
                    )}&trade_order_line_id=${item.order_item_id}`
                );

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const data = await response.json();

                // Handle the correct response structure
                const received = parseFloat((data?.data?.total?.[0]?.total_amount || 0).toString().replace(/,/g, ''));
                const cost = getCostPrice(item.sku);
                const localProfit = received - cost;

                setDarazAmount(received);
                setProductPrice(cost);
                setProfit(localProfit);

                // ✅ Inform parent of calculated profit/cost
                if (readyToShip || pending) {
                    onProfitCalculated(cost, received);
                } else {
                    onProfitCalculated(localProfit, received);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                console.warn('⚠️ [OrderItem] Error fetching Income Detail of order:', errorMessage);
                // Set default values on error - don't show alert as this happens for each item
                setDarazAmount(0);
                setProductPrice(0);
                setProfit(0);
                onProfitCalculated(0, 0);
            }
        };

        fetchData();
    }, []);

    const [modalVisible, setModalVisible] = useState(false);
    const [incomeModalVisible, setIncomeModalVisible] = useState(false);
    const [incomeDetails, setIncomeDetails] = useState<any>(null);
    const [incomeLoading, setIncomeLoading] = useState(false);

    const fetchIncomeDetails = async () => {
        console.log('fetchIncomeDetails called with item:', item);
        setIncomeLoading(true);
        try {
            // Check if required item properties exist
            if (!item?.access_token || !item?.order_item_id) {
                console.log('Missing required properties:', { access_token: item?.access_token, order_item_id: item?.order_item_id });
                Alert.alert('Error', 'Missing required order information');
                return;
            }

            const start_time = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(); // 24 days ago
            const end_time = new Date(Date.now()).toISOString();   // 24 days ahead


            console.log('start_time', start_time);
            console.log('end_time', end_time);

            const response = await fetch(
                `${BASE_URL}/get-daraz-query-income-details?access_token=${item.access_token}&start_time=${encodeURIComponent(
                    start_time
                )}&end_time=${encodeURIComponent(
                    end_time
                )}&trade_order_line_id=${item.order_item_id}`
            );

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            console.log('Income Details Response:', JSON.stringify(data, null, 2));

            setIncomeDetails(data);
            setIncomeModalVisible(true);
            console.log('Modal visibility set to true, incomeDetails:', data);
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            console.warn('⚠️ [OrderItem] Error fetching income details:', errorMessage);
            Alert.alert('Error', 'Failed to fetch income details. Please try again.', [{ text: 'OK' }]);
        } finally {
            setIncomeLoading(false);
        }
    };

    return (
        <View key={item.order_item_id} style={styles.orderItem}>
            <Image source={{ uri: item.product_main_image }} style={styles.image} />
            <View style={styles.info}>
                <TouchableOpacity onPress={() => Alert.alert('Product Name', item.name)}>
                    <TextComp numberOfLines={2} size={16} style={styles.productName}>
                        {item.name}
                    </TextComp>
                </TouchableOpacity>
                {pending ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (onMakeReadyToShip) {
                                onMakeReadyToShip(item.order_id);
                            } else {
                                Alert.alert('Action', 'Make this order ready to ship?');
                            }
                        }}
                        style={{ padding: 8, backgroundColor: theme.primaryOrange, borderRadius: 8, marginTop: 8 }}
                    >
                        <TextComp size={16} numberOfLines={1} style={{ color: theme.white, textAlign: 'center' }}>
                            Make Ready to Ship
                        </TextComp>
                    </TouchableOpacity>
                ) : failed ? (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 4 }}>
                        <TextComp size={16} numberOfLines={1} style={{ ...styles.amount, color: theme.primaryOrange }}>
                            check logistic details
                        </TextComp>
                    </TouchableOpacity>
                ) : readyToShip ? (
                    <></>
                ) : (
                    <View>
                        <TextComp size={16} numberOfLines={1} style={styles.amount}>
                            Received: Rs. {parseFloat(darazAmount.toString()).toFixed(2)}
                        </TextComp>
                        <TextComp size={16} numberOfLines={1} style={styles.amount}>
                            Spent: Rs. {parseFloat(productPrice.toString()).toFixed(2)}
                        </TextComp>
                    </View>
                )}
                {failed == false && !pending && !readyToShip && (
                    <View style={styles.profitBadge}>
                        <TextComp size={16} numberOfLines={1} style={styles.profitText}>
                            Profit: Rs. {parseFloat((profit ?? 0).toString()).toFixed(2)}
                        </TextComp>
                    </View>
                )}

                {readyToShip && (
                    <View style={styles.profitBadge}>
                        <TextComp size={16} numberOfLines={1} style={styles.profitText}>
                            Cost Price: Rs. {parseFloat((productPrice ?? 0).toString()).toFixed(2)}
                        </TextComp>
                    </View>
                )}

                {/* Income Details Button - Only for Delivered Orders */}
                {!pending && !readyToShip && !failed && (
                    <TouchableOpacity
                        onPress={() => {
                            console.log('Income Details button pressed for item:', item.order_item_id);
                            fetchIncomeDetails();
                        }}
                        style={{
                            padding: 6,
                            backgroundColor: theme.primaryOrange,
                            borderRadius: 6,
                            marginTop: 8,
                            alignItems: 'center'
                        }}
                        disabled={incomeLoading}
                    >
                        <TextComp size={14} numberOfLines={1} style={{ color: theme.white, textAlign: 'center', fontFamily: FontFamilty.medium }}>
                            {incomeLoading ? 'Loading...' : 'View Income Details'}
                        </TextComp>
                    </TouchableOpacity>
                )}

            </View>
            <LogisticsModal
                item={item}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />

            {/* Income Details Modal */}
            <Modal
                visible={incomeModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIncomeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TextComp size={18} numberOfLines={1} style={styles.modalTitle}>
                                Income Details
                            </TextComp>
                            <TouchableOpacity onPress={() => setIncomeModalVisible(false)}>
                                <TextComp size={20} numberOfLines={1} style={styles.closeButton}>×</TextComp>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                            {incomeDetails ? (
                                <View>
                                    <TextComp size={16} numberOfLines={1} style={styles.sectionTitle}>
                                        Order Item ID: {item.order_item_id}
                                    </TextComp>

                                    {incomeDetails.data?.total && incomeDetails.data.total.length > 0 && (
                                        <View style={styles.totalSection}>
                                            <TextComp size={16} numberOfLines={1} style={styles.sectionTitle}>
                                                Total Summary:
                                            </TextComp>
                                            <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                Order No: {incomeDetails.data.total[0]?.order_no || 'N/A'}
                                            </TextComp>
                                            <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                Total Amount: Rs. {parseFloat((incomeDetails.data.total[0]?.total_amount || 0).toString().replace(/,/g, '')).toFixed(2)}
                                            </TextComp>
                                        </View>
                                    )}

                                    {incomeDetails.data?.summary && (
                                        <View style={styles.summarySection}>
                                            <TextComp size={16} numberOfLines={1} style={styles.sectionTitle}>
                                                Summary:
                                            </TextComp>
                                            <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                Total Transactions: {incomeDetails.data.summary.totalTransactions || 0}
                                            </TextComp>
                                            <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                Total Orders: {incomeDetails.data.summary.totalOrders || 0}
                                            </TextComp>
                                            <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                Total Amount: Rs. {parseFloat((incomeDetails.data.summary.totalAmount || 0).toString().replace(/,/g, '')).toFixed(2)}
                                            </TextComp>
                                        </View>
                                    )}

                                    {incomeDetails.data?.transactions && incomeDetails.data.transactions.length > 0 && (
                                        <View style={styles.transactionsSection}>
                                            <TextComp size={16} numberOfLines={1} style={styles.sectionTitle}>
                                                Transactions:
                                            </TextComp>
                                            {incomeDetails.data.transactions.map((transaction: any, index: number) => (
                                                <View key={index} style={styles.transactionItem}>
                                                    <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                        Fee Name: {transaction.fee_name || 'N/A'}
                                                    </TextComp>
                                                    <TextComp size={14} numberOfLines={1} style={styles.detailText}>
                                                        Amount: Rs. {parseFloat((transaction.amount || 0).toString().replace(/,/g, '')).toFixed(2)}
                                                    </TextComp>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {(!incomeDetails.data?.total || incomeDetails.data.total.length === 0) &&
                                        (!incomeDetails.data?.transactions || incomeDetails.data.transactions.length === 0) && (
                                            <TextComp size={16} numberOfLines={1} style={styles.noDataText}>
                                                No income details found for this order item.
                                            </TextComp>
                                        )}
                                </View>
                            ) : (
                                <TextComp size={16} numberOfLines={1} style={styles.noDataText}>
                                    Loading income details...
                                </TextComp>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 60,
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
        bottom: 10,
        left: 16,
        right: 16,
        backgroundColor: theme.greenbg,
        borderRadius: 100,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTextComp: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: theme.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalTitle: {
        fontWeight: 'bold',
        color: theme.textPrimary,
        fontFamily: FontFamilty.bold,
    },
    closeButton: {
        color: theme.textSecondary,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: theme.textPrimary,
        marginBottom: 8,
        fontFamily: FontFamilty.bold,
    },
    totalSection: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: theme.bgcolor,
        borderRadius: 8,
    },
    summarySection: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: theme.greenbg,
        borderRadius: 8,
    },
    transactionsSection: {
        marginBottom: 16,
    },
    transactionItem: {
        padding: 12,
        backgroundColor: theme.bgcolor,
        borderRadius: 8,
        marginBottom: 8,
    },
    detailText: {
        color: theme.textSecondary,
        marginBottom: 4,
        fontFamily: FontFamilty.medium,
    },
    noDataText: {
        textAlign: 'center',
        color: theme.textSecondary,
        fontStyle: 'italic',
        fontFamily: FontFamilty.medium,
    },
});

export default OrderItem;
