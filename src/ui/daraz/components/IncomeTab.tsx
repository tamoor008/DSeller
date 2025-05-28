import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../../constants/AppImages';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import InfoModal from '../../components/InfoModal';
import TextComp from '../../components/TextComp';
import { AppColors } from '../../../constants/AppColors';



const IncomeTab = ({ }) => {
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }

    const [income, setIncome] = useState({
        amountsettled: {
            totalPrice: 0,
            income: [
                { id: 0, storeName: 'Swaat Enterprises', date: '28 Apr 2025 - 04 May 2025', amount: 2000 },
                { id: 0, storeName: 'Tech Hunts', date: '28 Apr 2025 - 04 May 2025', amount: 1000 },
            ],
        },
        weekinprogress: {
            totalPrice: 0,
            income: [
                { id: 0, storeName: 'Swaat Enterprises', date: '28 Apr 2025 - 04 May 2025', amount: 500 },
                { id: 0, storeName: 'Tech Hunts', date: '28 Apr 2025 - 04 May 2025', amount: 400 },
            ],
        },

    });

    const [tabs, setTabs] = useState([
        {
            title: AppStrings.amountsettled,
            selected: true,
        },
        {
            title: AppStrings.weekinprogress,
            selected: false,
        },

    ])
    const calculateAllTotals = (ordersObj) => {
        const updated = {};

        for (const key in ordersObj) {
            const { income: orderList } = ordersObj[key];

            const totalPrice = orderList.reduce((sum, order) => sum + order.amount, 0);

            updated[key] = {
                ...ordersObj[key],
                totalPrice,
            };
        }

        return updated;
    };
    useEffect(() => {
        setIncome((prev) => calculateAllTotals(prev));
    }, []);




    const toggleTabs = (index) => {
        setTabs(prevTabs =>
            prevTabs.map((tab, i) => ({
                ...tab,
                selected: i === index
            }))
        );
    };

    useEffect(() => {
        setTabs([
            {
                title: AppStrings.amountsettled,
                selected: tabs.find(t => t.title === AppStrings.amountsettled)?.selected || false,
            },
            {
                title: AppStrings.weekinprogress,
                selected: tabs.find(t => t.title === AppStrings.weekinprogress)?.selected || false,
            },

        ]);
    }, [income]);
    return (

        <View style={{ rowGap: 16 }}>

            <View style={styles.container}>
                {tabs.map((item, index) => (
                    <TouchableOpacity onPress={() => { toggleTabs(index) }} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? AppColors.primaryOrange : AppColors.black25, borderRadius: 16, paddingVertical: 4, flexDirection: 'row', columnGap: 4 }} key={index}>
                        <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: item.selected ? AppColors.white : AppColors.black50, textAlign: 'center', }}>{item.title}</TextComp>

                    </TouchableOpacity>
                ))}


            </View>
            {tabs[0].selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>


                    <View style={{ paddingVertical: 8, paddingHorizontal: 16,rowGap:16}}>
                        {income.amountsettled.income.map((item, index) =>
                             <View key={index} style={{rowGap:16}}>
                             <View style={{ flexDirection: 'row', alignItems: 'center', }} >
                                 <View style={{ flex: 1 }}>
                                     <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, textAlign: 'left' }}>{item.storeName}</TextComp>
                                     <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'left' }}>{item.date}</TextComp>
                                 </View>

                                 <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                     <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                     <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.amount}</TextComp>
                                 </View>

                             </View>
                             { index < income.weekinprogress.income.length - 1&&(
                             <View style={{ height: 1, backgroundColor: AppColors.black25 }}></View>
                             )}
                         </View>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{income.amountsettled.totalPrice}</TextComp>
                        </View>
                    </View>
                </View>
            )}

            {tabs[1].selected && (

                <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>


                    <View  style={{ paddingVertical: 8, paddingHorizontal: 16, rowGap: 16 }}>
                        {income.weekinprogress.income.map((item, index) =>
                            <View key={index} style={{rowGap:16}}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', }} >
                                    <View style={{ flex: 1 }}>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, textAlign: 'left' }}>{item.storeName}</TextComp>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'left' }}>{item.date}</TextComp>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                        <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>{'Rs '}</TextComp>
                                        <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>{item.amount}</TextComp>
                                    </View>

                                </View>
                                { index < income.weekinprogress.income.length - 1&&(
                                <View style={{ height: 1, backgroundColor: AppColors.black25 }}></View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 8, backgroundColor: AppColors.primaryOrange, borderBottomEndRadius: 4, borderBottomLeftRadius: 4 }}>
                        <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2, }}>{AppStrings.total}</TextComp>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>{'Rs '}</TextComp>
                            <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>{income.weekinprogress.totalPrice}</TextComp>
                        </View>
                    </View>
                </View>
            )}

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

export default IncomeTab;
