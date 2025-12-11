import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import HomeNav from './HomeNav';
import OrdersScreen from '../ui/home/screens/OrdersScreen';
import ProfitCalculatorScreen from '../ui/calculator/ProfitCalculatorScreen';

const Tab = createBottomTabNavigator();

const BottomTabNav = () => {
    const { theme } = useTheme();
    
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primaryOrange,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeNav}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Icon name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Icon name={focused ? "list" : "list-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Calculator"
                component={ProfitCalculatorScreen}
                options={{
                    tabBarLabel: 'Calculator',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Icon name={focused ? "calculator" : "calculator-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNav;

