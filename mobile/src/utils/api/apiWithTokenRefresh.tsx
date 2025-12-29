import { getBaseUrl } from './baseUrl';
import { refreshStoreToken, isTokenExpired, getSellerIdFromStore, getAccessTokenFromStore } from './tokenRefresh';
import { useDispatch, useSelector } from 'react-redux';
import { setAccessTokens } from '../../redux/AppReducer';

/**
 * Makes an API call with automatic token refresh on expiration
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, headers, body, etc.)
 * @param store - Store object containing token and seller info (optional, for token refresh)
 * @param retryCount - Internal counter for retry attempts (default: 0)
 * @returns Promise<Response> - The fetch response
 */
export const fetchWithTokenRefresh = async (
    url: string,
    options: RequestInit = {},
    store?: any,
    retryCount: number = 0
): Promise<Response> => {
    const MAX_RETRIES = 1; // Only retry once after token refresh
    
    try {
        const response = await fetch(url, options);
        
        // Check if token expired
        if (isTokenExpired(response) && store && retryCount < MAX_RETRIES) {
            console.log('🔄 [API WITH TOKEN REFRESH] Token expired, attempting refresh...');
            
            const sellerId = getSellerIdFromStore(store);
            if (!sellerId) {
                console.warn('⚠️ [API WITH TOKEN REFRESH] Cannot refresh: seller ID not found');
                return response; // Return original response if we can't refresh
            }
            
            // Attempt to refresh token
            const newAccessToken = await refreshStoreToken(sellerId);
            
            if (newAccessToken) {
                console.log('✅ [API WITH TOKEN REFRESH] Token refreshed, retrying request...');
                
                // Update the URL with new token if it contains access_token parameter
                let newUrl = url;
                if (url.includes('access_token=')) {
                    const oldToken = getAccessTokenFromStore(store) || '';
                    newUrl = url.replace(`access_token=${oldToken}`, `access_token=${newAccessToken}`);
                }
                
                // Update store object with new token (for future use)
                if (store && store.user && store.user.token) {
                    store.user.token.access_token = newAccessToken;
                }
                
                // Retry the request with new token
                return fetchWithTokenRefresh(newUrl, options, store, retryCount + 1);
            } else {
                console.warn('⚠️ [API WITH TOKEN REFRESH] Token refresh failed');
                return response; // Return original response if refresh failed
            }
        }
        
        return response;
    } catch (error) {
        console.error('❌ [API WITH TOKEN REFRESH] Fetch error:', error);
        throw error;
    }
};

/**
 * Updates all access tokens in Redux after refreshing a specific store's token
 * @param sellerId - The seller ID that was refreshed
 * @param newAccessToken - The new access token
 */
export const updateAccessTokenInRedux = (sellerId: string, newAccessToken: string) => {
    // This would need to be called from a component with access to dispatch
    // We'll create a helper that can be used in components
    console.log('🔄 [UPDATE TOKEN] Updating token for seller:', sellerId);
};

