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


const WeeklyReportComp = ({text,onPress}) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <View style={{flexDirection:'row',alignItems:'center',columnGap:4}}>
            <TextComp size={24} style={{ fontFamily: FontFamilty.bold, color: AppColors.white }}>{text}</TextComp>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.primaryOrange,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: 16,
        borderRadius: 8
    },

});

export default WeeklyReportComp;
