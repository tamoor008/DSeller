import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import TextComp from '../../components/TextComp';
import { AppColors } from '../../../constants/AppColors';



const AdsTab = ({ }) => {
    const [isVisible, setIsvisible] = useState(false)


    const [income, setIncome] = useState({
        totalPrice: 0,
        income: [
            { id: 0, storeName: 'Swaat Enterprises', amount: 2000 },
            { id: 0, storeName: 'Tech Hunts', amount: 1000 },
        ],
    });


    const calculateAllTotals = (incomeObj) => {
        const totalPrice = incomeObj.income.reduce((sum, order) => sum + order.amount, 0);
        return {
            ...incomeObj,
            totalPrice,
        };
    };
    useEffect(() => {
        setIncome((prev) => calculateAllTotals(prev));
    }, []);






    return (

        <View style={{ rowGap: 16 }}>



            <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>


                <View style={{ paddingVertical: 8, paddingHorizontal: 16,rowGap:16 }}>
                    {income.income.map((item, index) =>
                        <View key={index} style={{ rowGap: 16 }}>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }} key={index}>
                                <View style={{ flex: 1 }}>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, textAlign: 'left' }}>{item.storeName}</TextComp>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                    <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.amount}</TextComp>
                                </View>

                            </View>

                            {index < income.income.length - 1 && (
                                <View style={{ height: 1, backgroundColor: AppColors.black25 }}></View>
                            )}
                        </View>
                    )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                    <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{income.totalPrice}</TextComp>
                    </View>
                </View>
            </View>


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

export default AdsTab;
