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
import PendingOrders from '../ui/home/screens/PendingOrders';
import ReadyToShipOrders from '../ui/home/screens/ReadyToShipOrders';
import SettingsScreen from '../ui/settings/SettingsScreen';
import ProfitCalculatorScreen from '../ui/calculator/ProfitCalculatorScreen';
import StoresScreen from '../ui/settings/StoresScreen';
import ProfileScreen from '../ui/settings/ProfileScreen';
import TermsPrivacyScreen from '../ui/settings/TermsPrivacyScreen';

const Stack = createStackNavigator();

const HomeNav = () => {

    return (

        <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="DarazScreen" component={DarazScreen} />
                <Stack.Screen name="StockScreen" component={StockScreen} />
                <Stack.Screen name="CashScreen" component={CashScreen} />
                <Stack.Screen name="PackagingScreen" component={PackagingScreen} />
                <Stack.Screen name="DeliveredOrders" component={DeliveredOrders} />
                <Stack.Screen name="FailedDeliveryOrders" component={FailedDeliveryOrders} />
                <Stack.Screen name="PendingOrders" component={PendingOrders} />
                <Stack.Screen name="ReadyToShipOrders" component={ReadyToShipOrders} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="ProfitCalculatorScreen" component={ProfitCalculatorScreen} />
                <Stack.Screen name="StoresScreen" component={StoresScreen} />
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                <Stack.Screen name="TermsPrivacyScreen" component={TermsPrivacyScreen} />


            </Stack.Navigator>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

});

export default HomeNav;
