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
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import { AppColors } from '../../constants/AppColors';


const SplashScreen = () => {

  return (
    <View style={styles.container}>
        <Image resizeMode='contain' style={{width:126,height:57}} source={AppImages.dsellerlogo}/>
        <Text style={{fontFamily:FontFamilty.regular,fontSize:12,color:AppColors.black50}}>{AppStrings.punchline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:AppColors.white
  },

});

export default SplashScreen;
