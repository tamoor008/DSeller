import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';


const PackagingScreen = () => {

    return (
        <View style={styles.container}>
            <Text style={{ flex: 1, color: AppColors.black }}>Packaging</Text>
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

export default PackagingScreen;
