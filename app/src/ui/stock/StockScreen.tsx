import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';
import Header from '../components/Header';
import { AppStrings } from '../../constants/AppStrings';
import StockTab from './components/StockTab';



const StockScreen = ({ navigation }) => {




    const [tabs, setTabs] = useState([
        {
            title: AppStrings.orders,
            selected: true
        },
        {
            title: AppStrings.income,
            selected: false
        },
        {
            title: AppStrings.ads,
            selected: false
        },
    ])
    const toggleTabs = (index) => {
        setTabs(prevTabs =>
            prevTabs.map((tab, i) => ({
                ...tab,
                selected: i === index
            }))
        );
    };

    const goBack = () => {
        navigation.goBack()
    }


    return (
        <View style={styles.container}>
            <Header title={AppStrings.stock} info={AppStrings.stockInfo} goBack={goBack} />
            <StockTab />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: AppColors.bgcolor,
        rowGap: 16,

    },

});

export default StockScreen;
