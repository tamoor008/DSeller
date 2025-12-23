import React, { useState } from 'react';
import { View, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { setGlobalUser } from '../../redux/AppReducer';
import { useDispatch } from 'react-redux';
import { AppStrings } from '../../constants/AppStrings';
import AuthHeader from './components/AuthHeader';
import TextInputComp from '../components/TextInputComp';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from '../components/TextComp';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../../firebase';

const SignupScreen = ({ navigation }) => {
    const { theme } = useTheme();

    // const [name, setName] = useState('')

    // const [email, setEmail] = useState('')
    // const [password, setPassword] = useState('')
    const [name, setName] = useState('Tamoor Malik')
    const [email, setEmail] = useState('tam@gmail.com')
    const [password, setPassword] = useState('12345678')
    const [error, setError] = useState('')

    const navigateSignin = () => {
        navigation.navigate('SigninScreen')
    }

    const dispatch = useDispatch();
    const [loader, setLoader] = useState(false)


    const signUpFunction = async () => {
        setLoader(true)

        try {
            // Optional: Validate email/password
            if (!email || !password ||!name) {
                console.log('Email and password are required');
                setError('Full Name, Email and password are required')
                setLoader(false)
                return;
            }


            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
        
            // Optional: update Firebase Auth profile with name
            await updateProfile(user, {
              displayName: name,
            });
        
            // Save user data via backend API
            const { getBaseUrl } = require('../../utils/api/baseUrl');
            const BASE_URL = getBaseUrl();
            const response = await fetch(`${BASE_URL}/api/personal-info/${user.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: name,
                    email: email,
                    uid: user.uid,
                    createdAt: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error saving personal information:', errorData.error || 'Unknown error');
                // Don't throw - account creation succeeded even if personal info save fails
            } else {
                const result = await response.json();
                if (result.error) {
                    console.error('API returned error:', result.error);
                }
            }
        
            console.log('User signed up and data saved!');
            setLoader(false);


            // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // console.log('User account created & signed in!', userCredential.user);
            // setLoader(false);
        } catch (error) {
            console.log('Caught error:', error?.toString?.() || JSON.stringify(error));

            if (error?.code === 'auth/email-already-in-use') {
                setLoader(false)
                setError('That email address is already in use!')
                console.log('That email address is already in use!');
            } else if (error?.code === 'auth/invalid-email') {
                setLoader(false)
                setError('That email address is invalid!')
                console.log('That email address is invalid!');
            } else {
                setLoader(false)
                setError('There is some issue with the server at the moment, please try again later')
            }

            setLoader(false);
        }
    };


    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: theme.bgcolor }}>

            <View style={{ flex: 1 }}>
                {loader ?
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={theme.primaryOrange} size={'large'}></ActivityIndicator>
                    </View>
                    : <View style={{ flex: 1, rowGap: 32 }}>
                        <AuthHeader heading={AppStrings.welcometo} heading2={AppStrings.dseller} description={AppStrings.letscreateyourprofile} />
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ rowGap: 32, flex: 1 }} style={{ flex: 1 }}>
                            <View style={{ rowGap: 8, flex: 1, }}>
                                <View style={{ rowGap: 16 }}>
                                    <TextInputComp keyboardType='email-address' size={16} placeHolder={AppStrings.fullname} text={name} setText={setName} />
                                    <TextInputComp keyboardType='email-address' size={16} placeHolder={AppStrings.email} text={email} setText={setEmail} />
                                    <TextInputComp secureTextEntry={true} size={16} placeHolder={AppStrings.password} text={password} setText={setPassword} />

                                </View>
                                {error && (
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: theme.red }} numberOfLines={2}>{error}</TextComp>
                                )}

                            </View>
                            <View style={{ rowGap: 8 }}>
                                <TouchableOpacity onPress={signUpFunction} activeOpacity={0.9} style={{ backgroundColor: theme.primaryOrange, height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center', }}>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.black, color: theme.white }} numberOfLines={1}>{AppStrings.signup}</TextComp>
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', columnGap: 8, justifyContent: 'center' }}>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: theme.textPrimary }} numberOfLines={1}>{AppStrings.alreadyhaveanaccount}</TextComp>
                                    <Text onPress={navigateSignin} style={{ fontSize: 16, fontFamily: FontFamilty.black, color: theme.primaryOrange, includeFontPadding: false }} >{AppStrings.signin}</Text>

                                </View>

                            </View>

                        </ScrollView>
                    </View>}
            </View>




        </View>
    );
};

export default SignupScreen;
