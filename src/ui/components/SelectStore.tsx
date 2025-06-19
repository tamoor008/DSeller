import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';
import { getAuth } from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import WebView from 'react-native-webview';
import { BASE_URL } from '../../utils/api/baseUrl';
import { setAccessToken, setAccessTokens } from '../../redux/AppReducer';
import { useDispatch } from 'react-redux';


const SelectStore = () => {
    const auth = getAuth()
    const currentUser = auth.currentUser
    const [darazOAuth, setDarazOAuth] = useState(false)
    const [stores, setStores] = useState([])

    const dispatch=useDispatch()
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('CODE')

    const CLIENT_ID = '503646';
    const REDIRECT_URI = 'https://www.moonsys.co';
    const AUTH_URL = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`;



    const addAccessToken = async (user) => {
        try {
            const sellerRef = database()
                .ref(`/users/${currentUser.uid}/stores/${user.seller_id}`);

            const snapshot = await sellerRef.once('value');

            if (snapshot.exists()) {
                console.log('Seller already connected:', user.seller_id);
                return;
            }

            await sellerRef.set({ user }); // or you can store fields directly like: { name: user.name, accessToken: user.access_token }

            console.log('Seller added successfully:', user.seller_id);
            return { added: true };

        } catch (error) {
            console.error('Error saving seller data:', error);
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


                const access_tokens = dataset.map((item) => item.user.token.access_token);

                console.log(access_tokens, 'All Access Tokens');
                console.log(access_tokens[0], 'First Access Token');
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
            const response = await fetch(`${BASE_URL}/get-daraz-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            // console.log("Daraz Token Response:", data); // this will contain access_token, etc.

            // Example: access individual fields
            // dispatch(setisLoggedin(true))
            // dispatch(setAccessToken(data.access_token))

            // console.log(data, 'USER DATA');
            // console.log(JSON.stringify(data), 'USER DATA String');
            addAccessToken(data)
            setDarazOAuth(false)




            // console.log("Access Token:", data.access_token);
            // console.log("Seller ID:", data.user_info?.seller_id);

            return data;
        } catch (err) {
            console.log("Failed to fetch Daraz token:", err.message);
        }
    };

    useEffect(() => {
        const unsubscribe = listenToStores(currentUser, setStores);

        return () => {
            // Clean up the real-time listener on component unmount
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);


    const [expandedSellers, setExpandedSellers] = useState(false)
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
                    <TouchableOpacity onPress={() => setExpandedSellers(!expandedSellers)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black }}>{AppStrings.allstores}</TextComp>
                        <Image resizeMode='contain' style={{ width: 10, height: 10 }} source={AppImages.dropdown} />
                    </TouchableOpacity>
                    {expandedSellers && (
                        <View style={{ backgroundColor: AppColors.bgcolor, elevation: 10, borderRadius: 16, padding: 16, rowGap: 16, marginVertical: 16 }}>
                            {stores.map((item, index) => <View key={index} style={{ paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{flex:1}}>
                                <TextComp size={16} style={{ color: AppColors.black, fontFamily: FontFamilty.medium, flex: 1 }} >{item?.user?.seller?.data?.name}</TextComp>
                                <TextComp size={12} style={{ color: AppColors.primaryOrange, fontFamily: FontFamilty.medium, flex: 1 }} >{AppStrings.watchdetailsonlyforthisstore}</TextComp>

                                </View>
                                <TouchableOpacity onPress={()=>deleteSeller(item?.user?.seller?.data?.short_code)}>
                                    <Image style={{ width: 32, height: 32 }} source={AppImages.bin} />
                                </TouchableOpacity>
                                
                            </View>)}
                        </View>
                    )}
                    <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black50 }}>{AppStrings.total + ' : ' + stores.length}</TextComp>
                    <TouchableOpacity onPress={() => setDarazOAuth(true)}>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.primaryOrange }}>{AppStrings.addaccount}</TextComp>
                    </TouchableOpacity>
                </View>
            }

            {darazOAuth && (
                <Modal>
                    <View style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <TouchableOpacity onPress={() => setDarazOAuth(false)}>
                                <Image style={{ width: 24, height: 24 }} source={AppImages.cross} />
                            </TouchableOpacity>
                        </View>
                        <WebView
                            source={{ uri: AUTH_URL }} // ← Correct URL to start OAuth
                            onLoadEnd={() => setLoading(false)}
                            onNavigationStateChange={handleNavigationStateChange}
                        />
                    </View>
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
