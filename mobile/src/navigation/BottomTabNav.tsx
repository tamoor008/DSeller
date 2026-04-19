import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import HomeNav from './HomeNav';
import ProductsNav from './ProductsNav';
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
                    paddingBottom: 10,
                    paddingTop: 8,
                    height: 72,
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
                        <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Products"
                component={ProductsNav}
                options={{
                    tabBarLabel: 'Products',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "cube" : "cube-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Calculator"
                component={ProfitCalculatorScreen}
                options={{
                    tabBarLabel: 'Calculator',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "calculator" : "calculator-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNav;

