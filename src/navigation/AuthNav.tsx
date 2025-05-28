import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import DarazScreen from '../ui/daraz/DarazScreen';
import HomeScreen from '../ui/home/screens/HomeScreen';
import StockScreen from '../ui/stock/StockScreen';
import CashScreen from '../ui/cash/CashScreen';
import PackagingScreen from '../ui/packaging/PackagingScreen';
import SigninScreen from '../ui/auth/DarazOAuthScreen';
import DarazOAuthScreen from '../ui/auth/DarazOAuthScreen';

const Stack = createStackNavigator();

const AuthNav = () => {

    return (


        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="DarazOAuthScreen" component={DarazOAuthScreen} />
        </Stack.Navigator>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

});

export default AuthNav;
