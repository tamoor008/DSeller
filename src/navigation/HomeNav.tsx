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

const Stack = createStackNavigator();

const HomeNav = () => {

    return (


        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="DarazScreen" component={DarazScreen} />
            <Stack.Screen name="StockScreen" component={StockScreen} />
            <Stack.Screen name="CashScreen" component={CashScreen} />
            <Stack.Screen name="PackagingScreen" component={PackagingScreen} />
        </Stack.Navigator>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

});

export default HomeNav;
