import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BottomTabNav from './src/navigation/BottomTabNav';
import SplashScreen from './src/ui/splash/SplashScreen';
import AuthNav from './src/navigation/AuthNav';
import { startFirebaseListener, stopFirebaseListener } from './src/utils/firebase/firebaseListeners';
import { initializeBaseUrl } from './src/utils/api/baseUrl';
import { AppColors } from './src/constants/AppColors';

const AppContent = () => {
  const [splash, setSplash] = useState(true)
  const dispatch = useDispatch()
  const auth=getAuth
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplash(false)
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);


  const fetchToken = async () => {
    const users = await AsyncStorage.getItem('daraz_users');
    // Token handling if needed
  }

  useEffect(() => {
    fetchToken()
  }, [])


  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function handleAuthStateChanged(user: any) {
    setUser(user)
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

 

  useEffect(() => {
    startFirebaseListener(dispatch);
    return () => stopFirebaseListener(); // Clean up
  }, []);

  useEffect(() => {
    initializeBaseUrl();
  }, []);
  
  const navigationTheme = useMemo(() => ({
    dark: false,
    colors: {
      background: AppColors.bgcolor,
      border: AppColors.border,
      card: AppColors.card,
      primary: AppColors.primaryOrange,
      notification: AppColors.primaryOrange,
      text: AppColors.textPrimary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  }), []);

  return (
    <View style={{ flex: 1,backgroundColor:AppColors.bgcolor}}>
    <SafeAreaView></SafeAreaView>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.statusBar}
      />
      {splash ? (
        <SplashScreen />
      ) : (
        <NavigationContainer theme={navigationTheme}>
          {user ? <BottomTabNav /> : <AuthNav />}
        </NavigationContainer>
      )}
    </View>
  );
};

const App = () => <AppContent />;

const styles = StyleSheet.create({
  container: {
  },
});

export default App;

