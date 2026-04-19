import React, { useEffect, useState } from 'react';
import { AppColors } from '../constants/colors';
import { getBaseUrl } from '../utils/api/baseUrl';
import InfoModal from './InfoModal';
import { useAlert } from '../context/AlertContext';

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

const OrderItem: React.FC<OrderItemProps> = ({
    item,
    firebaseSkus,
    selector,
    onProfitCalculated,
    failed,
    pending,
    onMakeReadyToShip,
    readyToShip
}) => {
    const { showAlert } = useAlert();
    const BASE_URL = getBaseUrl();
    const [darazAmount, setDarazAmount] = useState(0);
    const [productPrice, setProductPrice] = useState(0);
    const [profit, setProfit] = useState(0);
    const [incomeModalVisible, setIncomeModalVisible] = useState(false);
    const [incomeDetails, setIncomeDetails] = useState<any>(null);
    const [incomeLoading, setIncomeLoading] = useState(false);

    const getCostPrice = (shop_sku: string) => {
        const sku = firebaseSkus.find((skuItem: any) => skuItem.sku === shop_sku);
        if (!sku) return 0;

        const totalPrice = parseFloat(sku.totalPrice ?? '0') || 0;
        if (totalPrice > 0) return totalPrice;

        const basePrice = parseFloat(sku.price ?? '0') || 0;
        const packagingPrice = parseFloat(sku.packagingPrice ?? '0') || 0;
        if (basePrice > 0 || packagingPrice > 0) {
            return basePrice + packagingPrice;
        }

        const product = selector.firebaseProducts?.[sku.productId];
        if (!product) return 0;

        const quantity = parseFloat(sku.productQuantity || '1');
        const pricePerUnit = parseFloat(product.price || '0');
        return quantity * pricePerUnit;
    };

    useEffect(() => {
        const start_time = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString();
        const end_time = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString();

        const fetchData = async () => {
            try {
                if (!item?.access_token || !item?.order_item_id) return;

                const response = await fetch(
                    `${BASE_URL}/get-daraz-query-income-details?access_token=${item.access_token}&start_time=${encodeURIComponent(
                        start_time
                    )}&end_time=${encodeURIComponent(
                        end_time
                    )}&trade_order_line_id=${item.order_item_id}`
                );

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const data = await response.json();
                const received = parseFloat((data?.data?.total?.[0]?.total_amount || 0).toString().replace(/,/g, ''));
                const cost = getCostPrice(item.sku);
                const localProfit = received - cost;

                setDarazAmount(received);
                setProductPrice(cost);
                setProfit(localProfit);

                if (readyToShip || pending) {
                    onProfitCalculated(cost, received);
                } else {
                    onProfitCalculated(localProfit, received);
                }
            } catch (error) {
                // Silently handle error for list view
            }
        };

        fetchData();
    }, [item.sku, item.access_token, item.order_item_id]);

    const fetchIncomeDetails = async () => {
        setIncomeLoading(true);
        try {
            if (!item?.access_token || !item?.order_item_id) {
                showAlert('Error', 'Missing required order information');
                return;
            }

            const start_time = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString();
            const end_time = new Date().toISOString();

            const response = await fetch(
                `${BASE_URL}/get-daraz-query-income-details?access_token=${item.access_token}&start_time=${encodeURIComponent(
                    start_time
                )}&end_time=${encodeURIComponent(
                    end_time
                )}&trade_order_line_id=${item.order_item_id}`
            );

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            setIncomeDetails(data);
            setIncomeModalVisible(true);
        } catch (error) {
            showAlert('Error', 'Failed to fetch income details');
        } finally {
            setIncomeLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            padding: '12px',
            borderBottom: `1px solid ${AppColors.border}`,
            backgroundColor: AppColors.card,
            borderRadius: '12px',
            marginBottom: '12px',
            gap: '12px'
        }}>
            <img
                src={item.product_main_image}
                alt={item.name}
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    color: AppColors.textPrimary,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {item.name}
                </h4>

                {pending ? (
                    <button
                        onClick={() => onMakeReadyToShip?.(item.order_id)}
                        style={{
                            backgroundColor: AppColors.primaryOrange,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '8px',
                            width: 'fit-content'
                        }}
                    >
                        Make Ready to Ship
                    </button>
                ) : (
                    <div style={{ fontSize: '13px', color: AppColors.textSecondary }}>
                        <div>Received: Rs. {darazAmount.toFixed(2)}</div>
                        <div>Spent: Rs. {productPrice.toFixed(2)}</div>
                    </div>
                )}

                {((!pending && !readyToShip && !failed) || readyToShip) && (
                    <div style={{
                        backgroundColor: AppColors.greenbg || '#E8F5E9',
                        color: AppColors.green || '#2E7D32',
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: 600,
                        width: 'fit-content'
                    }}>
                        {readyToShip ? `Cost: Rs. ${productPrice.toFixed(2)}` : `Profit: Rs. ${profit.toFixed(2)}`}
                    </div>
                )}

                {!pending && !readyToShip && !failed && (
                    <button
                        onClick={fetchIncomeDetails}
                        disabled={incomeLoading}
                        style={{
                            backgroundColor: 'transparent',
                            color: AppColors.primaryOrange,
                            border: `1px solid ${AppColors.primaryOrange}`,
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '4px',
                            width: 'fit-content'
                        }}
                    >
                        {incomeLoading ? 'Loading...' : 'View Income Details'}
                    </button>
                )}
            </div>

            {/* Income Details Modal */}
            {incomeModalVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px',
                            borderBottom: `1px solid ${AppColors.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Income Details</h3>
                            <button
                                onClick={() => setIncomeModalVisible(false)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                            >×</button>
                        </div>
                        <div style={{ padding: '16px', overflowY: 'auto' }}>
                            {incomeDetails?.data?.total?.[0] && (
                                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>Total Amount: Rs. {parseFloat(incomeDetails.data.total[0].total_amount.toString().replace(/,/g, '')).toFixed(2)}</div>
                                </div>
                            )}
                            {incomeDetails?.data?.transactions?.map((t: any, i: number) => (
                                <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{t.fee_name}</span>
                                    <span style={{ fontWeight: 600 }}>Rs. {parseFloat(t.amount.toString().replace(/,/g, '')).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderItem;
