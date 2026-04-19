import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import DarazProductsScreen from '../ui/products/DarazProductsScreen';
import ProductDetailsScreen from '../ui/products/ProductDetailsScreen';

const Stack = createStackNavigator();

const ProductsNav = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DarazProductsScreen" component={DarazProductsScreen} />
            <Stack.Screen name="ProductDetailsScreen" component={ProductDetailsScreen} />
        </Stack.Navigator>
    );
};

export default ProductsNav;
