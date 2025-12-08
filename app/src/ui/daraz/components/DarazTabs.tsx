import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import { AppColors } from '../../../constants/AppColors';



const DarazTabs = ({ tabs,toggleTabs }) => {

    return (
        <View style={styles.container}>
            {tabs.map((item, index) => (
                <TouchableOpacity onPress={()=>{toggleTabs(index)}} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} key={index}>
                    <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: item.selected ? AppColors.primaryOrange : AppColors.black50 }}>{item.title}</TextComp>
                    {item.selected ? (
                        <View style={{ height: 2, backgroundColor: AppColors.primaryOrange, width: '100%' }}></View>
                    ):(
                        <View style={{ height: 2, width: '100%' }}></View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        columnGap: 8
    },

});

export default DarazTabs;
