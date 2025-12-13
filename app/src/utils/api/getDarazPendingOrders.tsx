import { setTodayPendingOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';

export const getDarazPendingOrders = async (access_token: string, createdAfterISO: string, status: string, dispatch: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    try {
        // Validate access token before making request
        if (!access_token) {
            console.warn("Missing access token for Daraz pending orders fetch");
            return [];
        }

        const response = await fetch(
            `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`
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
        const existingOrders = store.getState().AppReducer?.todayPendingOrders || [];
        const newOrders = data.orderItems;
        dispatch(setTodayPendingOrders([...existingOrders, ...newOrders]));
        return newOrders;
    } catch (error: any) {
        // Silently handle errors without showing notifications
        console.warn("Error fetching Daraz pending orders:", error.message);
        return [];
    }
}; 