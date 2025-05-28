import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppImages } from '../../constants/AppImages';
import TextComp from './TextComp';
import FontFamilty from '../../constants/FontFamilty';
import { AppStrings } from '../../constants/AppStrings';
import InfoModal from './InfoModal';


const Header = ({ goBack, info,title }) => {
    const [isVisible, setIsvisible] = useState(false)
    const onInfoPress = () => {
        setIsvisible(true)
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={0.9} onPress={goBack}>
                <Image resizeMode='contain' style={{ width: 24, height: 24 }} source={AppImages.back} />
            </TouchableOpacity>
            <TextComp size={20} style={{ FontFamilty: FontFamilty.regular, flex: 1 }}>{title}</TextComp>

            <TouchableOpacity onPress={onInfoPress} activeOpacity={0.9}>
                <Image resizeMode='contain' style={{ width: 20, height: 20 }} source={AppImages.infoblack} />
            </TouchableOpacity>
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
