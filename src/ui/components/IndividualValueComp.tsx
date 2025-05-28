import React, { useState } from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../constants/AppImages';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';
import InfoModal from './InfoModal';


const IndividualValueComp = ({ amount, label, onPress, info }) => {
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <TextComp style={styles.currency}>Rs</TextComp>
                    <TextComp style={styles.amount}>{amount}</TextComp>
                </View>

                <TouchableOpacity onPress={onInfoPress}>
                    <Image style={{ width: 16, height: 16 }} source={AppImages.info} />
                </TouchableOpacity>
            </View>

            <View style={styles.bottomRow}>
                <TextComp style={styles.label}>{label}</TextComp>
                <TouchableOpacity style={styles.arrowButton} onPress={onPress}>
                    <Image resizeMode='contain' style={{ width: 12, height: 12 }} source={AppImages.arrow} />
                </TouchableOpacity>
            </View>
            {isVisible&&(
                <InfoModal setIsvisible={setIsvisible} info={info}/>
            )}
        </View>
    );
};



const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
    },
    currency: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#666',
    },
    amount: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: '#000',
        marginHorizontal: 4,
    },
    bottomRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
    arrowButton: {
        backgroundColor: '#f4511e', // orange
        borderRadius: 16,
        padding: 6,
    },
});

export default IndividualValueComp;
