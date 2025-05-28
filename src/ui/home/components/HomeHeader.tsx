import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import { AppImages } from '../../../constants/AppImages';


const HomeHeader = () => {

    return (
        <View style={styles.container}>
            <Image style={{width:127,height:56}} source={AppImages.dsellerlogo}/>
            <TouchableOpacity activeOpacity={0.9}>
            <Image resizeMode='contain' style={{width:20,height:20}} source={AppImages.notification}/>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        alignItems: 'center',
        width:'100%',
        justifyContent:'space-between'
    },

});

export default HomeHeader;
