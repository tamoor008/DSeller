import { setTodayPendingOrders } from '../../redux/AppReducer';
import { store } from '../../redux/store'; // Adjust based on your project setup
import { getBaseUrl } from './baseUrl';

export const getDarazPendingOrders = async (access_token: string, createdAfterISO: string, status: string, dispatch: any) => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    try {
        const response = await fetch(
            `${BASE_URL}/get-daraz-order-details?access_token=${access_token}&update_after=${encodeURIComponent(createdAfterISO)}&status=${status}`
        );

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // ✅ Get fresh state directly from the store
        const existingOrders = store.getState().AppReducer?.todayPendingOrders || [];
        const newOrders = data?.orderItems || [];
        dispatch(setTodayPendingOrders([...existingOrders, ...newOrders]));
    } catch (error: any) {
        console.error("Error fetching Daraz pending orders:", error.message);
        return [];
    }
}; 