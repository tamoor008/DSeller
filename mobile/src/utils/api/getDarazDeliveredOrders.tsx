import { setTodayDeliveredOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';
import { refreshStoreToken, refreshStoreTokenWithRefreshToken, checkResponseForTokenExpiration } from './tokenRefresh';

export const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, dispatch, storeInfo?: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const storeName = storeInfo?.storeName || storeInfo?.name || 'Unknown Store';
    const sellerId = storeInfo?.seller_id || 'Unknown Seller ID';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 [DELIVERED ORDERS API - ${storeName}] Starting fetch`);
    console.log(`🆔 [DELIVERED ORDERS API - ${storeName}] Seller ID: ${sellerId}`);
    console.log(`📅 [DELIVERED ORDERS API - ${storeName}] Update after: ${createdAfterISO}`);
    console.log(`📋 [DELIVERED ORDERS API - ${storeName}] Status: ${status}`);

    try {
        // Validate access token before making request
        if (!access_token) {
            console.warn(`⚠️ [DELIVERED ORDERS API - ${storeName}] Missing access token`);
            return [];
        }

        let url = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
        console.log(`📤 [DELIVERED ORDERS API - ${storeName}] Request URL: ${url.replace(access_token, 'ACCESS_TOKEN_HIDDEN')}`);
        let response = await fetch(url);
        console.log(`📥 [DELIVERED ORDERS API - ${storeName}] Response status: ${response.status} ${response.statusText}`);

        // Check if token expired and refresh if needed
        const isExpired = await checkResponseForTokenExpiration(response);
        if (isExpired && storeInfo?.seller_id) {
            console.log('🔄 [DELIVERED ORDERS API] Token expired, attempting refresh...');
            const newToken = await refreshStoreTokenWithRefreshToken(storeInfo);
            
            if (newToken) {
                console.log('✅ [DELIVERED ORDERS API] Token refreshed, retrying...');
                url = url.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                response = await fetch(url);
                
                // Update the token in the store object for future use
                if (storeInfo.store?.user?.token) {
                    storeInfo.store.user.token.access_token = newToken;
                }
            }
        }

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

        // ✅ Get fresh state directly from the Redux store (not the parameter)
        const existingOrders = store.getState().AppReducer?.todayDeliveredOrders || [];
        const newOrders = data.orderItems;
        
        console.log(`📦 [DELIVERED ORDERS API - ${storeName}] Order items count: ${newOrders.length}`);
        console.log(`📈 [DELIVERED ORDERS API - ${storeName}] Count total: ${data.countTotal || newOrders.length}`);
        
        if (newOrders.length > 0) {
            console.log(`✅ [DELIVERED ORDERS API - ${storeName}] Successfully fetched ${newOrders.length} orders`);
            newOrders.forEach((order: any, index: number) => {
                console.log(`  Order ${index + 1}:`, {
                    orderId: order.order_id || order.orderNumber || 'N/A',
                    orderNumber: order.order_number || 'N/A',
                    status: order.status || 'N/A',
                    orderItemsCount: order.order_items?.length || 0,
                    store: storeName
                });
            });
        } else {
            console.log(`ℹ️ [DELIVERED ORDERS API - ${storeName}] No orders found for this store`);
        }
        
        dispatch(setTodayDeliveredOrders([...existingOrders, ...newOrders]));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return newOrders;
    } catch (error) {
        console.error(`❌ [DELIVERED ORDERS API - ${storeName}] Error:`, error.message);
        if (error instanceof Error && error.stack) {
            console.error(`❌ [DELIVERED ORDERS API - ${storeName}] Stack:`, error.stack);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return [];
    }
};

export const getDarazFailedOrders = async (access_token, update_after, update_before, status, storeInfo?: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    console.log('🚨 [FAILED ORDERS API] Fetching failed orders...');
    console.log('📅 [FAILED ORDERS API] Update after (filter):', update_after);
    console.log('📅 [FAILED ORDERS API] Update before (filter):', update_before);
    console.log('📋 [FAILED ORDERS API] Status:', status);
    console.log('🔗 [FAILED ORDERS API] URL:', `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token ? access_token.substring(0, 20) + '...' : 'missing'}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`);

    try {
        let url = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`;
        let response = await fetch(url);

        // Check if token expired and refresh if needed
        const isExpired = await checkResponseForTokenExpiration(response);
        if (isExpired && storeInfo?.seller_id) {
            console.log('🔄 [FAILED ORDERS API] Token expired, attempting refresh...');
            const newToken = await refreshStoreTokenWithRefreshToken(storeInfo);
            
            if (newToken) {
                console.log('✅ [FAILED ORDERS API] Token refreshed, retrying...');
                url = url.replace(`access_token=${access_token}`, `access_token=${newToken}`);
                response = await fetch(url);
                
                // Update the token in the store object for future use
                if (storeInfo.store?.user?.token) {
                    storeInfo.store.user.token.access_token = newToken;
                }
            }
        }

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
