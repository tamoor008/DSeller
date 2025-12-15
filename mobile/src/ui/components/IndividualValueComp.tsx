import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from './TextComp';
import InfoModal from './InfoModal';


const IndividualValueComp = ({ amount, label, onPress, info, loader }) => {
    const { theme } = useTheme();
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }
    const styles = getStyles(theme);
    return (
        <View style={styles.card}>
            {loader?
            <View style={{justifyContent:'center',alignItems:'center',flex:1}}>
                <ActivityIndicator color={theme.primaryOrange}></ActivityIndicator>
            </View>
            :
            <View style={styles.card2}>

                <View style={styles.topRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TextComp size={14} style={styles.currency}>Rs</TextComp>
                        <TextComp size={20} style={styles.amount}>{Math.floor(amount)}</TextComp>
                    </View>

                    <TouchableOpacity onPress={onInfoPress}>
                        <Icon name="information-circle-outline" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomRow}>
                    <TextComp size={16} style={styles.label}>{label}</TextComp>
                    <TouchableOpacity style={styles.arrowButton} onPress={onPress}>
                        <Icon name="chevron-forward" size={12} color={theme.white} />
                    </TouchableOpacity>
                </View>
            </View>
}
            {isVisible && (
                <InfoModal setIsvisible={setIsvisible} info={info} />
            )}
        </View>
    );
};



const getStyles = (theme: any) => StyleSheet.create({
    card: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    card2: {
    },
    topRow: {
        flexDirection: 'row',
    },
    currency: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: theme.textSecondary,
    },
    amount: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: theme.textPrimary,
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
        color: theme.textPrimary,
    },
    arrowButton: {
        backgroundColor: theme.primaryOrange,
        borderRadius: 16,
        padding: 6,
    },
});

export default IndividualValueComp;
