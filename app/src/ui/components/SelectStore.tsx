import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView
} from 'react-native';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';
import { getAuth } from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import WebView from 'react-native-webview';
import { setAccessToken, setAccessTokens, setSelectedStore } from '../../redux/AppReducer';
import { useDispatch, useSelector } from 'react-redux';
import { getBaseUrl } from '../../utils/api/baseUrl';


const SelectStore = () => {
    const BASE_URL = getBaseUrl(); // instant access, no async

    const auth = getAuth()
    const currentUser = auth.currentUser
    const [darazOAuth, setDarazOAuth] = useState(false)
    const [stores, setStores] = useState([])
    const selector = useSelector(state => state.AppReducer);
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('CODE')

    const CLIENT_ID = '503646';
    const REDIRECT_URI = 'https://www.moonsys.co';
    const AUTH_URL = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`;

    useEffect(() => {
        console.log(AUTH_URL, 'AUTH_URL');
    }, [AUTH_URL]);

    // Health check function to test if API is working
    const checkApiHealth = async () => {
        try {
            console.log('🔍 [API Health Check] Testing API connection...');
            console.log('📍 [API Health Check] URL:', `${BASE_URL}/test`);
            
            const response = await fetch(`${BASE_URL}/test`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('📊 [API Health Check] Response Status:', response.status);
            console.log('📊 [API Health Check] Response OK:', response.ok);
            console.log('📊 [API Health Check] Content-Type:', response.headers.get('content-type'));

            // Get response as text first to handle both JSON and plain text responses
            const responseText = await response.text();
            console.log('📥 [API Health Check] Raw Response Text:', responseText);

            let data;
            try {
                // Try to parse as JSON
                data = JSON.parse(responseText);
                console.log('✅ [API Health Check] Parsed as JSON:', JSON.stringify(data, null, 2));
            } catch (jsonError) {
                // If not JSON, treat as plain text
                console.log('ℹ️ [API Health Check] Response is not JSON, treating as plain text');
                data = responseText;
                console.log('✅ [API Health Check] Response Data (text):', data);
            }
            
            return { success: response.ok, data, isJson: typeof data === 'object' };
        } catch (error) {
            console.error('❌ [API Health Check] Error:', error);
            console.error('❌ [API Health Check] Error Type:', error instanceof Error ? error.constructor.name : typeof error);
            console.error('❌ [API Health Check] Error Message:', error instanceof Error ? error.message : String(error));
            if (error instanceof Error && error.stack) {
                console.error('❌ [API Health Check] Stack Trace:', error.stack);
            }
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    };


    const addAccessToken = async (user) => {
        try {
            const sellerId = user.seller_id || user.user?.seller?.data?.short_code;
            const firebasePath = `/users/${currentUser.uid}/stores/${sellerId}`;
            
            console.log('💾 [Firebase] Starting addAccessToken operation...');
            console.log('📍 [Firebase] Firebase Path:', firebasePath);
            console.log('👤 [Firebase] User UID:', currentUser.uid);
            console.log('🏪 [Firebase] Seller ID:', sellerId);
            console.log('📦 [Firebase] User Data Keys:', Object.keys(user));

            const sellerRef = database().ref(firebasePath);

            console.log('🔍 [Firebase] Checking if seller already exists...');
            const snapshot = await sellerRef.once('value');

            if (snapshot.exists()) {
                console.log('⚠️ [Firebase] Seller already connected:', sellerId);
                console.log('📥 [Firebase] Existing Data:', JSON.stringify(snapshot.val(), null, 2));
                return { added: false, reason: 'already_exists' };
            }

            console.log('💾 [Firebase] Saving seller data to Firebase...');
            console.log('📤 [Firebase] Data to save:', JSON.stringify(user, null, 2));
            
            await sellerRef.set({ user });

            console.log('✅ [Firebase] Seller added successfully!');
            console.log('✅ [Firebase] Seller ID:', sellerId);
            console.log('✅ [Firebase] Firebase Path:', firebasePath);
            
            return { added: true, sellerId };

        } catch (error) {
            console.error('❌ [Firebase] Error saving seller data');
            console.error('❌ [Firebase] Error Type:', error instanceof Error ? error.constructor.name : typeof error);
            console.error('❌ [Firebase] Error Message:', error instanceof Error ? error.message : String(error));
            console.error('❌ [Firebase] Full Error:', error);
            
            if (error instanceof Error && error.stack) {
                console.error('❌ [Firebase] Stack Trace:', error.stack);
            }
            
            throw error;
        }
    };

    const listenToStores = (currentUser, setStores) => {
        if (!currentUser || !currentUser.uid) {
            console.warn('User not authenticated');
            return;
        }

        const ref = database().ref(`/users/${currentUser.uid}/stores`);

        const onValueChange = ref.on('value', snapshot => {
            const data = snapshot.val();
            // console.log('User stores (real-time):', data);

            const dataset = data
                ? Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value,
                }))
                : [];


                const access_tokens = dataset.map((item) => ({
                    access_token: item.user.token.access_token,
                    name: item.user.seller.data.name,               // example: add name
                  }));
            // console.log(access_tokens, 'All Access Tokens');
            // console.log(access_tokens[0], 'First Access Token');
            dispatch(setAccessTokens(access_tokens))


            setStores(dataset);
        });

        // Return a cleanup function to remove the listener
        return () => ref.off('value', onValueChange);
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
                            console.log("Deletion cancelled");
                            resolve({ success: false, message: "Cancelled by user" });
                        },
                        style: "cancel",
                    },
                    {
                        text: "Delete",
                        onPress: async () => {
                            try {
                                const sellerRef = database().ref(`/users/${currentUser.uid}/stores/${sellerId}`);
                                const snapshot = await sellerRef.once('value');

                                if (!snapshot.exists()) {
                                    console.log(`Seller with ID ${sellerId} does not exist.`);
                                    resolve({ success: false, message: "Seller not found" });
                                    return;
                                }

                                await sellerRef.remove();
                                console.log(`Seller with ID ${sellerId} has been deleted.`);
                                resolve({ success: true });
                            } catch (error) {
                                console.error('Error deleting seller:', error);
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
                console.log('Authorization Code:', code);
                getDarazToken(code)
                setLoading(true)
            }
        }
    };

    const getDarazToken = async (code) => {
        try {
            const url = `${BASE_URL}/get-daraz-token`;
            const requestBody = { code };
            
            console.log('🚀 [API Request] Starting get-daraz-token API call...');
            console.log('📍 [API Request] URL:', url);
            console.log('📤 [API Request] Method: POST');
            console.log('📤 [API Request] Headers:', { 'Content-Type': 'application/json' });
            console.log('📤 [API Request] Body:', JSON.stringify(requestBody, null, 2));
            console.log('📤 [API Request] Authorization Code:', code);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📊 [API Response] Status:', response.status);
            console.log('📊 [API Response] Status Text:', response.statusText);
            console.log('📊 [API Response] OK:', response.ok);
            console.log('📊 [API Response] Headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [API Response] Error Response Body:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ [API Response] Success!');
            console.log('📥 [API Response] Full Response Data:', JSON.stringify(data, null, 2));
            console.log('📥 [API Response] Response Keys:', Object.keys(data));
            
            if (data.access_token) {
                console.log('🔑 [API Response] Access Token received:', data.access_token.substring(0, 20) + '...');
            }
            if (data.user_info || data.user) {
                console.log('👤 [API Response] User Info received');
            }
            if (data.seller_id || data.user?.seller?.data?.short_code) {
                const sellerId = data.seller_id || data.user?.seller?.data?.short_code;
                console.log('🏪 [API Response] Seller ID:', sellerId);
            }

            // Call addAccessToken with logging
            console.log('💾 [Firebase] Starting to add access token to Firebase...');
            await addAccessToken(data);
            console.log('✅ [Firebase] Access token added successfully');
            
            setDarazOAuth(false);
            console.log('✅ [UI] Modal closed after successful token retrieval');

            return data;
        } catch (err) {
            console.error('❌ [API Error] Failed to fetch Daraz token');
            console.error('❌ [API Error] Error Type:', err instanceof Error ? err.constructor.name : typeof err);
            console.error('❌ [API Error] Error Message:', err instanceof Error ? err.message : String(err));
            console.error('❌ [API Error] Full Error:', err);
            
            if (err instanceof Error && err.stack) {
                console.error('❌ [API Error] Stack Trace:', err.stack);
            }
        }
    };

    useEffect(() => {
        const unsubscribe = listenToStores(currentUser, setStores);

        // Check API health when component mounts
        if (BASE_URL) {
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
        // console.log(details);
        dispatch(setSelectedStore(details))
        setExpandedSellers(false)
    }


    return (
        <View style={styles.container}>
            {stores.length <= 0 ?
                <View>
                    <TextComp size={14} style={{ fontFamily: FontFamilty.medium, color: AppColors.black50 }}>{AppStrings.youhavenoconnecteddarazstoreatthemoment}</TextComp>
                    <TouchableOpacity onPress={() => setDarazOAuth(true)}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.primaryOrange }}>{AppStrings.addaccount}</TextComp>
                    </TouchableOpacity>
                </View>
                :
                <View>
                    {selector.selectedStore.id ?

                        <TouchableOpacity onPress={() => setExpandedSellers(!expandedSellers)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black }}>{selector.selectedStore?.user?.seller?.data?.name}</TextComp>
                            <Image resizeMode='contain' style={{ width: 10, height: 10 }} source={AppImages.dropdown} />
                        </TouchableOpacity> :
                        <TouchableOpacity onPress={() => setExpandedSellers(!expandedSellers)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black }}>{AppStrings.allstores}</TextComp>
                            <Image resizeMode='contain' style={{ width: 10, height: 10 }} source={AppImages.dropdown} />
                        </TouchableOpacity>
                    }
                    {expandedSellers && (
                        <View style={{ backgroundColor: AppColors.bgcolor, elevation: 10, borderRadius: 16, padding: 16, rowGap: 16, marginVertical: 16 }}>
                            {stores.map((item, index) => {
                                // Replace 'EXCLUDE123' with the ID you want to skip
                                if (item?.user?.seller?.data?.short_code === selector.selectedStore.id) return null;

                                return (
                                    <View key={index} style={{ paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <TextComp size={16} style={{ color: AppColors.black, fontFamily: FontFamilty.medium,}}>
                                                {item?.user?.seller?.data?.name}
                                            </TextComp>
                                            <TouchableOpacity style={{ }} onPress={() => setStore(item)}>
                                                <TextComp size={12} style={{ color: AppColors.primaryOrange, fontFamily: FontFamilty.medium, }}>
                                                    {AppStrings.watchdetailsonlyforthisstore}
                                                </TextComp>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity onPress={() => deleteSeller(item?.user?.seller?.data?.short_code)}>
                                            <Image style={{ width: 32, height: 32 }} source={AppImages.bin} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            {selector.selectedStore.id && (
                                <TouchableOpacity onPress={() => setStore('')} style={{}}>
                                    <TextComp size={12} style={{ color: AppColors.primaryOrange, fontFamily: FontFamilty.medium, }}>
                                        {AppStrings.watchdetailsofallstore}
                                    </TextComp>
                                </TouchableOpacity>

                            )}
                        </View>
                    )}
                    <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black50 }}>{AppStrings.total + ' : ' + stores.length}</TextComp>
                    <TouchableOpacity onPress={() => setDarazOAuth(true)}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.primaryOrange }}>{AppStrings.addaccount}</TextComp>
                    </TouchableOpacity>
                </View>
            }

            {darazOAuth && (
                <Modal
                    visible={darazOAuth}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setDarazOAuth(false)}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                            <TouchableOpacity onPress={() => setDarazOAuth(false)}>
                                <Image style={{ width: 24, height: 24 }} source={AppImages.cross} />
                            </TouchableOpacity>
                        </View>
                        <WebView
                           userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            style={{ flex: 1 }}
                            source={{ uri: AUTH_URL }} // ← Correct URL to start OAuth
                            onLoadEnd={() => setLoading(false)}
                            onNavigationStateChange={handleNavigationStateChange}
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
