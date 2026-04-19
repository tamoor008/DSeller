import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import SigninScreen from '../ui/auth/SigninScreen';
import DarazOAuthScreen from '../ui/auth/DarazOAuthScreen';
import SignupScreen from '../ui/auth/SignupScreen';

const Stack = createStackNavigator();

const AuthNav = () => {

    return (


        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="SigninScreen" component={SigninScreen} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />

            <Stack.Screen name="DarazOAuthScreen" component={DarazOAuthScreen} />
        </Stack.Navigator>

    );
}

export default AuthNav;
