import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import HomeNav from './src/navigation/HomeNav';
import SplashScreen from './src/ui/splash/SplashScreen';
import { AppColors } from './src/constants/AppColors';
import AuthNav from './src/navigation/AuthNav';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { setGlobalUser } from './src/redux/AppReducer';

const Stack = createStackNavigator();

const App = () => {
  const [splash, setSplash] = useState(true)
  const selector = useSelector(state => state.AppReducer);
  const dispatch = useDispatch()
  const auth=getAuth
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplash(false)
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // console.log('TEST LOG');

  const fetchToken = async () => {
    const users = await AsyncStorage.getItem('daraz_users');
    if (token) {
      // console.log('retreived Token', token);
    }

  }

  useEffect(() => {
    fetchToken()
  }, [])


  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function handleAuthStateChanged(user) {
    setUser(user)
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

 

  return (

    <View style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor={AppColors.bgcolor} />
      {splash ?
        <SplashScreen />
        :
        <NavigationContainer>
          {user? <HomeNav /> : <AuthNav />}
        </NavigationContainer>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },

});

export default App;
