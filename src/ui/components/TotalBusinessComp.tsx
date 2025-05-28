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


const TotalBusinessComp = ({businessValue}) => {
    return (
        <View style={styles.container}>
            <View style={{flexDirection:'row',alignItems:'center',columnGap:4}}>
            <TextComp size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white }}>{AppStrings.symbol.rs}</TextComp>
            <TextComp size={24} style={{ fontFamily: FontFamilty.bold, color: AppColors.white }}>{businessValue}</TextComp>
            </View>
            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.white50 }}>{AppStrings.totalbusiness}</TextComp>
        </View>
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

export default TotalBusinessComp;
