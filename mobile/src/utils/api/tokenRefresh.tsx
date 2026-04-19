import { getBaseUrl } from './baseUrl';
import { Alert } from 'react-native';
import { auth } from '../../../firebase';

/**
 * Refreshes the access token for a specific store (legacy function, use refreshStoreTokenWithRefreshToken instead)
 * @param sellerId - The seller ID (store ID) to refresh token for
 * @returns The new access token or null if refresh failed
 */
export const refreshStoreToken = async (sellerId: string | any): Promise<string | null> => {
    // If sellerId is actually a storeInfo object, use the new function
    if (typeof sellerId === 'object' && sellerId !== null) {
        return refreshStoreTokenWithRefreshToken(sellerId);
    }

    // Otherwise, create a storeInfo object with just seller_id
    return refreshStoreTokenWithRefreshToken({ seller_id: sellerId });
};

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

    // Check response body for token expiration messages
    // This will be checked after reading the response
    return false;
};

/**
 * Extracts seller ID from store data structure
 * @param store - Store object with user.seller.data structure
 * @returns Seller ID or null
 */
export const getSellerIdFromStore = (store: any): string | null => {
    if (!store) return null;

    // Try different possible paths for seller ID
    return store.user?.seller?.data?.short_code ||
        store.user?.seller?.data?.seller_id ||
        store.seller_id ||
        store.id ||
        null;
};

/**
 * Extracts access token from store data structure
 * @param store - Store object with user.token.access_token structure
 * @returns Access token or null
 */
export const getAccessTokenFromStore = (store: any): string | null => {
    if (!store) return null;

    // Try different possible paths for access token
    return store.user?.token?.access_token ||
        store.token?.access_token ||
        store.access_token ||
        null;
};

/**
 * Extracts refresh token from store data structure
 * @param store - Store object with user.token.refresh_token structure
 * @returns Refresh token or null
 */
export const getRefreshTokenFromStore = (store: any): string | null => {
    if (!store) return null;

    // Try different possible paths for refresh token
    return store.user?.token?.refresh_token ||
        store.token?.refresh_token ||
        store.refresh_token ||
        null;
};

/**
 * Checks if access token is expired based on expires_in timestamp
 * @param storeInfo - Store info object with expires_in or token creation time
 * @returns true if token is expired or will expire soon (within 1 hour)
 */
export const isTokenExpiredByTime = (storeInfo: any): boolean => {
    if (!storeInfo) return false;

    // If we have expires_in (seconds until expiration), calculate expiration time
    const expiresIn = storeInfo.expires_in || storeInfo.store?.user?.token?.expires_in || storeInfo.store?.token?.expires_in;

    if (expiresIn) {
        // If we have token creation time, use it; otherwise assume token was just created
        const tokenCreatedAt = storeInfo.token_created_at || storeInfo.store?.token_created_at;
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        if (tokenCreatedAt) {
            const expirationTime = tokenCreatedAt + expiresIn;
            const timeUntilExpiration = expirationTime - now;
            // Consider expired if less than 1 hour remaining (3600 seconds)
            return timeUntilExpiration < 3600;
        }
    }

    // If we don't have expiration info, return false (assume not expired)
    return false;
};

/**
 * Refreshes the access token using refresh token if available, otherwise uses seller ID
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

        // Extract seller ID and refresh token
        const sellerId = storeInfo?.seller_id ||
            storeInfo?.store?.user?.seller?.data?.short_code ||
            storeInfo?.store?.user?.seller?.data?.seller_id ||
            storeInfo?.store?.seller_id ||
            getSellerIdFromStore(storeInfo?.store) ||
            getSellerIdFromStore(storeInfo);

        // Extract refresh token - check multiple possible paths
        const refreshToken = storeInfo?.refresh_token ||
            storeInfo?.store?.user?.token?.refresh_token ||
            storeInfo?.store?.token?.refresh_token ||
            getRefreshTokenFromStore(storeInfo?.store) ||
            getRefreshTokenFromStore(storeInfo);

        if (!sellerId) {
            return null;
        }

        const storeName = storeInfo?.storeName || storeInfo?.name || 'Unknown Store';

        // Build request body with refresh token if available
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
            const errorData = await response.json().catch(() => ({}));
            return null;
        }

        const result = await response.json();

        if (result.error) {
            return null;
        }

        const newAccessToken = result.data?.access_token || result.access_token;
        const newRefreshToken = result.data?.refresh_token || result.refresh_token;

        if (newAccessToken) {
            if (newRefreshToken) {
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return newAccessToken;
        }

        return null;
    } catch (error) {
        const storeName = storeInfo?.storeName || storeInfo?.name || 'Unknown Store';
        return null;
    }
};

/**
 * Checks if response body indicates token expiration
 * Note: This clones the response so the original can still be read
 * @param response - The fetch Response object
 * @returns Promise<boolean> - true if the response indicates token expiration
 */
export const checkResponseForTokenExpiration = async (response: Response): Promise<boolean> => {
    // Check status codes first (most reliable indicator)
    if (response.status === 401 || response.status === 403) {
        return true;
    }

    // Check response body for token expiration messages (only if status is not 401/403)
    // Clone the response so we can read it without consuming the original
    try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await clonedResponse.json();
            const errorMessage = (data.error || data.message || '').toLowerCase();

            // Check for common token expiration messages
            if (errorMessage.includes('expired') ||
                errorMessage.includes('invalid token') ||
                errorMessage.includes('unauthorized') ||
                (errorMessage.includes('token') && errorMessage.includes('invalid'))) {
                return true;
            }
        }
    } catch (error) {
        // If we can't parse the response, just rely on status code
        // This is fine - status codes are the primary indicator
    }

    return false;
};

