import React, { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';

const AuthHeader = ({ navigation, heading, heading2, description }) => {
    const { theme } = useTheme();

    return (
        <View style={{}}>
            <View style={{ flexDirection: 'row', columnGap: 8 }}>
                <TextComp style={{ color: theme.textPrimary, fontFamily: FontFamilty.semibold }} size={24} numberOfLines={1}>{heading}</TextComp>
                {heading2 && (
                    <TextComp style={{ color: theme.primaryOrange, fontFamily: FontFamilty.semibold }} size={24} numberOfLines={1}>{heading2}</TextComp>
                )}
            </View>
            <TextComp style={{ color: theme.textSecondary, fontFamily: FontFamilty.regular }} size={16} numberOfLines={2}>{description}</TextComp>
        </View>
    );
};

export default AuthHeader;
