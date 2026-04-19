import { getBaseUrl } from '../utils/api/baseUrl';

export const TokenRefreshService = {
    /**
     * Refresh tokens for all stores belonging to the user
     * @param userId - The Firebase User ID
     */
    refreshAllStores: async (userId: string) => {
        const BASE_URL = getBaseUrl();

        try {
            // 1. Fetch all stores
            const response = await fetch(`${BASE_URL}/api/stores/${userId}`);

            if (!response.ok) {
                return;
            }

            const result = await response.json();
            const stores = result.data || [];

            // 2. Iterate and refresh each store
            // We use Promise.all to do it in parallel, or for loop for serial
            // Serial is safer to avoid overwhelming backend/Daraz API
            for (const store of stores) {
                await refreshStoreToken(store, userId, BASE_URL);
            }

        } catch (error) {
        }
    }
};

/**
 * Helper to refresh a single store's token
 */
async function refreshStoreToken(store: any, userId: string, baseUrl: string) {
    const storeId = store.id || store.user?.seller?.data?.short_code;
    const refreshToken = store.user?.token?.refresh_token;

    if (!storeId || !refreshToken) {
        return;
    }


    try {
        const response = await fetch(`${baseUrl}/auth/token/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
                userId: userId,   // Pass userId to backend so it can update Firebase
                storeId: storeId  // Pass storeId to backend so it can update Firebase
            }),
        });

        if (!response.ok) {
            await response.text();
            return;
        }

        await response.json();

        // Note: We don't need to update local state here because the backend 
        // updates Firebase, and the app listens to Firebase (or re-fetches)
    } catch (error) {
    }
}
