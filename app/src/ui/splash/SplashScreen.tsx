/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
    Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';


const SplashScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
        <Image resizeMode='contain' style={{width:126,height:57}} source={AppImages.dsellerlogo}/>
        <Text style={styles.punchline}>{AppStrings.punchline}</Text>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: theme.bgcolor
  },
  punchline: {
    fontFamily: FontFamilty.regular,
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 16,
  },
});

export default SplashScreen;
