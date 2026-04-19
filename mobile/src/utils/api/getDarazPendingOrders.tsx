import { setTodayPendingOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';

export const getDarazPendingOrders = async (access_token: string, createdAfterISO: string, status: string, dispatch: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    try {
        // Validate access token before making request
        if (!access_token) {
            return [];
        }

        const response = await fetch(
            `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`
        );

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

        // ✅ Get fresh state directly from the store
        const existingOrders = store.getState().AppReducer?.todayPendingOrders || [];
        const newOrders = data.orderItems;
        dispatch(setTodayPendingOrders([...existingOrders, ...newOrders]));
        return newOrders;
    } catch (error: any) {
        // Silently handle errors without showing notifications
        return [];
    }
}; 