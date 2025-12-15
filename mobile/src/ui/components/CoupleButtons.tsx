import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';
import { AppStrings } from '../../constants/AppStrings';


const CoupleButtons = ({info}) => {

    return (
            <View style={styles.container}>
                    <TextComp size={12} children={AppStrings.cancel}/>
            </View>

    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection:'row',
        columnGap:16

    },

});

export default InfoModal;
