import React, { useState } from 'react';
import { View, ActivityIndicator, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppColors } from '../../constants/AppColors';
import { setAccessToken, setGlobalUser, setisLoggedin } from '../../redux/AppReducer';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/api/baseUrl';
import { AppStrings } from '../../constants/AppStrings';
import AuthHeader from './components/AuthHeader';
import TextInputComp from '../components/TextInputComp';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from '../components/TextComp';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';

const SigninScreen = ({ navigation }) => {
    const [loader, setLoader] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('tam@gmail.com');
    const [password, setPassword] = useState('12345678');
    const [secure, setSecure] = useState(true); // 🔥 Added this state
    const dispatch = useDispatch();

    const navigateSignup = () => {
        navigation.navigate('SignupScreen');
    };

    const handleSignin = async () => {
        setLoader(true);
        const auth = getAuth();

        try {
            if (!email || !password) {
                setError('Full Name, Email and password are required');
                setLoader(false);
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            dispatch(setGlobalUser(user));
            setLoader(false);
        } catch (error) {
            console.log('Caught error:', error?.toString?.() || JSON.stringify(error));
            setLoader(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: AppColors.bgcolor }}>
            {loader ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.bgcolor }}>
                    <ActivityIndicator size={'large'} color={AppColors.primaryOrange} />
                </View>
            ) : (
                <View style={{ flex: 1, rowGap: 32 }}>
                    <AuthHeader heading={AppStrings.welcomeback} description={AppStrings.wereallymissedyou} />

                    <ScrollView contentContainerStyle={{ rowGap: 32, flex: 1 }} style={{ flex: 1 }}>
                        <View style={{ rowGap: 8, flex: 1 }}>
                            <View style={{ rowGap: 16 }}>
                                <TextInputComp
                                    keyboardType="email-address"
                                    size={16}
                                    placeHolder={AppStrings.email}
                                    text={email}
                                    setText={setEmail}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInputComp
                                        secureTextEntry={secure}
                                        size={16}
                                        placeHolder={AppStrings.password}
                                        text={password}
                                        setText={setPassword}
                                        style={{ flex: 1 }}
                                    />
                                    <TouchableOpacity onPress={() => setSecure(!secure)} style={{ paddingHorizontal: 8 }}>
                                        <Image
                                            source={secure ? require('../../../assets/hide.png') : require('')}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={{ rowGap: 8 }}>
                            <TouchableOpacity
                                onPress={handleSignin}
                                activeOpacity={0.9}
                                style={{ backgroundColor: AppColors.primaryOrange, height: 50, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <TextComp size={16} style={{ fontFamily: FontFamilty.black, color: AppColors.white }}>{AppStrings.signin}</TextComp>
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', columnGap: 8, justifyContent: 'center' }}>
                                <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black }}>{AppStrings.donthaveanaccount}</TextComp>
                                <Text onPress={navigateSignup} style={{ fontSize: 16, fontFamily: FontFamilty.black, color: AppColors.primaryOrange, includeFontPadding: false }}>{AppStrings.signup}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default SigninScreen;
