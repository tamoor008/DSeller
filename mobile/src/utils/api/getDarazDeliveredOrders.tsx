import { setTodayDeliveredOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';
import { refreshStoreToken, refreshStoreTokenWithRefreshToken, checkResponseForTokenExpiration } from './tokenRefresh';

export const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, dispatch, storeInfo?: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const storeName = storeInfo?.storeName || storeInfo?.name || 'Unknown Store';
    const sellerId = storeInfo?.seller_id || 'Unknown Seller ID';


    try {
        // Validate access token before making request
        if (!access_token) {
            return [];
        }

        let url = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`;
        let response = await fetch(url);

        // Check if token expired and refresh if needed
        const isExpired = await checkResponseForTokenExpiration(response);
        if (isExpired && storeInfo?.seller_id) {
            const newToken = await refreshStoreTokenWithRefreshToken(storeInfo);

            if (newToken) {
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
            return [];
        }

        const data = await response.json();

        // Check if response contains an error
        if (data.error) {
            return [];
        }

        // Ensure orderItems exists and is an array
        if (!data.orderItems || !Array.isArray(data.orderItems)) {
            return [];
        }

        // ✅ Get fresh state directly from the Redux store (not the parameter)
        const existingOrders = store.getState().AppReducer?.todayDeliveredOrders || [];
        const newOrders = data.orderItems;


        if (newOrders.length > 0) {
            newOrders.forEach((order: any, index: number) => {
            });
        } else {
        }

        dispatch(setTodayDeliveredOrders([...existingOrders, ...newOrders]));
        return newOrders;
    } catch (error) {
        return [];
    }
};

export const getDarazFailedOrders = async (access_token, update_after, update_before, status, storeInfo?: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async


    try {
        let url = `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(update_after)}&update_before=${encodeURIComponent(update_before)}&status=${status}`;
        let response = await fetch(url);

        // Check if token expired and refresh if needed
        const isExpired = await checkResponseForTokenExpiration(response);
        if (isExpired && storeInfo?.seller_id) {
            const newToken = await refreshStoreTokenWithRefreshToken(storeInfo);

            if (newToken) {
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


        if (!data?.orderItems?.length) {
            return { orderItems: [], countTotal: 0 };
        }

        data.orderItems.forEach((order, index) => {
        });

        return data;
    } catch (error) {
        // Silently handle errors without showing notifications
        return { orderItems: [], countTotal: 0 };
    }
};
