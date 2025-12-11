import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppColors } from '../../../constants/AppColors';
import { AppImages } from '../../../constants/AppImages';
import TextComp from '../../components/TextComp';
import FontFamilty from '../../../constants/FontFamilty';
import { AppStrings } from '../../../constants/AppStrings';

type HomeHeaderProps = {
    onOpenSettings?: () => void;
};

const HomeHeader: React.FC<HomeHeaderProps> = ({ onOpenSettings }) => {
    return (
        <View style={styles.container}>
            <Image style={{width:127,height:56}} source={AppImages.dsellerlogo}/>
            <View style={{flexDirection:'row',columnGap:16}}>
                <TouchableOpacity onPress={onOpenSettings} activeOpacity={0.8} style={{flexDirection:'row', alignItems:'center', columnGap:4}}>
                    <Icon name="settings-outline" size={16} color={AppColors.primaryOrange} />
                    <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: AppColors.primaryOrange }}>
                        {AppStrings.settings}
                    </TextComp>
                </TouchableOpacity>
            </View>
         
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        alignItems: 'center',
        width:'100%',
        justifyContent:'space-between'
    },

});

export default HomeHeader;
