// Typography.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';

const TextComp = ({ children, style, size,numberOfLines }) => {
  return (
    <Text numberOfLines={numberOfLines} style={[styles[size], style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  8: {
    fontSize: 8,
    includeFontPadding:false 
  },
  12: {
    fontSize: 12,
    includeFontPadding:false 
  },
  16: {
    fontSize: 16,
    includeFontPadding:false 
  },
  20: {
    fontSize: 20,
    includeFontPadding:false 
  },
  24: {
    fontSize: 24,
    includeFontPadding:false 
  },
});

export default TextComp;
