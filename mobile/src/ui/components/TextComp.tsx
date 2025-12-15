// Typography.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';

/**
 * Shared text component that avoids clipping by keeping font padding
 * and setting a sensible line height per size.
 */
const TextComp = ({ children, style, size = 14, numberOfLines }) => {
  const fontSize = size || 14;
  const lineHeight = Math.round(fontSize * 1.25);

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        { fontSize, lineHeight },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: true,
  },
});

export default TextComp;
