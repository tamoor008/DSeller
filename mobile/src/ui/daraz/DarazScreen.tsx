import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Header from '../components/Header';
import { AppStrings } from '../../constants/AppStrings';
import SelectStore from '../components/SelectStore';
import OrderTabs from './components/OrderTabs';


const DarazScreen = ({ navigation }) => {
    const { theme } = useTheme();





    


    const goBack = () => {
        navigation.goBack()
    }


    const styles = getStyles(theme);
    return (
        <View style={styles.container}>
            <Header title={AppStrings.daraz} info={AppStrings.darazInfo} goBack={goBack} />
            <SelectStore />
                <OrderTabs />
            {/* {tabs[1].selected && (
                <AdsTab />
            )} */}
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

export default DarazScreen;
