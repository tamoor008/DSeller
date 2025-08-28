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
import DeliveredOrders from '../ui/home/screens/DeliveredOrders';
import FailedDeliveryOrders from '../ui/home/screens/FailedDeliveryOrders';
import WeekllyReport from '../ui/home/screens/WeekllyReport';
import PendingOrders from '../ui/home/screens/PendingOrders';
import ReadyToShipOrders from '../ui/home/screens/ReadyToShipOrders';

const Stack = createStackNavigator();

const HomeNav = () => {

    return (


        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="DarazScreen" component={DarazScreen} />
            <Stack.Screen name="StockScreen" component={StockScreen} />
            <Stack.Screen name="CashScreen" component={CashScreen} />
            <Stack.Screen name="PackagingScreen" component={PackagingScreen} />
            <Stack.Screen name="DeliveredOrders" component={DeliveredOrders} />
            <Stack.Screen name="FailedDeliveryOrders" component={FailedDeliveryOrders} />
            <Stack.Screen name="WeekllyReport" component={WeekllyReport} />
            <Stack.Screen name="PendingOrders" component={PendingOrders} />
            <Stack.Screen name="ReadyToShipOrders" component={ReadyToShipOrders} />

            
        </Stack.Navigator>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

});

export default HomeNav;
