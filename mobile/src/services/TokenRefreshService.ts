import { getBaseUrl } from '../utils/api/baseUrl';

export const TokenRefreshService = {
    /**
     * Refresh tokens for all stores belonging to the user
     * @param userId - The Firebase User ID
     */
    refreshAllStores: async (userId: string) => {
        const BASE_URL = getBaseUrl();
        console.log('🔄 [TOKEN REFRESH] Starting refresh for user:', userId);

        try {
            // 1. Fetch all stores
            const response = await fetch(`${BASE_URL}/api/stores/${userId}`);

            if (!response.ok) {
                console.error('❌ [TOKEN REFRESH] Failed to fetch stores:', response.status);
                return;
            }

            const result = await response.json();
            const stores = result.data || [];
            console.log(`📊 [TOKEN REFRESH] Found ${stores.length} stores to check`);

            // 2. Iterate and refresh each store
            // We use Promise.all to do it in parallel, or for loop for serial
            // Serial is safer to avoid overwhelming backend/Daraz API
            for (const store of stores) {
                await refreshStoreToken(store, userId, BASE_URL);
            }

            console.log('✅ [TOKEN REFRESH] All stores processed');
        } catch (error) {
            console.error('❌ [TOKEN REFRESH] Error during refresh process:', error);
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
        console.log(`⚠️ [TOKEN REFRESH] Skipping store ${storeId || 'unknown'} - missing ID or refresh token`);
        return;
    }

    console.log(`🔄 [TOKEN REFRESH] Refreshing token for store ${storeId}...`);

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
            const errorText = await response.text();
            console.error(`❌ [TOKEN REFRESH] Failed for store ${storeId}: ${response.status} - ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log(`✅ [TOKEN REFRESH] Successfully refreshed token for store ${storeId}`);

        // Note: We don't need to update local state here because the backend 
        // updates Firebase, and the app listens to Firebase (or re-fetches)
    } catch (error) {
        console.error(`❌ [TOKEN REFRESH] Exception for store ${storeId}:`, error);
    }
}
