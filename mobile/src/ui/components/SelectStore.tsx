import React, { useEffect, useState, useRef } from 'react';
import {
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from './TextComp';
import { auth } from '../../../firebase';
import WebView from 'react-native-webview';
import { setAccessToken, setAccessTokens, setSelectedStore } from '../../redux/AppReducer';
import { useDispatch, useSelector } from 'react-redux';
import { getBaseUrl } from '../../utils/api/baseUrl';
import { fetchWithTimeout } from '../../utils/api/fetchWithTimeout';


let storesCacheByUser: { [userId: string]: any[] } = {};
let hasCheckedApiHealth = false;

const SelectStore = () => {
    const { theme } = useTheme();
    const BASE_URL = getBaseUrl(); // instant access, no async

    const currentUser = auth.currentUser
    const [darazOAuth, setDarazOAuth] = useState(false)
    const [stores, setStores] = useState([])
    const selector = useSelector(state => state.AppReducer);
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false);
    const [storesLoading, setStoresLoading] = useState(true); // Loading state for stores
    const [code, setCode] = useState('CODE')

    const CLIENT_ID = '503646';
    const REDIRECT_URI = 'https://www.moonsys.co';
    const AUTH_URL = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`;

    useEffect(() => {
        // console.log(AUTH_URL, 'AUTH_URL');
    }, [AUTH_URL]);

    // Health check function to test if API is working
    const checkApiHealth = async () => {
        try {
            // console.log('🔍 [API Health Check] Testing API connection...');
            // console.log('📍 [API Health Check] URL:', `${BASE_URL}/test`);

            const response = await fetchWithTimeout(`${BASE_URL}/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }, 5000);

            // console.log('📊 [API Health Check] Response Status:', response.status);
            // console.log('📊 [API Health Check] Response OK:', response.ok);
            // console.log('📊 [API Health Check] Content-Type:', response.headers.get('content-type'));

            // Get response as text first to handle both JSON and plain text responses
            const responseText = await response.text();
            // console.log('📥 [API Health Check] Raw Response Text:', responseText);

            let data;
            try {
                // Try to parse as JSON
                data = JSON.parse(responseText);
                // console.log('✅ [API Health Check] Parsed as JSON:', JSON.stringify(data, null, 2));
            } catch (jsonError) {
                // If not JSON, treat as plain text
                // console.log('ℹ️ [API Health Check] Response is not JSON, treating as plain text');
                data = responseText;
                // console.log('✅ [API Health Check] Response Data (text):', data);
            }

            return { success: response.ok, data, isJson: typeof data === 'object' };
        } catch (error) {
            // console.error('❌ [API Health Check] Error:', error);
            // console.error('❌ [API Health Check] Error Type:', error instanceof Error ? error.constructor.name : typeof error);
            // console.error('❌ [API Health Check] Error Message:', error instanceof Error ? error.message : String(error));
            if (error instanceof Error && error.stack) {
                // console.error('❌ [API Health Check] Stack Trace:', error.stack);
            }
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    };


    const addAccessToken = async (user) => {
        try {
            const sellerId = user.seller_id || user.user?.seller?.data?.short_code;

            // console.log('💾 [Backend] Starting addAccessToken operation...');
            // console.log('👤 [Backend] User UID:', currentUser.uid);
            // console.log('🏪 [Backend] Seller ID:', sellerId);
            // console.log('📦 [Backend] User Data Keys:', Object.keys(user));

            // console.log('🔍 [Backend] Checking if seller already exists...');

            // Add store via backend API
            const response = await fetchWithTimeout(`${BASE_URL}/api/stores/${currentUser.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storeId: sellerId,
                    storeData: { user }
                }),
            }, 10000);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Unknown error';
                // console.warn('⚠️ [SelectStore] Error adding store:', errorMessage);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.data.added) {
                // console.log('⚠️ [Backend] Store already connected:', sellerId);
                return { added: false, reason: 'already_exists' };
            }

            // console.log('✅ [Backend] Seller added successfully!');
            // console.log('✅ [Backend] Seller ID:', sellerId);

            // Refresh stores list after adding
            if (fetchStoresRef.current) {
                // console.log('🔄 [SelectStore] Refreshing stores list after adding new store...');
                setTimeout(() => {
                    fetchStoresRef.current?.(true);
                }, 500); // Small delay to ensure backend has processed the addition
            }

            return { added: true, sellerId };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorType = error instanceof Error ? error.constructor.name : typeof error;
            // console.warn('⚠️ [SelectStore] Error saving seller data:', errorMessage);
            // console.warn('⚠️ [SelectStore] Error Type:', errorType);
            if (error instanceof Error && error.stack) {
                // console.warn('⚠️ [SelectStore] Stack Trace:', error.stack);
            }
            Alert.alert('Error', 'Failed to save store data. Please try again.', [{ text: 'OK' }]);
            throw error;
        }
    };

    // Store the fetch function reference so we can call it manually when needed
    const fetchStoresRef = useRef<((force?: boolean) => Promise<void>) | null>(null);

    const listenToStores = (currentUser, setStores) => {
        if (!currentUser || !currentUser.uid) {
            // console.warn('User not authenticated');
            return;
        }

        const buildAccessTokens = (dataset: any[]) => {
            return dataset
                .map((item: any) => {
                    const token = item.user?.token || item.token || {};
                    const access_token = token.access_token;
                    const refresh_token = token.refresh_token;
                    const expires_in = token.expires_in;
                    const refresh_expires_in = token.refresh_expires_in;

                    return {
                        access_token: access_token,
                        refresh_token: refresh_token,
                        expires_in: expires_in,
                        refresh_expires_in: refresh_expires_in,
                        name: item.user?.seller?.data?.name || item.user?.seller?.name,
                        seller_id: item.user?.seller?.data?.short_code ||
                            item.user?.seller?.data?.seller_id ||
                            item.seller_id ||
                            item.id,
                        store: item,
                    };
                })
                .filter((token: any) => token.access_token && token.access_token.trim() !== '');
        };

        const fetchStores = async (force: boolean = false) => {
            try {
                const cachedStores = storesCacheByUser[currentUser.uid];
                if (!force && Array.isArray(cachedStores)) {
                    dispatch(setAccessTokens(buildAccessTokens(cachedStores)));
                    setStores(cachedStores);
                    setStoresLoading(false);
                    return;
                }

                setStoresLoading(true); // Start loading
                const requestUrl = `${BASE_URL}/api/stores/${currentUser.uid}`;
                // console.log('📤 [SELECT STORE] Fetching stores...');
                // console.log('📤 [SELECT STORE] Request URL:', requestUrl);
                // console.log('📤 [SELECT STORE] User ID:', currentUser.uid);

                const response = await fetchWithTimeout(requestUrl, {}, 8000);

                // console.log('📥 [SELECT STORE] Response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || errorData.message || 'Unknown error';
                    // console.warn('⚠️ [SELECT STORE] HTTP Error:', response.status);
                    // console.warn('⚠️ [SELECT STORE] Error message:', errorMessage);
                    Alert.alert('Error', 'Failed to load stores. Please try again.', [{ text: 'OK' }]);
                    setStores([]);
                    setStoresLoading(false); // Stop loading
                    return;
                }

                const result = await response.json();
                // console.log('✅ [SELECT STORE] Response received');
                // console.log('📊 [SELECT STORE] Response data:', JSON.stringify(result, null, 2));

                if (result.error) {
                    const errorMessage = result.error || 'Unknown error';
                    // console.warn('⚠️ [SELECT STORE] API returned error:', errorMessage);
                    // console.warn('⚠️ [SELECT STORE] Error message:', result.message || 'No message');
                    Alert.alert('Error', result.message || 'Failed to load stores. Please try again.', [{ text: 'OK' }]);
                    setStores([]);
                    setStoresLoading(false); // Stop loading
                    return;
                }

                const dataset = result.data || [];
                // console.log('📦 [SELECT STORE] Stores count:', dataset.length);

                storesCacheByUser[currentUser.uid] = dataset;
                const access_tokens = buildAccessTokens(dataset);

                // console.log('🔑 [SELECT STORE] Access tokens extracted:', access_tokens.length);
                // console.log('🔑 [SELECT STORE] Valid access tokens:', access_tokens.length, 'out of', dataset.length, 'stores');
                // console.log('🔑 [SELECT STORE] Access tokens:', access_tokens.map((t: any) => ({
                //     name: t.name,
                //     seller_id: t.seller_id,
                //     has_refresh_token: !!t.refresh_token,
                //     expires_in: t.expires_in ? `${Math.floor(t.expires_in / 86400)} days` : 'N/A',
                //     token_preview: t.access_token ? t.access_token.substring(0, 10) + '...' : 'N/A'
                // })));

                dispatch(setAccessTokens(access_tokens));
                setStores(dataset);
                // console.log('✅ [SELECT STORE] Stores state updated successfully');
                setStoresLoading(false); // Stop loading
            } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error occurred';
                // console.warn('⚠️ [SELECT STORE] Exception:', errorMessage);
                // console.warn('⚠️ [SELECT STORE] Error type:', error?.name || 'Unknown');
                if (error?.stack) {
                    // console.warn('⚠️ [SELECT STORE] Stack:', error.stack);
                }
                Alert.alert('Error', 'Failed to load stores. Please check your connection and try again.', [{ text: 'OK' }]);
                setStores([]);
                storesCacheByUser[currentUser.uid] = [];
                setStoresLoading(false); // Stop loading on error
            }
        };

        // Store the fetch function so it can be called manually
        fetchStoresRef.current = fetchStores;

        // Initial fetch only - no polling needed
        // Stores are only fetched when:
        // 1. Component mounts
        // 2. User manually adds/deletes a store (which will call fetchStoresRef.current())
        fetchStores(false);

        // No cleanup needed since we're not using intervals
        return () => {
            fetchStoresRef.current = null;
        };
    };

    const deleteSeller = async (sellerId) => {
        return new Promise((resolve, reject) => {
            Alert.alert(
                "Confirm Deletion",
                "Are you sure you want to delete this seller?",
                [
                    {
                        text: "Cancel",
                        onPress: () => {
                            // console.log("Deletion cancelled");
                            resolve({ success: false, message: "Cancelled by user" });
                        },
                        style: "cancel",
                    },
                    {
                        text: "Delete",
                        onPress: async () => {
                            try {
                                // Delete store via backend API
                                const response = await fetchWithTimeout(`${BASE_URL}/api/stores/${currentUser.uid}/${sellerId}`, {
                                    method: 'DELETE',
                                }, 10000);

                                if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    if (response.status === 404) {
                                        // console.log(`Seller with ID ${sellerId} does not exist.`);
                                        resolve({ success: false, message: "Seller not found" });
                                        return;
                                    }
                                    throw new Error(errorData.error || 'Failed to delete store');
                                }

                                const result = await response.json();
                                if (result.error) {
                                    throw new Error(result.error);
                                }
                                // console.log(`Seller with ID ${sellerId} has been deleted.`);

                                // Refresh stores list after deleting
                                if (fetchStoresRef.current) {
                                    // console.log('🔄 [SelectStore] Refreshing stores list after deleting store...');
                                    setTimeout(() => {
                                        fetchStoresRef.current?.(true);
                                    }, 500); // Small delay to ensure backend has processed the deletion
                                }

                                resolve({ success: true });
                            } catch (error: any) {
                                const errorMessage = error?.message || 'Unknown error occurred';
                                // console.warn('⚠️ [SelectStore] Error deleting seller:', errorMessage);
                                Alert.alert('Error', 'Failed to delete store. Please try again.', [{ text: 'OK' }]);
                                reject(error);
                            }
                        },
                        style: "destructive",
                    },
                ],
                { cancelable: false }
            );
        });
    };

    const handleNavigationStateChange = (navState) => {
        const { url } = navState;

        // Listen for Daraz's callback with ?code=
        if (url.startsWith(REDIRECT_URI)) {
            const match = url.match(/[?&]code=([^&]+)/);
            const code = match?.[1];

            if (code) {
                // console.log('Authorization Code:', code);
                getDarazToken(code)
                setLoading(true)
            }
        }
    };

    const getDarazToken = async (code) => {
        try {
            const url = `${BASE_URL}/get-daraz-token`;
            const requestBody = { code };

            // console.log('🚀 [API Request] Starting get-daraz-token API call...');
            // console.log('📍 [API Request] URL:', url);
            // console.log('📤 [API Request] Method: POST');
            // console.log('📤 [API Request] Headers:', { 'Content-Type': 'application/json' });
            // console.log('📤 [API Request] Body:', JSON.stringify(requestBody, null, 2));
            // console.log('📤 [API Request] Authorization Code:', code);

            const response = await fetchWithTimeout(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            }, 15000);

            // console.log('📊 [API Response] Status:', response.status);
            // console.log('📊 [API Response] Status Text:', response.statusText);
            // console.log('📊 [API Response] OK:', response.ok);
            // console.log('📊 [API Response] Headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                // console.warn('⚠️ [SelectStore] Error Response Body:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // console.log('✅ [API Response] Success!');
            // console.log('📥 [API Response] Full Response Data:', JSON.stringify(data, null, 2));
            // console.log('📥 [API Response] Response Keys:', Object.keys(data));

            if (data.access_token) {
                // console.log('🔑 [API Response] Access Token received:', data.access_token.substring(0, 20) + '...');
            }
            if (data.user_info || data.user) {
                // console.log('👤 [API Response] User Info received');
            }
            if (data.seller_id || data.user?.seller?.data?.short_code) {
                const sellerId = data.seller_id || data.user?.seller?.data?.short_code;
                // console.log('🏪 [API Response] Seller ID:', sellerId);
            }

            // Call addAccessToken with logging
            // console.log('💾 [Backend] Starting to add access token...');
            await addAccessToken(data);
            // console.log('✅ [Backend] Access token added successfully');

            setDarazOAuth(false);
            // console.log('✅ [UI] Modal closed after successful token retrieval');

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorType = err instanceof Error ? err.constructor.name : typeof err;
            // console.warn('⚠️ [SelectStore] Failed to fetch Daraz token:', errorMessage);
            // console.warn('⚠️ [SelectStore] Error Type:', errorType);
            if (err instanceof Error && err.stack) {
                // console.warn('⚠️ [SelectStore] Stack Trace:', err.stack);
            }
            Alert.alert('Error', 'Failed to authenticate with Daraz. Please try again.', [{ text: 'OK' }]);
        }
    };

    useEffect(() => {
        const unsubscribe = listenToStores(currentUser, setStores);

        // Check API health when component mounts
        if (BASE_URL && !hasCheckedApiHealth) {
            hasCheckedApiHealth = true;
            checkApiHealth();
        }

        return () => {
            // Clean up the real-time listener on component unmount
            if (unsubscribe) unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);


    const [expandedSellers, setExpandedSellers] = useState(false)

    const setStore = (details) => {
        // // console.log(details);
        dispatch(setSelectedStore(details))
        setExpandedSellers(false)
    }


    return (
        <View style={styles.container}>
            {storesLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={theme.primaryOrange} />
                    <TextComp size={14} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }}>
                        Loading stores...
                    </TextComp>
                </View>
            ) : stores.length <= 0 ? (
                <View>
                    <TextComp size={14} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }}>{AppStrings.youhavenoconnecteddarazstoreatthemoment}</TextComp>
                    <TouchableOpacity
                        onPress={() => {
                            // console.log('🔘 [SELECT STORE] Add Account button pressed');
                            // console.log('🔘 [SELECT STORE] Current darazOAuth state:', darazOAuth);
                            // console.log('🔘 [SELECT STORE] Setting darazOAuth to true');
                            setDarazOAuth(true);
                            // console.log('🔘 [SELECT STORE] AUTH_URL:', AUTH_URL);
                        }}
                        activeOpacity={0.7}
                    >
                        <TextComp size={16} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.primaryOrange }}>{AppStrings.addaccount}</TextComp>
                    </TouchableOpacity>
                </View>
            ) : (
                <View>
                    {selector.selectedStore.id ?

                        <TouchableOpacity onPress={() => setExpandedSellers(!expandedSellers)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                            <TextComp size={16} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }}>{selector.selectedStore?.user?.seller?.data?.name}</TextComp>
                            <Icon name="chevron-down" size={16} color={theme.textPrimary} />
                        </TouchableOpacity> :
                        <TouchableOpacity onPress={() => setExpandedSellers(!expandedSellers)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                            <TextComp size={16} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }}>{AppStrings.allstores}</TextComp>
                            <Icon name="chevron-down" size={16} color={theme.textPrimary} />
                        </TouchableOpacity>
                    }
                    {expandedSellers && (
                        <View style={{ backgroundColor: theme.card, elevation: 10, borderRadius: 16, padding: 16, rowGap: 16, marginVertical: 16 }}>
                            {stores.map((item, index) => {
                                // Replace 'EXCLUDE123' with the ID you want to skip
                                if (item?.user?.seller?.data?.short_code === selector.selectedStore.id) return null;

                                return (
                                    <View key={index} style={{ paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <TextComp size={16} numberOfLines={1} style={{ color: theme.textPrimary, fontFamily: FontFamilty.medium, }}>
                                                {item?.user?.seller?.data?.name}
                                            </TextComp>
                                            <TouchableOpacity style={{}} onPress={() => setStore(item)}>
                                                <TextComp size={12} numberOfLines={1} style={{ color: theme.primaryOrange, fontFamily: FontFamilty.medium, }}>
                                                    {AppStrings.watchdetailsonlyforthisstore}
                                                </TextComp>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity onPress={() => deleteSeller(item?.user?.seller?.data?.short_code)}>
                                            <Icon name="trash-outline" size={24} color={theme.red} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            {selector.selectedStore.id && (
                                <TouchableOpacity onPress={() => setStore('')} style={{}}>
                                    <TextComp size={12} numberOfLines={1} style={{ color: theme.primaryOrange, fontFamily: FontFamilty.medium, }}>
                                        {AppStrings.watchdetailsofallstore}
                                    </TextComp>
                                </TouchableOpacity>

                            )}
                        </View>
                    )}
                    <TextComp size={12} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.textSecondary }}>{AppStrings.total + ' : ' + stores.length}</TextComp>
                    <TouchableOpacity
                        onPress={() => {
                            // console.log('🔘 [SELECT STORE] Add Account button pressed');
                            // console.log('🔘 [SELECT STORE] Current darazOAuth state:', darazOAuth);
                            // console.log('🔘 [SELECT STORE] Setting darazOAuth to true');
                            setDarazOAuth(true);
                            // console.log('🔘 [SELECT STORE] AUTH_URL:', AUTH_URL);
                        }}
                        activeOpacity={0.7}
                    >
                        <TextComp size={16} numberOfLines={1} style={{ fontFamily: FontFamilty.medium, color: theme.primaryOrange }}>{AppStrings.addaccount}</TextComp>
                    </TouchableOpacity>
                </View>
            )}

            {darazOAuth && (
                <Modal
                    visible={darazOAuth}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => {
                        // console.log('🔘 [SELECT STORE] Modal close requested');
                        setDarazOAuth(false);
                    }}
                    onShow={() => {
                        // console.log('✅ [SELECT STORE] OAuth Modal opened');
                        // console.log('✅ [SELECT STORE] Modal AUTH_URL:', AUTH_URL);
                    }}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgcolor }}>
                        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                            <TouchableOpacity onPress={() => {
                                // console.log('🔘 [SELECT STORE] Close button pressed');
                                setDarazOAuth(false);
                            }}>
                                <Icon name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {loading && (
                            <View style={{ position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 1000 }}>
                                <ActivityIndicator size="large" color={theme.primaryOrange} />
                                <TextComp size={14} style={{ marginTop: 8, color: theme.textSecondary }}>
                                    Loading OAuth page...
                                </TextComp>
                            </View>
                        )}
                        <WebView
                            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            style={{ flex: 1 }}
                            source={{ uri: AUTH_URL }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            scalesPageToFit={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            onLoadStart={() => {
                                // console.log('🌐 [WEBVIEW] Loading started:', AUTH_URL);
                                setLoading(true);
                            }}
                            onLoadEnd={() => {
                                // console.log('✅ [WEBVIEW] Loading completed');
                                setLoading(false);
                            }}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                // console.error('❌ [WEBVIEW] Error loading:', nativeEvent.url);
                                // console.error('❌ [WEBVIEW] Error code:', nativeEvent.code);
                                // console.error('❌ [WEBVIEW] Error description:', nativeEvent.description);
                                setLoading(false);
                            }}
                            onHttpError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                // console.error('❌ [WEBVIEW] HTTP Error:', nativeEvent.statusCode, nativeEvent.url);
                                setLoading(false);
                            }}
                            onNavigationStateChange={(navState) => {
                                // console.log('🌐 [WEBVIEW] Navigation changed to:', navState.url);
                                // console.log('🌐 [WEBVIEW] Can go back:', navState.canGoBack);
                                // console.log('🌐 [WEBVIEW] Can go forward:', navState.canGoForward);
                                // console.log('🌐 [WEBVIEW] Loading:', navState.loading);
                                handleNavigationStateChange(navState);
                            }}
                            onShouldStartLoadWithRequest={(request) => {
                                // Prevent opening in external apps, force web view
                                const url = request.url;
                                // console.log('🔍 [WEBVIEW] Should start load with request:', url);
                                // console.log('🔍 [WEBVIEW] Request method:', request.method);
                                // console.log('🔍 [WEBVIEW] Request navigationType:', request.navigationType);

                                // Allow navigation within Daraz domains or to redirect URI
                                if (
                                    url.startsWith('https://api.daraz.pk') ||
                                    url.startsWith(REDIRECT_URI) ||
                                    url.startsWith('https://www.daraz.pk') ||
                                    url.startsWith('https://login.daraz.pk') ||
                                    url.startsWith('https://sellercenter.daraz.pk') ||
                                    url.startsWith('https://account.daraz.pk')
                                ) {
                                    // console.log('✅ [WEBVIEW] Allowing navigation to:', url);
                                    return true;
                                }
                                // Block other URLs to prevent app opening
                                // console.log('⚠️ [WEBVIEW] Blocking navigation to:', url);
                                return false;
                            }}
                            onMessage={(event) => {
                                // console.log('📨 [WEBVIEW] Message from WebView:', event.nativeEvent.data);
                            }}
                            injectedJavaScript={`
                                (function() {
                                    // console.log('🔧 [WEBVIEW] JavaScript injected');
                                    // Enable all button clicks
                                    document.addEventListener('click', function(e) {
                                        // console.log('🖱️ [WEBVIEW] Click detected on:', e.target);
                                        // console.log('🖱️ [WEBVIEW] Click target tag:', e.target.tagName);
                                        // console.log('🖱️ [WEBVIEW] Click target href:', e.target.href || 'none');
                                    }, true);
                                    
                                    // Log when page is ready
                                    if (document.readyState === 'complete') {
                                        // console.log('✅ [WEBVIEW] Page fully loaded');
                                        window.ReactNativeWebView.postMessage('PageLoaded');
                                    }
                                })();
                            `}
                        />
                    </SafeAreaView>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        width: '100%',
    },

});

export default SelectStore;
