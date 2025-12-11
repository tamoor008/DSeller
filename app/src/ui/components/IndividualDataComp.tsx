import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { AppStrings } from '../../constants/AppStrings';
import FontFamilty from '../../constants/FontFamilty';
import TextComp from './TextComp';
import InfoModal from './InfoModal';


const IndividualDataComp = ({ data, label, onPress, info, loader }) => {
    const { theme } = useTheme();
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }
    const styles = getStyles(theme);
    return (
        <View style={styles.card}>
            {loader ?
                <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <ActivityIndicator color={theme.primaryOrange}></ActivityIndicator>
                </View>
                :
                <View style={styles.card2}>

                    <View style={styles.topRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            {/* <TextComp style={styles.currency}>Rs</TextComp> */}
                            <TextComp size={20} style={styles.data} numberOfLines={undefined}>{Math.floor(data)}</TextComp>
                        </View>

                        {/* <TouchableOpacity onPress={onInfoPress}>
                        <Image style={{ width: 16, height: 16 }} source={AppImages.info} />
                    </TouchableOpacity> */}
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={{ flex: 1 }}>
                            <TextComp size={16} style={styles.label} numberOfLines={undefined}>
                                {label}
                            </TextComp>
                        </View>
                        {onPress && (
                            <TouchableOpacity style={styles.arrowButton} onPress={onPress}>
                                <Icon name="chevron-forward" size={12} color={theme.white} />
                            </TouchableOpacity>
                        )}
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
    data: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: theme.textPrimary,
        marginHorizontal: 4,
    },
    bottomRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default IndividualDataComp;
