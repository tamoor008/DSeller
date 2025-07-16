import { setTodayDeliveredOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';

export const getDarazDeliveredOrders = async (access_token, createdAfterISO, status, dispatch) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    try {
        const response = await fetch(
            `${BASE_URL}/get-daraz-delivered-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // ✅ Get fresh state directly from the store
        const existingOrders = store.getState().AppReducer?.todayDeliveredOrders || [];
        const newOrders = data?.orderItems || [];
        dispatch(setTodayDeliveredOrders([...existingOrders, ...newOrders]));
    } catch (error) {
        console.error("Error fetching Daraz orders:", error.message);
        return [];
    }
};
