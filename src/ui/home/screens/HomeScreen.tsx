import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AppColors } from '../../../constants/AppColors';
import HomeHeader from '../components/HomeHeader';
import SelectStore from '../../components/SelectStore';
import TotalBusinessComp from '../../components/TotalBusinessComp';
import IndividualValueComp from '../../components/IndividualValueComp';
import { AppStrings } from '../../../constants/AppStrings';
import { AppScreens } from '../../../constants/AppScreens';


const HomeScreen = ({ navigation }) => {
    const navigateDaraz = () => {
        navigation.navigate(AppScreens.DarazScreen)
    }
    const navigateCash = () => {
        navigation.navigate(AppScreens.CashScreen)
    }
    const navigateStock = () => {
        navigation.navigate(AppScreens.StockScreen)
    }
    const navigatePackaging = () => {
        navigation.navigate(AppScreens.PackagingScreen)
    }

    return (
        <View style={styles.container}>
            <HomeHeader />
            <SelectStore />
            <TotalBusinessComp businessValue={'500,000'} />

            <View style={{ rowGap: 16 }}>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp onPress={navigateDaraz} amount={'400,000'} label={AppStrings.daraz} info={AppStrings.darazInfo} />
                    <IndividualValueComp onPress={navigateStock} amount={'50,000'} label={AppStrings.stock} info={AppStrings.stockInfo} />
                </View>
                <View style={{ flexDirection: 'row', columnGap: 16, }}>
                    <IndividualValueComp onPress={navigateCash} amount={'35,000'} label={AppStrings.cash} info={AppStrings.cashInfo} />
                    <IndividualValueComp onPress={navigatePackaging} amount={'15,000'} label={AppStrings.packaging} info={AppStrings.packagingInfo} />
                </View>
            </View>

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

export default HomeScreen;
