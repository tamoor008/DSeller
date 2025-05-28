import React, { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppColors } from '../../constants/AppColors';
import { setAccessToken, setisLoggedin } from '../../redux/AppReducer';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/api/baseUrl';

const CLIENT_ID = '503646';
const REDIRECT_URI = 'https://www.moonsys.co';
const AUTH_URL = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`;

const DarazOAuthScreen = ({ navigation }) => {
  const dispatch=useDispatch()

  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('CODE')

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;

    // Listen for Daraz's callback with ?code=
    if (url.startsWith(REDIRECT_URI)) {
      const match = url.match(/[?&]code=([^&]+)/);
      const code = match?.[1];

      if (code) {
        console.log('Authorization Code:', code);
        setCode(code)
        getDarazToken(code)
        setLoading(true)

        // Do something with the code (e.g., send to your backend)

        // Optional: close the screen or go back
        // navigation.goBack();
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
      console.log("Daraz Token Response:", data); // this will contain access_token, etc.
  
      // Example: access individual fields
      dispatch(setisLoggedin(true))
      dispatch(setAccessToken(data.access_token))
      await AsyncStorage.setItem('daraz_access_token', data.access_token).then(()=>{console.log('TOKEN SAVED');
      });

  
      console.log("Access Token:", data.access_token);
      console.log("Seller ID:", data.user_info?.seller_id);
  
      return data;
    } catch (err) {
      console.error("Failed to fetch Daraz token:", err.message);
    }
  };
  

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:AppColors.bgcolor}}>
          <ActivityIndicator size={'large'} color={AppColors.primaryOrange}></ActivityIndicator>
        </View>
      )}
      {!loading && (
        <WebView
          source={{ uri: AUTH_URL }} // ← Correct URL to start OAuth
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
        />
      )}

    </View>
  );
};

export default DarazOAuthScreen;
