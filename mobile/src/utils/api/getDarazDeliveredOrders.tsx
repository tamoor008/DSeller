import { setTodayDeliveredOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';

export const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, dispatch) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    try {
        // Validate access token before making request
        if (!access_token) {
            console.warn("Missing access token for Daraz delivered orders fetch");
            return [];
        }

        const response = await fetch(
            `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`Server error ${response.status}:`, errorData.error || errorData.message || 'Unknown error');
            return [];
        }

        const data = await response.json();

        // Check if response contains an error
        if (data.error) {
            console.warn("API returned error:", data.error, data.details || '');
            return [];
        }

        // Ensure orderItems exists and is an array
        if (!data.orderItems || !Array.isArray(data.orderItems)) {
            console.warn("Invalid response format: orderItems missing or not an array");
            return [];
        }

        // ✅ Get fresh state directly from the store
        const existingOrders = store.getState().AppReducer?.todayDeliveredOrders || [];
        const newOrders = data.orderItems;
        dispatch(setTodayDeliveredOrders([...existingOrders, ...newOrders]));
        return newOrders;
    } catch (error) {
        // Silently handle errors without showing notifications
        console.warn("Error fetching Daraz delivered orders:", error.message);
        return [];
    }
};

export const getDarazFailedOrders = async (access_token, update_after, update_before, status) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    console.log('🚨 [FAILED ORDERS API] Fetching failed orders...');
    console.log('📅 [FAILED ORDERS API] Update after (filter):', update_after);
    console.log('📅 [FAILED ORDERS API] Update before (filter):', update_before);
    console.log('📋 [FAILED ORDERS API] Status:', status);
    console.log('🔗 [FAILED ORDERS API] URL:', `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token ? access_token.substring(0, 20) + '...' : 'missing'}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`);

    try {
        const response = await fetch(
            `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        console.log('✅ [FAILED ORDERS API] Response received');
        console.log('📊 [FAILED ORDERS API] Total count:', data.countTotal || 0);
        console.log('📦 [FAILED ORDERS API] Order items count:', data.orderItems?.length || 0);
        console.log('📋 [FAILED ORDERS API] Full response:', JSON.stringify(data, null, 2));

        if (!data?.orderItems?.length) {
            console.log('⚠️ [FAILED ORDERS API] No order items found in response');
            return { orderItems: [], countTotal: 0 };
        }

        console.log('📝 [FAILED ORDERS API] Order details:');
        data.orderItems.forEach((order, index) => {
            console.log(`  Failed Order ${index + 1}:`, {
                orderId: order.order_id || order.orderId,
                orderNumber: order.order_number || order.orderNumber,
                status: order.status,
                orderItems: order.order_items?.length || 0,
                createdAt: order.created_at || order.createdAt,
                updatedAt: order.updated_at || order.updatedAt,
                skus: order.order_items?.map(item => item.sku) || []
            });
        });

        return data;
    } catch (error) {
        // Silently handle errors without showing notifications
        console.warn('❌ [FAILED ORDERS API] Error fetching failed orders:', error.message);
        return { orderItems: [], countTotal: 0 };
    }
};
