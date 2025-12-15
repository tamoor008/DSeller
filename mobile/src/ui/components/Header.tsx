import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import TextComp from './TextComp';
import FontFamilty from '../../constants/FontFamilty';
import { AppStrings } from '../../constants/AppStrings';
import InfoModal from './InfoModal';


const Header = ({ goBack, info,title }) => {
    const { theme } = useTheme();
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={0.9} onPress={goBack}>
                <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <TextComp size={20} numberOfLines={1} style={{ fontFamily: FontFamilty.regular, flex: 1, color: theme.textPrimary }}>{title}</TextComp>
{info&&(
   <TouchableOpacity onPress={onInfoPress} activeOpacity={0.9}>
   <Icon name="information-circle" size={20} color={theme.textPrimary} />
</TouchableOpacity>
)}
         
            {isVisible && (
                <InfoModal setIsvisible={setIsvisible} info={info} />
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

export default Header;
