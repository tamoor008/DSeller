// Typography.js
import React from 'react';
import { Text, StyleSheet, TextInput } from 'react-native';
import { AppColors } from '../../constants/AppColors';

const TextInputComp = ({ text, setText, placeHolder, cumpolsury, size, style }) => {
    return (

        <TextInput autoCapitalize="sentences" placeholder={placeHolder + (cumpolsury ? '*' : '')} onChangeText={(text) => setText(text)} style={{ ...styles[size], ...style, borderColor: text ? AppColors.black80 : AppColors.border }}>
            {text}
        </TextInput>
    );
};

const styles = StyleSheet.create({
    8: {
        fontSize: 8,
        includeFontPadding: false,
        borderWidth: 1, borderColor: AppColors.border
    },
    12: {
        fontSize: 12,
        includeFontPadding: false
    },
    16: {
        fontSize: 16,
        includeFontPadding: false,
        borderWidth: 1, borderColor: AppColors.border,
        padding: 16,
        height: 50,
        borderRadius: 8,
        color: AppColors.black
    },
    20: {
        fontSize: 20,
        includeFontPadding: false
    },
    24: {
        fontSize: 24,
        includeFontPadding: false
    },
});

export default TextInputComp;
