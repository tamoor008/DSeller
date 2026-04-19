import { getBaseUrl } from './baseUrl';
import { auth } from '../../config/firebase';

/**
 * Checks if an API response indicates token expiration
 * @param response - The fetch Response object
 * @returns true if the response indicates token expiration
 */
export const isTokenExpired = (response: Response): boolean => {
    // Check for 401 Unauthorized or 403 Forbidden
    if (response.status === 401 || response.status === 403) {
        return true;
    }
    return false;
};

/**
 * Extracts seller ID from store data structure
 */
export const getSellerIdFromStore = (store: any): string | null => {
    if (!store) return null;
    return store.user?.seller?.data?.short_code ||
        store.user?.seller?.data?.seller_id ||
        store.seller_id ||
        store.id ||
        null;
};

/**
 * Extracts refresh token from store data structure
 */
export const getRefreshTokenFromStore = (store: any): string | null => {
    if (!store) return null;
    return store.user?.token?.refresh_token ||
        store.token?.refresh_token ||
        store.refresh_token ||
        null;
};

/**
 * Refreshes the access token using refresh token if available
 * @param storeInfo - Store info object containing seller_id, refresh_token, or store object
 * @returns The new access token or null if refresh failed
 */
export const refreshStoreTokenWithRefreshToken = async (storeInfo: any): Promise<string | null> => {
    try {
        const BASE_URL = getBaseUrl();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return null;
        }

        const sellerId = storeInfo?.seller_id ||
            storeInfo?.store?.user?.seller?.data?.short_code ||
            storeInfo?.store?.user?.seller?.data?.seller_id ||
            storeInfo?.store?.seller_id ||
            getSellerIdFromStore(storeInfo?.store) ||
            getSellerIdFromStore(storeInfo);

        const refreshToken = storeInfo?.refresh_token ||
            storeInfo?.store?.user?.token?.refresh_token ||
            storeInfo?.store?.token?.refresh_token ||
            getRefreshTokenFromStore(storeInfo?.store) ||
            getRefreshTokenFromStore(storeInfo);

        if (!sellerId) {
            return null;
        }

        const requestBody: any = {};
        if (refreshToken) {
            requestBody.refresh_token = refreshToken;
        }

        const url = `${BASE_URL}/api/stores/${currentUser.uid}/${sellerId}/refresh-token`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();
        if (result.error) {
            return null;
        }

        const newAccessToken = result.data?.access_token || result.access_token;
        return newAccessToken || null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
};

/**
 * Checks if response body indicates token expiration
 */
export const checkResponseForTokenExpiration = async (response: Response): Promise<boolean> => {
    if (response.status === 401 || response.status === 403) {
        return true;
    }

    try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await clonedResponse.json();
            const errorMessage = (data.error || data.message || '').toLowerCase();

            if (errorMessage.includes('expired') ||
                errorMessage.includes('invalid token') ||
                errorMessage.includes('unauthorized') ||
                (errorMessage.includes('token') && errorMessage.includes('invalid'))) {
                return true;
            }
        }
    } catch (error) {
        // Ignore error and rely on status code
    }

    return false;
};
