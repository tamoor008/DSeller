import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';


const CashScreen = () => {

    return (
        <View style={styles.container}>
            <Text style={{ flex: 1, color: AppColors.black }}>Cash</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

});

export default CashScreen;
