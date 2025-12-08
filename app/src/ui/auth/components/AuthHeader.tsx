import React, { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';

const AuthHeader = ({ navigation,heading,heading2,description }) => {


    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    return (
        <View style={{}}>

            <View style={{ flexDirection: 'row',columnGap:8 }}>

                <TextComp style={{color:'black',fontFamily:FontFamilty.semibold}} size={24}>{heading}</TextComp>
                {heading2&&(
                <TextComp style={{color:AppColors.primaryOrange,fontFamily:FontFamilty.semibold}} size={24}>{heading2}</TextComp>
                )}
            </View>

            <TextComp style={{color:'#4B5563',fontFamily:FontFamilty.regular}} size={16}>{description}</TextComp>
        </View>
    );
};

export default AuthHeader;
