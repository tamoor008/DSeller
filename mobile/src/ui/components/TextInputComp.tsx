// Typography.js
import React from 'react';
import { Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const TextInputComp = ({ text, setText, placeHolder, cumpolsury, size, style, keyboardType, secureTextEntry }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

    return (
        <TextInput 
            placeholderTextColor={theme.textSecondary} 
            secureTextEntry={secureTextEntry} 
            keyboardType={keyboardType} 
            autoCapitalize="sentences" 
            placeholder={placeHolder + (cumpolsury ? '*' : '')} 
            onChangeText={(text) => setText(text)} 
            style={{ ...styles[size], ...style, borderColor: text ? theme.textSecondary : theme.border, color: theme.textPrimary }}
            value={text}
        />
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    8: {
        fontSize: 8,
        includeFontPadding: false,
        borderWidth: 1, 
        borderColor: theme.border,
        color: theme.textPrimary
    },
    12: {
        fontSize: 12,
        includeFontPadding: false,
        color: theme.textPrimary
    },
    16: {
        fontSize: 16,
        includeFontPadding: false,
        borderWidth: 1, 
        borderColor: theme.border,
        padding: 16,
        height: 50,
        borderRadius: 8,
        color: theme.textPrimary,
        backgroundColor: theme.bgcolor
    },
    20: {
        fontSize: 20,
        includeFontPadding: false,
        color: theme.textPrimary
    },
    24: {
        fontSize: 24,
        includeFontPadding: false,
        color: theme.textPrimary
    },
});

export default TextInputComp;
