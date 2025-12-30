import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import BottomTabNav from './src/navigation/BottomTabNav';
import SplashScreen from './src/ui/splash/SplashScreen';
import AuthNav from './src/navigation/AuthNav';
import { startFirebaseListener, stopFirebaseListener } from './src/utils/firebase/firebaseListeners';
import { initializeBaseUrl } from './src/utils/api/baseUrl';

const AppContent = () => {
  const { theme, isDark } = useTheme();
  const [splash, setSplash] = useState(true)
  const dispatch = useDispatch()
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./src/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./src/assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Black': require('./src/assets/fonts/Poppins-Black.ttf'),
    'Poppins-Italic': require('./src/assets/fonts/Poppins-Italic.ttf'),
    'Poppins-SemiBold': require('./src/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('./src/assets/fonts/Poppins-Medium.ttf'),
  });

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
  const [user, setUser] = useState<any>();

  // Handle user state changes
  function handleAuthStateChanged(user: any) {
    setUser(user)
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

 

  useEffect(() => {
    startFirebaseListener(dispatch);
    return () => stopFirebaseListener(); // Clean up
  }, []);

  useEffect(() => {
    const initBaseUrl = async () => {
      await initializeBaseUrl();
    };
    initBaseUrl();
  }, []);
  
  const navigationTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      background: theme.bgcolor,
      border: theme.border,
      card: theme.card,
      primary: theme.primaryOrange,
      notification: theme.primaryOrange,
      text: theme.textPrimary,
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
  }), [theme, isDark]);

  const showSplash = splash || !fontsLoaded;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.bgcolor }}
      edges={['top']} // apply insets only on top
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.statusBar}
        translucent={Platform.OS === 'ios'}
      />
      {showSplash ? (
        <SplashScreen />
      ) : (
        <NavigationContainer theme={navigationTheme}>
          {user ? <BottomTabNav /> : <AuthNav />}
        </NavigationContainer>
      )}
    </SafeAreaView>
  );
};

const App = () => (
  <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  container: {
  },
});

export default App;
