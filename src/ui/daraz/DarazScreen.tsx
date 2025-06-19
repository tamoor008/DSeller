import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';
import Header from '../components/Header';
import InfoModal from '../components/InfoModal';
import { AppStrings } from '../../constants/AppStrings';
import SelectStore from '../components/SelectStore';
import DarazTabs from './components/DarazTabs';
import OrderTabs from './components/OrderTabs';
import IncomeTab from './components/IncomeTab';
import AdsTab from './components/AdsTab';
import { useSelector } from 'react-redux';


const DarazScreen = ({ navigation }) => {




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
            <Header title={AppStrings.daraz} info={AppStrings.darazInfo} goBack={goBack} />
            <SelectStore />
            <DarazTabs toggleTabs={toggleTabs} tabs={tabs} />
            {tabs[0].selected && (
                <OrderTabs />
            )}
            {tabs[1].selected && (
                <IncomeTab />
            )}
            {tabs[2].selected && (
                <AdsTab />
            )}
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

export default DarazScreen;
