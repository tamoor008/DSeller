import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';


const SelectStore = () => {
    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center',columnGap:5 }}>
                <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black}}>{AppStrings.allstores}</TextComp>
                <Image resizeMode='contain' style={{ width: 10, height: 10 }} source={AppImages.dropdown} />
            </TouchableOpacity>
            <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.black50}}>{AppStrings.total+' : '+'4'}</TextComp>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        width: '100%',
    },

});

export default SelectStore;
