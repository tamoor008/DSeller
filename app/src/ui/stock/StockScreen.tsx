import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Header from '../components/Header';
import { AppStrings } from '../../constants/AppStrings';
import StockTab from './components/StockTab';



const StockScreen = ({ navigation }) => {
    const { theme } = useTheme();

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

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            <Header title={AppStrings.stock} info={AppStrings.stockInfo} goBack={goBack} />
            <StockTab />
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: theme.bgcolor,
        rowGap: 16,
    },
});

export default StockScreen;
