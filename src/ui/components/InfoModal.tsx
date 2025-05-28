import React from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../../constants/AppColors';
import TextComp from './TextComp';
import { AppImages } from '../../constants/AppImages';
import FontFamilty from '../../constants/FontFamilty';
import { AppStrings } from '../../constants/AppStrings';


const InfoModal = ({ info, setIsvisible }) => {

    return (
        <Modal transparent>
            <View style={styles.container}>
                <View style={{ backgroundColor: AppColors.white, padding: 16, borderRadius: 16, justifyContent: 'center', rowGap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center',paddingVertical:16 }}>
                        <TextComp style={{
                            flex:1,
                            textAlign:'center',
                            fontFamily: FontFamilty.semibold,
                            color:AppColors.black
                        }} size={16} children={AppStrings.info} />

                        <TouchableOpacity onPress={() => setIsvisible(false)} style={{ position:'absolute',right:0,alignSelf: 'center', backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.black25, borderRadius: 100, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Image style={{ width: 16, height: 16 }} source={AppImages.cross} />
                        </TouchableOpacity>
                    </View>
                    <TextComp style={styles.textStyle} size={12} children={info} />
                </View>
            </View>
        </Modal>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: AppColors.black25,
        rowGap: 16,
        justifyContent: 'center'
    },
    textStyle: {
        fontFamily: FontFamilty.regular,
        color: AppColors.black80,
    }

});

export default InfoModal;
